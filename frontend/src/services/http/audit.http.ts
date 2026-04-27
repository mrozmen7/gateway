import type { IAuditService, AuditFilter, AuditPage } from '../ports/audit.port';
import type { Result } from '@shared/lib/result';
import { err, ok } from '@shared/lib/result';
import type { AuditEntry, RiskDecisionEntry, ServiceStatus } from '@entities/audit/model';
import { http } from './_client';
import { env } from '@shared/config/env';

interface AuditEventDto {
  readonly eventId: string;
  readonly actorUsername: string;
  readonly actorRole: string;
  readonly resource: string;
  readonly action: string;
  readonly outcome: string;
  readonly createdAt: string;
  readonly correlationId: string;
  readonly details?: string;
}

export class HttpAuditService implements IAuditService {
  async list(params: {
    filter: AuditFilter;
    cursor?: string;
    limit?: number;
  }): Promise<Result<AuditPage>> {
    const response = await http<readonly AuditEventDto[]>('/api/v1/audit/events/me');
    if (!response.ok) return response;

    const mapped = response.value.map(mapAuditEntry).filter((entry) => matchAudit(entry, params.filter));
    const start = params.cursor ? Number(params.cursor) : 0;
    const limit = params.limit ?? 25;
    const items = mapped.slice(start, start + limit);
    const nextCursor = start + limit < mapped.length ? String(start + limit) : null;
    return ok({ items, total: mapped.length, nextCursor });
  }

  async getByTraceId(traceId: string): Promise<Result<readonly AuditEntry[]>> {
    const page = await this.list({ filter: {}, limit: 200 });
    if (!page.ok) return page;
    return ok(page.value.items.filter((entry) => entry.traceId === traceId));
  }

  platformHealth(): Promise<Result<readonly ServiceStatus[]>> {
    return http<readonly ServiceStatus[]>('/api/v1/ops/platform-health');
  }

  async riskDecisions(limit = 8): Promise<Result<readonly RiskDecisionEntry[]>> {
    try {
      const url = new URL('/risk/decisions', env.riskServiceUrl);
      url.searchParams.set('limit', String(limit));
      const response = await fetch(url);

      if (!response.ok) {
        return err({ kind: 'server', message: 'Risk service unavailable.', status: response.status });
      }

      return ok((await response.json()) as readonly RiskDecisionEntry[]);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Risk service network error.';
      return err({ kind: 'network', message });
    }
  }
}

const mapAuditEntry = (dto: AuditEventDto): AuditEntry => ({
  id: dto.eventId,
  timestamp: dto.createdAt,
  actorId: dto.actorUsername,
  actorDisplayName: dto.actorUsername,
  actorType:
    dto.actorRole === 'CUSTOMER'
      ? 'customer'
      : dto.actorRole === 'OPS' || dto.actorRole === 'AUDITOR'
        ? 'operator'
        : 'system',
  action: dto.action,
  resource: dto.resource,
  resourceId: dto.details || dto.resource,
  severity:
    dto.outcome === 'FAILURE' ? 'warning' : dto.actorRole === 'AUDITOR' ? 'notice' : 'info',
  traceId: dto.correlationId,
});

const matchAudit = (entry: AuditEntry, filter: AuditFilter): boolean => {
  if (filter.from && entry.timestamp < filter.from) return false;
  if (filter.to && entry.timestamp > filter.to) return false;
  if (filter.actorId && entry.actorId !== filter.actorId) return false;
  if (filter.action && !entry.action.toLowerCase().includes(filter.action.toLowerCase())) return false;
  if (filter.severity?.length && !filter.severity.includes(entry.severity)) return false;
  if (filter.search) {
    const q = filter.search.toLowerCase();
    const haystack = `${entry.actorDisplayName} ${entry.action} ${entry.resource} ${entry.traceId}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
};
