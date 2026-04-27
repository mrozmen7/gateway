import type { Result } from '@shared/lib/result';
import type {
  AuditEntry,
  AuditSeverity,
  RiskDecisionEntry,
  ServiceStatus,
} from '@entities/audit/model';

export interface AuditFilter {
  readonly from?: string;
  readonly to?: string;
  readonly actorId?: string;
  readonly severity?: readonly AuditSeverity[];
  readonly action?: string;
  readonly search?: string;
}

export interface AuditPage {
  readonly items: readonly AuditEntry[];
  readonly total: number;
  readonly nextCursor: string | null;
}

export interface IAuditService {
  list(params: { filter: AuditFilter; cursor?: string; limit?: number }): Promise<
    Result<AuditPage>
  >;
  getByTraceId(traceId: string): Promise<Result<readonly AuditEntry[]>>;
  platformHealth(): Promise<Result<readonly ServiceStatus[]>>;
  riskDecisions(limit?: number): Promise<Result<readonly RiskDecisionEntry[]>>;
}
