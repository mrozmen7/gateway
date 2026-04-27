import { createRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Plus } from 'lucide-react';
import { clientLayoutRoute } from '@app/routes/_client';
import { PageHeader, SectionHeader } from '@shared/ui/PageHeader';
import { Button } from '@shared/ui/Button';
import { Amount } from '@shared/ui/Amount';
import {
  AccountNumber,
  Status,
  Timestamp,
  DeltaPill,
} from '@shared/ui/primitives';
import { Skeleton, EmptyState } from '@shared/ui/States';
import { services } from '@services/index';
import { unwrap } from '@shared/lib/result';
import { useSession } from '@app/session.store';
import { accountKindLabel } from '@entities/account/model';
import type { Account } from '@entities/account/model';
import { formatMoney, type Money } from '@shared/lib/money';

const useAccounts = (customerId: string) =>
  useQuery({
    queryKey: ['accounts', customerId],
    queryFn: async () => unwrap(await services.account.listForCustomer(customerId)),
  });

const useRecentTransactions = () =>
  useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: async () =>
      unwrap(await services.transaction.list({ filter: {}, limit: 8 })),
  });

const sumBalances = (accounts: readonly Account[]): Money => {
  const total = accounts.reduce((acc, a) => acc + a.balance.amount, 0);
  return { amount: total, currency: 'CHF' };
};

const OverviewPage = () => {
  const session = useSession((s) => s.session);
  const customerId = session?.customerId ?? '';
  const { data: accounts, isLoading: accLoading } = useAccounts(customerId);
  const { data: recent, isLoading: recentLoading } = useRecentTransactions();

  const total = accounts ? sumBalances(accounts) : null;

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={`Good afternoon, ${(session?.displayName ?? '').split(' ')[0]}`}
        description="A summary of your holdings at Helvetiq."
        actions={
          <Button variant="secondary" size="sm">
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Open account
          </Button>
        }
      />

      {/* Net position hero */}
      <section className="mb-12">
        <div className="rule-b pb-8">
          <div className="text-2xs uppercase tracking-[0.14em] text-ink-subtle mb-3">
            Total net position
          </div>
          {accLoading ? (
            <Skeleton className="h-12 w-80" />
          ) : total ? (
            <div className="flex items-end justify-between flex-wrap gap-6">
              <Amount value={total} size="xl" semantic={false} />
              <div className="flex items-center gap-6 text-xs text-ink-muted">
                <div>
                  <div className="uppercase tracking-[0.12em] text-ink-subtle text-[10px] mb-1">
                    30-day change
                  </div>
                  <DeltaPill value={1.42} />
                </div>
                <div>
                  <div className="uppercase tracking-[0.12em] text-ink-subtle text-[10px] mb-1">
                    YTD
                  </div>
                  <DeltaPill value={6.81} />
                </div>
                <div>
                  <div className="uppercase tracking-[0.12em] text-ink-subtle text-[10px] mb-1">
                    Since inception
                  </div>
                  <DeltaPill value={24.03} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Accounts */}
      <section className="mb-12">
        <SectionHeader
          title="Accounts"
          action={
            <Link
              to="/"
              className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-1"
            >
              View all
              <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
            </Link>
          }
        />
        {accLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-0 rule-t">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rule-b py-5">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-40" />
              </div>
            ))}
          </div>
        ) : accounts && accounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 rule-t">
            {accounts.map((acc) => (
              <AccountRow key={acc.id} account={acc} />
            ))}
          </div>
        ) : (
          <EmptyState title="No accounts yet" />
        )}
      </section>

      {/* Recent activity */}
      <section>
        <SectionHeader
          title="Recent activity"
          action={
            <Link
              to="/move"
              className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-1"
            >
              Move money
              <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
            </Link>
          }
        />
        {recentLoading ? (
          <div className="rule-t">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rule-b py-3.5 grid grid-cols-[1fr_auto] gap-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : recent && recent.items.length > 0 ? (
          <div className="rule-t">
            {recent.items.map((tx) => (
              <div
                key={tx.id}
                className="rule-b py-3.5 grid grid-cols-[1fr_auto_auto_auto] items-center gap-6"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm text-ink font-medium truncate">
                      {tx.counterpartyName}
                    </span>
                    <Status status={tx.status} />
                  </div>
                  <div className="text-xs text-ink-muted mt-0.5">
                    {tx.description}
                  </div>
                </div>
                <Timestamp value={tx.bookedAt} />
                <Amount
                  value={tx.amount}
                  size="sm"
                  signed
                  semantic
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No activity yet" />
        )}
      </section>
    </>
  );
};

const AccountRow = ({ account }: { account: Account }) => (
  <Link
    to="/"
    className="group rule-b py-5 flex items-start justify-between gap-6 hover:bg-paper-sunken/40 -mx-3 px-3 rounded-sm transition-colors duration-120 ease-swiss"
  >
    <div className="min-w-0">
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-sm text-ink font-medium">{account.displayName}</span>
        <span className="text-2xs uppercase tracking-[0.1em] text-ink-subtle">
          {accountKindLabel[account.kind]}
        </span>
      </div>
      <AccountNumber iban={account.iban} className="block" />
    </div>
    <div className="text-right shrink-0">
      <Amount value={account.balance} size="md" semantic={false} />
      <div className="text-2xs text-ink-subtle mt-0.5 tabular">
        {formatMoney(account.availableBalance, { hideCurrency: true })} available
      </div>
    </div>
  </Link>
);

export const overviewRoute = createRoute({
  getParentRoute: () => clientLayoutRoute,
  path: '/',
  component: OverviewPage,
});
