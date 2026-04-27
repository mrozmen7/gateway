import { createRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { opsLayoutRoute } from '@app/routes/_ops';
import { PageHeader, SectionHeader } from '@shared/ui/PageHeader';
import { HealthDot, Timestamp } from '@shared/ui/primitives';
import { EmptyState, ErrorState, Skeleton } from '@shared/ui/States';
import { services } from '@services/index';
import { unwrap } from '@shared/lib/result';
import type { RiskDecisionEntry, ServiceStatus } from '@entities/audit/model';
import { cn } from '@shared/lib/cn';

const PlatformHealthPage = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['ops', 'platform-health'],
    queryFn: async () => unwrap(await services.audit.platformHealth()),
    refetchInterval: 10_000,
  });

  const {
    data: riskDecisions,
    isLoading: riskLoading,
    isError: riskIsError,
    error: riskError,
    refetch: refetchRisk,
  } = useQuery({
    queryKey: ['ops', 'risk-decisions'],
    queryFn: async () => unwrap(await services.audit.riskDecisions(8)),
    refetchInterval: 10_000,
  });

  const healthy = data?.filter((s) => s.health === 'healthy').length ?? 0;
  const degraded = data?.filter((s) => s.health === 'degraded').length ?? 0;
  const down = data?.filter((s) => s.health === 'down').length ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Platform health"
        description="Live status of every service behind the Helvetiq API Gateway."
        meta={
          data ? (
            <>
              <span className="flex items-center gap-2">
                <HealthDot health="healthy" />
                {healthy} healthy
              </span>
              {degraded > 0 && (
                <span className="flex items-center gap-2">
                  <HealthDot health="degraded" />
                  {degraded} degraded
                </span>
              )}
              {down > 0 && (
                <span className="flex items-center gap-2">
                  <HealthDot health="down" />
                  {down} down
                </span>
              )}
              <span className="text-ink-subtle">Auto-refreshing every 10s</span>
            </>
          ) : null
        }
      />

      <SectionHeader
        title="Services"
        action={
          <Link
            to="/ops/inspector"
            className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-1"
          >
            Transaction inspector
            <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
          </Link>
        }
      />

      {isLoading ? (
        <div className="rule-t">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rule-b py-5">
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          className="rule-t rule-b"
          title="Platform health unavailable"
          description={errorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : data && data.length > 0 ? (
        <div className="rule-t">
          {data.map((svc) => <ServiceRow key={svc.service} svc={svc} />)}
        </div>
      ) : (
        <EmptyState
          className="rule-t rule-b"
          title="No service health yet"
          description="The operator API returned no service rows."
        />
      )}

      <SectionHeader title="Security decisions" className="mt-12" />

      {riskLoading ? (
        <div className="rule-t">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rule-b py-5">
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
      ) : riskIsError ? (
        <ErrorState
          className="rule-t rule-b"
          title="Security decisions unavailable"
          description={errorMessage(riskError)}
          onRetry={() => void refetchRisk()}
        />
      ) : riskDecisions && riskDecisions.length > 0 ? (
        <div className="rule-t">
          {riskDecisions.map((decision) => (
            <RiskDecisionRow key={decision.decisionId} decision={decision} />
          ))}
        </div>
      ) : (
        <EmptyState
          className="rule-t rule-b"
          title="No security decisions yet"
          description="Generate traffic through the API Gateway to publish api-events and let risk-service evaluate them."
        />
      )}
    </>
  );
};

const errorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return 'The request failed. Check authentication, service availability, or CORS configuration.';
};

