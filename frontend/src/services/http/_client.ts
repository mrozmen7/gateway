/**
 * Shared HTTP client for the `http/` adapter family.
 *
 * Kept deliberately small. It knows:
 *  - where the API Gateway lives
 *  - how to attach the trace header so requests can be correlated end-to-end
 *  - how to normalize transport errors into AdapterError
 *
 * Auth is not yet implemented. When the identity-service is wired,
 * withAuth() will attach the bearer token from session state.
 */

import { env } from '@shared/config/env';
import type { AdapterError, Result } from '@shared/lib/result';
import { err, ok } from '@shared/lib/result';
import { authTokenStore } from './_auth';

export interface HttpRequestOptions {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly body?: unknown;
  readonly query?: Record<string, string | number | boolean | undefined>;
  readonly signal?: AbortSignal;
  readonly idempotencyKey?: string;
}

const buildUrl = (path: string, query?: HttpRequestOptions['query']): string => {
  const base = env.apiGatewayUrl;
  const url = base.startsWith('http')
    ? new URL(path.replace(/^\//, ''), `${base}/`)
    : new URL(`${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`, window.location.origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
};

const genTraceId = (): string =>
  // 16 hex chars — matches the audit-service traceId convention
  Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

export const http = async <T>(
  path: string,
  opts: HttpRequestOptions = {},
): Promise<Result<T, AdapterError>> => {
  try {
    const token = authTokenStore.get();
    const init: RequestInit = {
      method: opts.method ?? 'GET',
      headers: {
        accept: 'application/json',
        [env.traceHeader]: genTraceId(),
        ...(opts.body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.idempotencyKey ? { 'idempotency-key': opts.idempotencyKey } : {}),
      },
      ...(opts.body === undefined ? {} : { body: JSON.stringify(opts.body) }),
      ...(opts.signal ? { signal: opts.signal } : {}),
    };
    const res = await fetch(buildUrl(path, opts.query), init);

    if (res.status === 401)
      return err({ kind: 'unauthorized', message: 'Session expired or invalid.' });
    if (res.status === 403)
      return err({ kind: 'forbidden', message: 'Not authorized for this resource.' });
    if (res.status === 404)
      return err({ kind: 'notFound', message: 'Resource not found.' });
    if (res.status === 409) return err({ kind: 'conflict', message: 'Conflict.' });
    if (res.status === 429) {
      const retryAfter = res.headers.get('retry-after');
      return err(
        retryAfter
          ? { kind: 'rateLimited', message: 'Rate limited.', retryAfterMs: Number(retryAfter) * 1000 }
          : { kind: 'rateLimited', message: 'Rate limited.' },
      );
    }
    if (res.status >= 500)
      return err({ kind: 'server', message: 'Upstream error.', status: res.status });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { message?: string };
      return err({
        kind: 'validation',
        message: payload.message ?? 'Validation failed.',
      });
    }

    // 204 No Content
    if (res.status === 204) return ok(undefined as T);
    const data = (await res.json()) as T;
    return ok(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error';
    return err({ kind: 'network', message: msg });
  }
};
