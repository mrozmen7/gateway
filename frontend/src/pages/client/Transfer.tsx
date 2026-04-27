import { useMemo, useState } from 'react';
import { createRoute } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import { clientLayoutRoute } from '@app/routes/_client';
import { PageHeader } from '@shared/ui/PageHeader';
import { Button } from '@shared/ui/Button';
import { Input, Field } from '@shared/ui/Input';
import { Amount } from '@shared/ui/Amount';
import { AccountNumber, TransactionId, TraceId, Timestamp } from '@shared/ui/primitives';
import { Skeleton } from '@shared/ui/States';
import { services } from '@services/index';
import { unwrap } from '@shared/lib/result';
import { useSession } from '@app/session.store';
import { formatIban, isValidIban, normalizeIban } from '@shared/lib/iban';
import { fromMajor, formatMoney } from '@shared/lib/money';
import type { PaymentRail, PaymentQuote, PaymentReceipt } from '@entities/payment/model';
import { track } from '@shared/lib/telemetry';
import { cn } from '@shared/lib/cn';

// -- schema -------------------------------------------------------------------

const transferSchema = z.object({
  sourceAccountId: z.string().min(1, 'Select an account.'),
  counterpartyIban: z
    .string()
    .min(1, 'Recipient IBAN is required.')
    .refine((v) => isValidIban(v), { message: 'Invalid IBAN.' }),
  counterpartyName: z.string().min(2, 'Recipient name is required.'),
  amountMajor: z
    .string()
    .min(1, 'Amount is required.')
    .refine((v) => Number(v.replace(',', '.')) > 0, { message: 'Amount must be greater than zero.' }),
  rail: z.enum(['internal', 'sepa', 'sepa_instant', 'swift', 'qr_bill'] as const),
  reference: z.string().max(140).optional(),
  note: z.string().max(280).optional(),
});
type TransferValues = z.infer<typeof transferSchema>;

// -- stepper ------------------------------------------------------------------

const STEPS = ['Details', 'Review', 'Confirmation'] as const;
type Step = 0 | 1 | 2;

const Stepper = ({ step }: { step: Step }) => (
  <div className="flex items-center gap-3 mb-8">
    {STEPS.map((label, idx) => {
      const done = idx < step;
      const current = idx === step;
      return (
        <div key={label} className="flex items-center gap-3">
          <div
            className={cn(
              'flex items-center gap-2 text-xs',
              current ? 'text-ink font-medium' : done ? 'text-ink-muted' : 'text-ink-subtle',
            )}
          >
            <span
              className={cn(
                'inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] tabular',
                done && 'bg-ink text-paper',
                current && 'shadow-ring-ink bg-paper text-ink',
                !done && !current && 'shadow-ring bg-paper-sunken text-ink-subtle',
              )}
            >
              {done ? <Check className="h-3 w-3" strokeWidth={2} /> : idx + 1}
            </span>
            {label}
          </div>
          {idx < STEPS.length - 1 ? (
            <ChevronRight className="h-3 w-3 text-ink-subtle" strokeWidth={1.5} />
          ) : null}
        </div>
      );
    })}
  </div>
);

// -- page ---------------------------------------------------------------------