const ServiceRow = ({ svc }: { svc: ServiceStatus }) => (
  <div
    className={cn(
      'rule-b py-4 grid gap-4 items-center',
      'grid-cols-[18px_minmax(200px,1.2fr)_repeat(5,minmax(0,1fr))_auto]',
      svc.health === 'degraded' && 'bg-[color-mix(in_srgb,var(--color-warning)_5%,transparent)]',
      svc.health === 'down' && 'bg-[color-mix(in_srgb,var(--color-debit)_6%,transparent)]',
    )}
  >
    <HealthDot health={svc.health} />

    <div className="min-w-0">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium text-ink">{svc.service}</span>
        <span className="text-2xs text-ink-subtle font-mono">v{svc.version}</span>
      </div>
      <div className="text-xs text-ink-muted mt-0.5">
        {svc.health === 'healthy'
          ? 'Operating normally'
          : svc.health === 'degraded'
            ? 'Elevated latency or error rate'
            : 'Service unavailable'}
      </div>
    </div>

    <Metric label="Uptime" value={`${svc.uptimePct.toFixed(3)}%`} />
    <Metric label="p50 / p95" value={`${svc.p50LatencyMs} / ${svc.p95LatencyMs}ms`} />
    <Metric label="p99" value={`${svc.p99LatencyMs}ms`} emphasis={svc.p99LatencyMs > 500} />
    <Metric label="req/min" value={svc.requestsPerMin.toLocaleString('de-CH')} />
    <Metric
      label="error rate"
      value={`${svc.errorRatePct.toFixed(2)}%`}
      emphasis={svc.errorRatePct > 0.1}
    />

    <div className="text-right text-2xs text-ink-subtle tabular whitespace-nowrap">
      {svc.kafkaLag != null ? (
        <div className="mb-0.5">
          <span className="text-ink-muted">Kafka lag </span>
          <span className={svc.kafkaLag > 100 ? 'text-[var(--color-warning)]' : 'text-ink'}>
            {svc.kafkaLag.toLocaleString('de-CH')}
          </span>
        </div>
      ) : null}
      <Timestamp value={svc.lastCheckedAt} variant="relative" />
    </div>
  </div>
);

const Metric = ({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) => (
  <div className="min-w-0">
    <div className="text-[10px] uppercase tracking-[0.12em] text-ink-subtle mb-0.5">
      {label}
    </div>
    <div
      className={cn(
        'text-sm font-mono tabular',
        emphasis ? 'text-[var(--color-warning)]' : 'text-ink',
      )}
    >
      {value}
    </div>
  </div>
);

const RiskDecisionRow = ({ decision }: { decision: RiskDecisionEntry }) => (
  <div
    className={cn(
      'rule-b py-4 grid gap-4 items-center',
      'grid-cols-[minmax(220px,1.3fr)_minmax(120px,0.7fr)_minmax(140px,0.8fr)_minmax(190px,1fr)_auto]',
      decision.decision === 'review' && 'bg-[color-mix(in_srgb,var(--color-debit)_6%,transparent)]',
      decision.decision === 'monitor' &&
        'bg-[color-mix(in_srgb,var(--color-warning)_5%,transparent)]',
    )}
  >
    <div className="min-w-0">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium text-ink">{decision.endpoint}</span>
        <span className="text-2xs text-ink-subtle font-mono">{decision.username}</span>
      </div>
      <div className="text-xs text-ink-muted mt-0.5">
        {decision.ipAddress} · {decision.correlationId}
      </div>
    </div>

    <Metric label="decision" value={decision.decision} emphasis={decision.decision !== 'allow'} />
    <Metric
      label="risk score"
      value={decision.riskScore.toFixed(2)}
      emphasis={decision.riskScore >= 0.3}
    />
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-[0.12em] text-ink-subtle mb-0.5">
        top factors
      </div>
      <div className="text-xs text-ink-muted truncate">
        {(decision.topFactors.length ? decision.topFactors : decision.reasons).join(', ')}
      </div>
      <div className="text-2xs text-ink-subtle font-mono mt-1">
        {decision.features.requestCount1m}/min · {decision.features.failedRequestCount5m} failed ·{' '}
        {decision.features.source}
      </div>
    </div>

    <div className="text-right text-2xs text-ink-subtle tabular whitespace-nowrap">
      <Timestamp value={decision.evaluatedAt} variant="relative" />
    </div>
  </div>
);

export const opsHealthRoute = createRoute({
  getParentRoute: () => opsLayoutRoute,
  path: '/ops',
  component: PlatformHealthPage,
});
