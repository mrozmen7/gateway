import { type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeftRight, LogOut, Sparkles, Activity, Radar } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { useSession } from '@app/session.store';
import type { Persona } from '@entities/identity/model';

interface AppShellProps {
  readonly persona: Persona;
  readonly children: ReactNode;
}

interface NavItem {
  readonly to: string;
  readonly label: string;
  readonly icon: ReactNode;
}

const clientNav: readonly NavItem[] = [
  { to: '/', label: 'Overview', icon: <Sparkles className="h-4 w-4" strokeWidth={1.5} /> },
  { to: '/move', label: 'Move money', icon: <ArrowLeftRight className="h-4 w-4" strokeWidth={1.5} /> },
];

const opsNav: readonly NavItem[] = [
  { to: '/ops', label: 'Platform health', icon: <Activity className="h-4 w-4" strokeWidth={1.5} /> },
  { to: '/ops/inspector', label: 'Transaction inspector', icon: <Radar className="h-4 w-4" strokeWidth={1.5} /> },
];

export const AppShell = ({ persona, children }: AppShellProps) => {
  const session = useSession((s) => s.session);
  const signOut = useSession((s) => s.signOut);
  const nav = persona === 'client' ? clientNav : opsNav;

  return (
    <div className="min-h-screen bg-paper text-ink flex">
      {/* Sidebar */}
      <aside
        className="w-[248px] shrink-0 rule-r flex flex-col"
        style={{ minHeight: '100vh' }}
      >
        {/* Brand */}
        <div className="h-14 px-5 flex items-center rule-b">
          <Link to="/" className="flex items-center gap-2.5 text-ink">
            <div
              className="flex h-6 w-6 items-center justify-center text-[var(--color-on-accent)] rounded-sm font-semibold text-xs tracking-tight"
              style={{ background: 'var(--color-accent)' }}
            >
              H
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight">Helvetiq</span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-ink-subtle mt-0.5">
                {persona === 'client' ? 'Private Banking' : 'Operations'}
              </span>
            </div>
          </Link>
        </div>

        {/* Persona badge */}
        <div className="px-5 pt-5 pb-4 rule-b">
          <div className="text-2xs uppercase tracking-[0.12em] text-ink-subtle mb-1.5">
            Signed in
          </div>
          <div className="text-sm font-medium text-ink truncate">
            {session?.displayName ?? 'Guest'}
          </div>
          <div className="text-xs text-ink-muted truncate">
            {session?.email ?? '—'}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2.5">
          <ul className="space-y-0.5">
            {nav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="group flex items-center gap-3 h-8 px-3 rounded-sm text-sm text-ink-muted hover:text-ink hover:bg-paper-sunken transition-colors duration-120 ease-swiss [&.active]:bg-paper-sunken [&.active]:text-ink [&.active]:font-medium"
                  activeOptions={{ exact: item.to === '/' || item.to === '/ops' }}
                >
                  <span className="text-ink-subtle group-hover:text-ink group-[.active]:text-ink">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="rule-t p-2.5">
          <button
            type="button"
            onClick={() => {
              void signOut();
            }}
            className={cn(
              'w-full flex items-center gap-3 h-8 px-3 rounded-sm text-sm',
              'text-ink-muted hover:text-ink hover:bg-paper-sunken',
              'transition-colors duration-120 ease-swiss',
            )}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 flex flex-col">
        <TopBar persona={persona} />
        <div className="flex-1 overflow-auto">
          <div className="max-w-[1320px] mx-auto px-10 py-10">{children}</div>
        </div>
      </main>
    </div>
  );
};

const TopBar = ({ persona }: { persona: Persona }) => {
  return (
    <div className="h-14 rule-b flex items-center justify-between px-10">
      <div className="flex items-center gap-3 text-xs text-ink-subtle">
        <span className="font-mono tabular">14:32 · Zürich</span>
        <span className="text-ink-subtle">·</span>
        <span className="font-mono tabular">CHF 1.0000 / EUR 0.9612 / USD 0.9041</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xs uppercase tracking-[0.12em] text-ink-subtle">
          Workspace
        </span>
        <PersonaSwitcher current={persona} />
      </div>
    </div>
  );
};

const PersonaSwitcher = ({ current }: { current: Persona }) => (
  <div className="inline-flex bg-paper-sunken rounded-sm p-0.5 shadow-ring">
    <Link
      to="/"
      className={cn(
        'px-2.5 h-6 flex items-center text-xs rounded-[3px] transition-colors duration-120 ease-swiss',
        current === 'client' ? 'bg-paper text-ink shadow-ring font-medium' : 'text-ink-muted hover:text-ink',
      )}
    >
      Client
    </Link>
    <Link
      to="/ops"
      className={cn(
        'px-2.5 h-6 flex items-center text-xs rounded-[3px] transition-colors duration-120 ease-swiss',
        current === 'operator' ? 'bg-paper text-ink shadow-ring font-medium' : 'text-ink-muted hover:text-ink',
      )}
    >
      Operator
    </Link>
  </div>
);
