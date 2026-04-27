import { type ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

interface PageHeaderProps {
  readonly eyebrow?: string;
  readonly title: string;
  readonly description?: string;
  readonly actions?: ReactNode;
  readonly meta?: ReactNode;
  readonly className?: string;
}

export const PageHeader = ({
  eyebrow,
  title,
  description,
  actions,
  meta,
  className,
}: PageHeaderProps) => (
  <header className={cn('rule-b pb-6 mb-8', className)}>
    <div className="flex items-end justify-between gap-6">
      <div className="min-w-0">
        {eyebrow ? (
          <div className="text-2xs font-medium uppercase tracking-[0.12em] text-ink-subtle mb-2">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="text-xl font-semibold text-ink tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1.5 text-sm text-ink-muted max-w-prose">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0 flex items-center gap-2">{actions}</div> : null}
    </div>
    {meta ? <div className="mt-4 flex items-center gap-6 text-xs text-ink-muted">{meta}</div> : null}
  </header>
);

interface SectionHeaderProps {
  readonly title: string;
  readonly action?: ReactNode;
  readonly className?: string;
}

export const SectionHeader = ({ title, action, className }: SectionHeaderProps) => (
  <div
    className={cn(
      'flex items-baseline justify-between mb-3',
      className,
    )}
  >
    <h2 className="text-2xs font-medium uppercase tracking-[0.12em] text-ink-muted">
      {title}
    </h2>
    {action}
  </div>
);
