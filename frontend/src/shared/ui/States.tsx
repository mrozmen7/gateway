import { type ReactNode } from 'react';
import { AlertCircle, FileText } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { Button } from './Button';

export const Skeleton = ({ className }: { className?: string }) => (
  <div
    className={cn(
      'animate-pulse rounded-sm bg-paper-sunken',
      className,
    )}
    aria-hidden="true"
  />
);

interface EmptyStateProps {
  readonly title: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  readonly action?: ReactNode;
  readonly className?: string;
}
export const EmptyState = ({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center py-20 px-6 text-center',
      className,
    )}
  >
    <div className="mb-4 text-ink-subtle">
      {icon ?? <FileText className="h-6 w-6" strokeWidth={1.25} />}
    </div>
    <h3 className="text-base font-medium text-ink mb-1">{title}</h3>
    {description ? (
      <p className="text-sm text-ink-muted max-w-sm">{description}</p>
    ) : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);

interface ErrorStateProps {
  readonly title?: string;
  readonly description?: string;
  readonly onRetry?: () => void;
  readonly className?: string;
}
export const ErrorState = ({
  title = 'Something went wrong',
  description = 'We couldn’t complete this request. Try again in a moment.',
  onRetry,
  className,
}: ErrorStateProps) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center py-20 px-6 text-center',
      className,
    )}
  >
    <div className="mb-4 text-[var(--color-debit)]">
      <AlertCircle className="h-6 w-6" strokeWidth={1.5} />
    </div>
    <h3 className="text-base font-medium text-ink mb-1">{title}</h3>
    <p className="text-sm text-ink-muted max-w-sm">{description}</p>
    {onRetry ? (
      <div className="mt-5">
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    ) : null}
  </div>
);
