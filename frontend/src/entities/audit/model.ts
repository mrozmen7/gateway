export type AuditSeverity = 'info' | 'notice' | 'warning' | 'critical';

export interface AuditEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly actorId: string;
  readonly actorDisplayName: string;
  readonly actorType: 'customer' | 'operator' | 'system';
  readonly action: string;
  readonly resource: string;
  readonly resourceId: string;
  readonly severity: AuditSeverity;
  readonly traceId: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export type ServiceName =
  | 'api-gateway'
  | 'identity-service'
  | 'customer-service'
  | 'account-service'
  | 'payment-service'
  | 'transaction-service'
  | 'audit-service'
  | 'notification-service';

export type ServiceHealth = 'healthy' | 'degraded' | 'down';

export interface ServiceStatus {
  readonly service: ServiceName;
  readonly health: ServiceHealth;
  readonly version: string;
  readonly uptimePct: number; // 0–100
  readonly p50LatencyMs: number;
  readonly p95LatencyMs: number;
  readonly p99LatencyMs: number;
  readonly requestsPerMin: number;
  readonly errorRatePct: number;
  readonly kafkaLag?: number; // messages behind, when applicable
  readonly lastCheckedAt: string;
}

export type RiskDecision = 'allow' | 'monitor' | 'review' | 'step_up' | 'block';

export interface RiskFeatures {
  readonly requestCount1m: number;
  readonly requestCount5m: number;
  readonly failedRequestCount5m: number;
  readonly endpointDiversity5m: number;
  readonly distinctIpCountByUser5m: number;
  readonly distinctUserCountByIp5m: number;
  readonly secondsSinceLastRequest?: number | null;
  readonly offHours: boolean;
  readonly source: string;
}

export interface RiskDecisionEntry {
  readonly decisionId: string;
  readonly evaluatedAt: string;
  readonly eventId: string;
  readonly correlationId: string;
  readonly userId: string;
  readonly username: string;
  readonly ipAddress: string;
  readonly endpoint: string;
  readonly riskScore: number;
  readonly ruleScore: number;
  readonly mlScore: number;
  readonly decision: RiskDecision;
  readonly reasons: readonly string[];
  readonly topFactors: readonly string[];
  readonly features: RiskFeatures;
  readonly source: string;
  readonly modelVersion: string;
}
