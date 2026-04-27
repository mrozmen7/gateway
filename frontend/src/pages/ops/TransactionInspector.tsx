import { useState } from 'react';
import { createRoute } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { Search, Zap } from 'lucide-react';
import { opsLayoutRoute } from '@app/routes/_ops';
import { PageHeader, SectionHeader } from '@shared/ui/PageHeader';
import { Button } from '@shared/ui/Button';
import { Input, Field } from '@shared/ui/Input';
import { Amount } from '@shared/ui/Amount';
import {
  AccountNumber,
  Status,
  TransactionId,
  TraceId,
  Timestamp,
} from '@shared/ui/primitives';
import { EmptyState, Skeleton } from '@shared/ui/States';
import { services } from '@services/index';
import type { Transaction, TransactionStep } from '@entities/transaction/model';
import { cn } from '@shared/lib/cn';
import { track } from '@shared/lib/telemetry';

const TransactionInspectorPage = () => {
  const [query, setQuery] = useState('');
  const [tx, setTx] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookup = useMutation({
    mutationFn: async (q: string) => {
      // Accept either a trace ID or a transaction ID; fall back to sample data.
      const byTrace = await services.transaction.getByTraceId(q);
      if (byTrace.ok) return byTrace.value;
      const byId = await services.transaction.getById(q);
      if (byId.ok) return byId.value;
      throw new Error('No transaction matches that ID.');
    },
    onSuccess: (t) => {
      setTx(t);
      setError(null);
      track({ type: 'ops.transaction.inspected', transactionId: t.id });
    },
    onError: (e) => setError((e as Error).message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length === 0) return;
    lookup.mutate(query.trim());
  };

  const onUseSample = async (): Promise<void> => {
    const r = await services.transaction.list({ filter: {}, limit: 1 });
    if (r.ok && r.value.items[0]) {
      setQuery(r.value.items[0].traceId);
      lookup.mutate(r.value.items[0].traceId);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Transaction inspector"
        description="Follow a payment across the Helvetiq microservice mesh — from gateway ingress through to notification emission."
      />

      <form
        onSubmit={onSubmit}
        className="rule-b pb-8 mb-10 grid grid-cols-[minmax(0,480px)_auto_auto] gap-3 items-end"
      >
        <Field label="Trace ID or transaction ID" htmlFor="trace">
          <Input
            id="trace"
            leading={<Search className="h-3.5 w-3.5" strokeWidth={1.5} />}
            placeholder="e.g. 9f3a2c12b48d1a7e"
            className="font-mono"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field>
        <Button type="submit" loading={lookup.isPending}>
          Inspect
        </Button>
        <Button variant="ghost" type="button" onClick={() => void onUseSample()}>
          <Zap className="h-3.5 w-3.5" strokeWidth={1.5} />
          Sample
        </Button>
      </form>

      {lookup.isPending ? <InspectorSkeleton /> : null}

      {error && !lookup.isPending ? (
        <EmptyState title="No match" description={error} />
      ) : null}

      {tx && !lookup.isPending ? <InspectorView tx={tx} /> : null}

      {!tx && !lookup.isPending && !error ? (
        <EmptyState
          title="Start an inspection"
          description="Paste a trace ID from client activity, or click Sample to load one from the fixture store."
          action={
            <Button variant="secondary" size="sm" onClick={() => void onUseSample()}>
              Load sample trace
            </Button>
          }
        />
      ) : null}
    </>
  );
};

const InspectorSkeleton = () => (
  <div className="space-y-8">
    <Skeleton className="h-20 w-full" />
    <Skeleton className="h-96 w-full" />
  </div>
);

const InspectorView = ({ tx }: { tx: Transaction }) => (
  <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-12">
    {/* Timeline */}
    <section>
      <SectionHeader title="Service timeline" />
      <ServiceTimeline steps={tx.steps} />
    </section>

    {/* Transaction meta */}
    <aside>
      <SectionHeader title="Transaction" />
      <div className="rule-t">
        <Row label="Counterparty" value={tx.counterpartyName} />
        {tx.counterpartyIban ? (
          <Row label="IBAN" value={<AccountNumber iban={tx.counterpartyIban} />} />
        ) : null}
        <Row
          label="Amount"
          value={<Amount value={tx.amount} size="sm" semantic={false} />}
        />
        <Row label="Status" value={<Status status={tx.status} />} />
        <Row label="Booked" value={<Timestamp value={tx.bookedAt} />} />
        <Row label="Transaction" value={<TransactionId id={tx.id} />} />
        <Row label="Trace" value={<TraceId id={tx.traceId} />} />
        {tx.reference ? (
          <Row label="Reference" value={<span className="font-mono">{tx.reference}</span>} />
        ) : null}
      </div>

      <div className="rule-t mt-8 pt-6 text-xs text-ink-muted leading-relaxed">
        <div className="text-2xs uppercase tracking-[0.12em] text-ink-subtle mb-2">
          Trace summary
        </div>
        <p>
          This payment crossed{' '}
          <span className="text-ink font-medium">{tx.steps.length}</span> services and
          completed end-to-end in{' '}
          <span className="text-ink font-medium tabular">
            {tx.steps.reduce((s, x) => s + x.durationMs, 0)} ms
          </span>
          . Events were emitted to Kafka via the outbox pattern and consumed by
          audit-service and notification-service in parallel.
        </p>
      </div>
    </aside>
  </div>
);

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rule-b py-3 flex items-baseline justify-between gap-6">
    <span className="text-2xs uppercase tracking-[0.1em] text-ink-subtle">{label}</span>
    <span className="text-sm text-ink-muted text-right">{value}</span>
  </div>
);

const ServiceTimeline = ({ steps }: { steps: readonly TransactionStep[] }) => {
  const total = steps.reduce((s, x) => s + x.durationMs, 0);
  const t0 = new Date(steps[0]?.startedAt ?? 0).getTime();

  return (
    <div className="rule-t">
      {steps.map((step, idx) => {
        const offsetMs = new Date(step.startedAt).getTime() - t0;
        const offsetPct = (offsetMs / total) * 100;
        const widthPct = (step.durationMs / total) * 100;
        return (
          <div key={idx} className="rule-b py-4 grid grid-cols-[20px_220px_1fr_80px] gap-4 items-center">
            <div className="relative flex justify-center">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  step.status === 'ok' && 'bg-[var(--color-credit)]',
                  step.status === 'pending' && 'bg-[var(--color-warning)]',
                  step.status === 'error' && 'bg-[var(--color-debit)]',
                )}
              />
              {idx < steps.length - 1 ? (
                <span className="absolute top-3 bottom-[-18px] w-px bg-rule" />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-ink">{step.service}</div>
              <div className="text-xs text-ink-muted font-mono truncate">
                {step.action}
              </div>
              {step.note ? (
                <div className="text-2xs text-ink-subtle mt-0.5">{step.note}</div>
              ) : null}
            </div>
            {/* Gantt */}
            <div className="relative h-6 bg-paper-sunken rounded-sm overflow-hidden">
              <div
                className="absolute inset-y-0 bg-ink/80 rounded-sm"
                style={{
                  left: `${offsetPct}%`,
                  width: `${Math.max(widthPct, 0.8)}%`,
                  transition: 'width 180ms var(--ease-swiss)',
                }}
              />
              <div
                className="absolute inset-y-0 flex items-center text-2xs tabular px-1.5 text-ink-subtle"
                style={{ left: `${Math.min(offsetPct + widthPct + 1, 92)}%` }}
              >
                +{offsetMs}ms
              </div>
            </div>
            <div className="text-right text-xs font-mono tabular text-ink">
              {step.durationMs}ms
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const opsInspectorRoute = createRoute({
  getParentRoute: () => opsLayoutRoute,
  path: '/ops/inspector',
  component: TransactionInspectorPage,
});