const TransferStudioPage = () => {
  const session = useSession((s) => s.session);
  const customerId = session?.customerId ?? '';
  const [step, setStep] = useState<Step>(0);
  const [quote, setQuote] = useState<PaymentQuote | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);

  const { data: accounts, isLoading: accLoading } = useQuery({
    queryKey: ['accounts', customerId],
    queryFn: async () => unwrap(await services.account.listForCustomer(customerId)),
  });

  const form = useForm<TransferValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      sourceAccountId: '',
      counterpartyIban: '',
      counterpartyName: '',
      amountMajor: '',
      rail: 'sepa',
      reference: '',
      note: '',
    },
  });

  const quoteMutation = useMutation({
    mutationFn: async (values: TransferValues) => {
      const intent = {
        sourceAccountId: values.sourceAccountId,
        counterpartyIban: normalizeIban(values.counterpartyIban),
        counterpartyName: values.counterpartyName,
        amount: fromMajor(Number(values.amountMajor.replace(',', '.')), 'CHF'),
        rail: values.rail as PaymentRail,
        reference: values.reference ?? '',
        note: values.note ?? '',
      };
      return unwrap(await services.payment.quote(intent));
    },
    onSuccess: (q) => {
      setQuote(q);
      setStep(1);
      track({ type: 'transfer.step', step: 1 });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!quote) throw new Error('No quote.');
      const idempotencyKey = crypto.randomUUID();
      return unwrap(
        await services.payment.confirm({
          quoteId: quote.quoteId,
          idempotencyKey,
        }),
      );
    },
    onSuccess: (r) => {
      setReceipt(r);
      setStep(2);
      track({ type: 'transfer.confirmed', transactionId: r.transactionId });
    },
  });

  const onDetailsSubmit = form.handleSubmit((values) => {
    track({ type: 'transfer.started' });
    quoteMutation.mutate(values);
  });

  return (
    <>
      <PageHeader
        eyebrow="Transfer Studio"
        title="Move money"
        description="Between your accounts, within Switzerland, or across SEPA."
      />

      <Stepper step={step} />

      {step === 0 ? (
        <form
          onSubmit={(e) => void onDetailsSubmit(e)}
          className="grid grid-cols-1 lg:grid-cols-[minmax(0,560px)_320px] gap-10"
        >
          <div className="space-y-6">
            <Field
              label="From account"
              htmlFor="source"
              error={form.formState.errors.sourceAccountId?.message}
            >
              {accLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Controller
                  control={form.control}
                  name="sourceAccountId"
                  render={({ field }) => (
                    <div className="rounded-sm shadow-ring bg-paper-sunken divide-y divide-[var(--color-rule)]">
                      {accounts?.map((acc) => (
                        <label
                          key={acc.id}
                          className={cn(
                            'flex items-center justify-between p-3 cursor-pointer',
                            'hover:bg-paper transition-colors duration-120 ease-swiss',
                            field.value === acc.id && 'bg-paper',
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              className="sr-only"
                              name={field.name}
                              checked={field.value === acc.id}
                              onChange={() => field.onChange(acc.id)}
                            />
                            <span
                              className={cn(
                                'inline-block h-3 w-3 rounded-full',
                                field.value === acc.id ? 'bg-ink' : 'shadow-ring bg-paper',
                              )}
                            />
                            <div>
                              <div className="text-sm font-medium text-ink">
                                {acc.displayName}
                              </div>
                              <AccountNumber iban={acc.iban} />
                            </div>
                          </div>
                          <Amount value={acc.availableBalance} size="sm" semantic={false} />
                        </label>
                      ))}
                    </div>
                  )}
                />
              )}
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field
                label="Recipient name"
                htmlFor="toName"
                error={form.formState.errors.counterpartyName?.message}
              >
                <Input
                  id="toName"
                  placeholder="e.g. Lukas Meier"
                  invalid={Boolean(form.formState.errors.counterpartyName)}
                  {...form.register('counterpartyName')}
                />
              </Field>
              <Field
                label="Recipient IBAN"
                htmlFor="toIban"
                error={form.formState.errors.counterpartyIban?.message}
              >
                <Input
                  id="toIban"
                  className="font-mono"
                  placeholder="CH93 0076 2011 6238 5295 7"
                  invalid={Boolean(form.formState.errors.counterpartyIban)}
                  {...form.register('counterpartyIban')}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-5">
              <Field
                label="Amount"
                htmlFor="amount"
                error={form.formState.errors.amountMajor?.message}
              >
                <Input
                  id="amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  leading="CHF"
                  className="text-right tabular"
                  invalid={Boolean(form.formState.errors.amountMajor)}
                  {...form.register('amountMajor')}
                />
              </Field>

              <Field label="Payment rail" htmlFor="rail">
                <Controller
                  control={form.control}
                  name="rail"
                  render={({ field }) => (
                    <select
                      id="rail"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="h-10 px-3 bg-paper-sunken rounded-sm shadow-ring text-sm text-ink outline-none focus:shadow-ring-ink"
                    >
                      <option value="internal">Internal — between your accounts</option>
                      <option value="sepa">SEPA — 1 business day</option>
                      <option value="sepa_instant">SEPA Instant — seconds</option>
                      <option value="swift">SWIFT — up to 3 business days</option>
                      <option value="qr_bill">Swiss QR-bill</option>
                    </select>
                  )}
                />
              </Field>
            </div>

            <Field label="Reference" htmlFor="ref" hint="Optional · visible to the recipient.">
              <Input id="ref" {...form.register('reference')} />
            </Field>

            {quoteMutation.isError ? (
              <div className="text-xs text-[var(--color-debit)] rule-t pt-3">
                {(quoteMutation.error as { message?: string })?.message ??
                  'Could not create quote.'}
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" type="button">
                Cancel
              </Button>
              <Button type="submit" loading={quoteMutation.isPending}>
                Continue
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
              </Button>
            </div>
          </div>

          <aside className="rule-l pl-10 self-start">
            <div className="text-2xs uppercase tracking-[0.12em] text-ink-subtle mb-3">
              About this transfer
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Helvetiq routes your instruction through the payment-service and posts
              it on the transaction-service ledger. Internal transfers between your
              own accounts settle instantly; SEPA and SWIFT routes are quoted with
              a fee and estimated arrival before you confirm.
            </p>
            <div className="rule-t mt-6 pt-4 space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-ink-subtle">Daily limit</span>
                <span className="tabular text-ink">CHF 50'000.00</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-subtle">Used today</span>
                <span className="tabular text-ink-muted">CHF 0.00</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-subtle">Requires SCA</span>
                <span className="text-ink">&gt; CHF 5'000</span>
              </div>
            </div>
          </aside>
        </form>
      ) : null}

      {step === 1 && quote ? (
        <ReviewStep
          quote={quote}
          onBack={() => setStep(0)}
          onConfirm={() => confirmMutation.mutate()}
          confirming={confirmMutation.isPending}
          error={
            confirmMutation.isError
              ? ((confirmMutation.error as { message?: string })?.message ??
                'Could not confirm.')
              : null
          }
        />
      ) : null}

      {step === 2 && receipt ? <ConfirmationStep receipt={receipt} quote={quote} /> : null}
    </>
  );
};

// -- steps --------------------------------------------------------------------

const ReviewStep = ({
  quote,
  onBack,
  onConfirm,
  confirming,
  error,
}: {
  quote: PaymentQuote;
  onBack: () => void;
  onConfirm: () => void;
  confirming: boolean;
  error: string | null;
}) => {
  const { intent, estimatedFee, estimatedArrival, quoteExpiresAt } = quote;
  const total = useMemo(
    () => fromMajor(Math.abs(intent.amount.amount / 100) + estimatedFee.amount / 100, intent.amount.currency),
    [intent.amount, estimatedFee],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,560px)_320px] gap-10">
      <div>
        <div className="py-8 mb-8 text-center rule-t rule-b">
          <div className="text-2xs uppercase tracking-[0.12em] text-ink-subtle mb-2">
            You are sending
          </div>
          <Amount value={intent.amount} size="xl" semantic={false} />
          <div className="text-xs text-ink-muted mt-2">
            to <span className="text-ink font-medium">{intent.counterpartyName}</span>
          </div>
          <div className="mt-1">
            <AccountNumber iban={intent.counterpartyIban} />
          </div>
        </div>

        <dl className="rule-t">
          <ReviewRow label="Payment rail" value={railLabel(intent.rail)} />
          <ReviewRow
            label="Estimated fee"
            value={estimatedFee.amount === 0 ? 'No fee' : formatMoney(estimatedFee)}
          />
          <ReviewRow
            label="Estimated arrival"
            value={<Timestamp value={estimatedArrival} />}
          />
          {intent.reference ? (
            <ReviewRow label="Reference" value={intent.reference} />
          ) : null}
          <ReviewRow
            label="Total debit"
            value={<Amount value={total} size="sm" semantic={false} />}
            emphasis
          />
        </dl>

        {error ? (
          <div className="text-xs text-[var(--color-debit)] rule-t pt-3 mt-4">{error}</div>
        ) : null}

        <div className="flex justify-end gap-2 mt-8">
          <Button variant="secondary" type="button" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            Back
          </Button>
          <Button onClick={onConfirm} loading={confirming}>
            Confirm transfer
          </Button>
        </div>
      </div>

      <aside className="rule-l pl-10 self-start">
        <div className="text-2xs uppercase tracking-[0.12em] text-ink-subtle mb-3">
          Quote
        </div>
        <div className="text-xs text-ink-muted leading-relaxed mb-4">
          Your quote is locked until{' '}
          <span className="text-ink font-mono">
            <Timestamp value={quoteExpiresAt} variant="precise" />
          </span>
          . After that, we'll re-quote before accepting.
        </div>
        <div className="rule-t pt-3 text-xs text-ink-muted space-y-2">
          <div>
            <span className="text-ink-subtle">Quote ID</span>{' '}
            <span className="font-mono text-ink">{quote.quoteId}</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

const ReviewRow = ({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: React.ReactNode;
  emphasis?: boolean;
}) => (
  <div className="rule-b py-3.5 flex items-baseline justify-between gap-6">
    <dt className="text-2xs uppercase tracking-[0.1em] text-ink-subtle">{label}</dt>
    <dd className={cn('text-sm', emphasis ? 'text-ink font-medium' : 'text-ink-muted')}>
      {value}
    </dd>
  </div>
);

const ConfirmationStep = ({
  receipt,
  quote,
}: {
  receipt: PaymentReceipt;
  quote: PaymentQuote | null;
}) => (
  <div className="max-w-2xl">
    <div
      className="h-10 w-10 rounded-full flex items-center justify-center mb-6"
      style={{ background: 'color-mix(in srgb, var(--color-credit) 14%, transparent)' }}
    >
      <Check className="h-5 w-5 text-[var(--color-credit)]" strokeWidth={2} />
    </div>
    <h2 className="text-xl font-semibold text-ink tracking-tight mb-1.5">
      Transfer submitted
    </h2>
    <p className="text-sm text-ink-muted mb-8">
      Your instruction is in flight. You'll see it posted in activity once the
      transaction-service confirms settlement.
    </p>

    <dl className="rule-t">
      <ReviewRow
        label="Transaction"
        value={<TransactionId id={receipt.transactionId} />}
      />
      <ReviewRow label="Trace" value={<TraceId id={receipt.traceId} />} />
      <ReviewRow label="Accepted at" value={<Timestamp value={receipt.acceptedAt} />} />
      {quote ? (
        <>
          <ReviewRow
            label="Amount"
            value={<Amount value={quote.intent.amount} size="sm" semantic={false} />}
          />
          <ReviewRow label="Recipient" value={quote.intent.counterpartyName} />
          <ReviewRow
            label="To"
            value={<span className="font-mono">{formatIban(quote.intent.counterpartyIban)}</span>}
          />
        </>
      ) : null}
    </dl>

    <div className="mt-8 flex gap-2">
      <Button variant="secondary" onClick={() => window.location.reload()}>
        New transfer
      </Button>
      <Button variant="ghost" asChild>
        <a href="/">Back to overview</a>
      </Button>
    </div>
  </div>
);

const railLabel = (rail: PaymentRail): string =>
  ({
    internal: 'Internal — between your accounts',
    sepa: 'SEPA — 1 business day',
    sepa_instant: 'SEPA Instant — seconds',
    swift: 'SWIFT — up to 3 business days',
    qr_bill: 'Swiss QR-bill',
  })[rail];

export const transferRoute = createRoute({
  getParentRoute: () => clientLayoutRoute,
  path: '/move',
  component: TransferStudioPage,
});
