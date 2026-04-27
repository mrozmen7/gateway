import type { IAuditService, AuditFilter, AuditPage } from '../ports/audit.port';
import type { Result } from '@shared/lib/result';
import { ok } from '@shared/lib/result';
import type { AuditEntry, RiskDecisionEntry, ServiceStatus } from '@entities/audit/model';
import { db } from './_fixtures';
import { delay } from './_latency';

const match = (e: AuditEntry, f: AuditFilter): boolean => {
  if (f.from && e.timestamp < f.from) return false;
  if (f.to && e.timestamp > f.to) return false;
  if (f.actorId && e.actorId !== f.actorId) return false;
  if (f.severity && f.severity.length > 0 && !f.severity.includes(e.severity)) return false;
  if (f.action && !e.action.includes(f.action)) return false;
  if (f.search) {
    const q = f.search.toLowerCase();
    if (
      !`${e.action} ${e.actorDisplayName} ${e.resourceId} ${e.traceId}`
        .toLowerCase()
        .includes(q)
    )
      return false;
  }
  return true;
};

export class FakeAuditService implements IAuditService {
  async list(params: {
    filter: AuditFilter;
    cursor?: string;
    limit?: number;
  }): Promise<Result<AuditPage>> {
    await delay();
    const limit = params.limit ?? 25;
    const filtered = db.audit.filter((e) => match(e, params.filter));
    const start = params.cursor ? Number(params.cursor) : 0;
    const slice = filtered.slice(start, start + limit);
    const next = start + limit < filtered.length ? String(start + limit) : null;
    return ok({ items: slice, total: filtered.length, nextCursor: next });
  }

  async getByTraceId(traceId: string): Promise<Result<readonly AuditEntry[]>> {
    await delay();
    // For demo, synthesize a plausible audit chain for the trace.
    const now = Date.now();
    const entries: AuditEntry[] = [
      {
        id: `aud_${traceId.slice(0, 8)}_a`,
        timestamp: new Date(now - 320).toISOString(),
        actorId: 'cust_01HV7A3GKQZX',
        actorDisplayName: 'Elena Brunner',
        actorType: 'customer',
        action: 'payment.submit',
        resource: 'payment',
        resourceId: 'pay_submission',
        severity: 'info',
        traceId,
      },
      {
        id: `aud_${traceId.slice(0, 8)}_b`,
        timestamp: new Date(now - 200).toISOString(),
        actorId: 'system',
        actorDisplayName: 'system',
        actorType: 'system',
        action: 'account.funds.reserved',
        resource: 'account',
        resourceId: 'acc_current_01',
        severity: 'info',
        traceId,
      },
      {
        id: `aud_${traceId.slice(0, 8)}_c`,
        timestamp: new Date(now - 80).toISOString(),
        actorId: 'system',
        actorDisplayName: 'system',
        actorType: 'system',
        action: 'transaction.posted',
        resource: 'transaction',
        resourceId: 'tx_xxxxxxxx',
        severity: 'notice',
        traceId,
      },
    ];
    return ok(entries);
  }

  async platformHealth(): Promise<Result<readonly ServiceStatus[]>> {
    await delay(80, 180);
    return ok(db.services);
  }

  async riskDecisions(limit = 8): Promise<Result<readonly RiskDecisionEntry[]>> {
    await delay(80, 180);
    return ok(db.riskDecisions.slice(0, limit));
  }
}
