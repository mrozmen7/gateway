/**
 * Result<T, E> — explicit success/failure at the adapter boundary.
 *
 * Adapters return Result so the caller can distinguish transport errors
 * (`{ ok: false, error: { kind: 'network' } }`) from domain errors
 * (`{ ok: false, error: { kind: 'validation', details } }`). TanStack Query
 * then unwraps Err into its error channel so components only see success.
 */

export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E = AdapterError> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

export const isOk = <T, E>(r: Result<T, E>): r is Ok<T> => r.ok;
export const isErr = <T, E>(r: Result<T, E>): r is Err<E> => !r.ok;

/** Throw on Err — for use inside TanStack Query queryFn bodies. */
export const unwrap = <T, E>(r: Result<T, E>): T => {
  if (r.ok) return r.value;
  throw r.error;
};

/** Canonical error shape. Every adapter narrows to one of these. */
export type AdapterError =
  | { kind: 'network'; message: string }
  | { kind: 'unauthorized'; message: string }
  | { kind: 'forbidden'; message: string }
  | { kind: 'notFound'; message: string }
  | { kind: 'validation'; message: string; details?: Record<string, string> }
  | { kind: 'conflict'; message: string }
  | { kind: 'rateLimited'; message: string; retryAfterMs?: number }
  | { kind: 'server'; message: string; status?: number }
  | { kind: 'unknown'; message: string };

export const networkError = (message: string): AdapterError => ({ kind: 'network', message });
export const unknownError = (message: string): AdapterError => ({ kind: 'unknown', message });
