import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly invalid?: boolean;
  readonly leading?: ReactNode;
  readonly trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, leading, trailing, ...rest },
  ref,
) {
  return (
    <div
      className={cn(
        'flex h-10 items-center gap-2 bg-paper-sunken px-3',
        'rounded-sm shadow-ring',
        invalid ? 'shadow-[0_0_0_1px_var(--color-debit)]' : '',
        'focus-within:shadow-ring-ink',
        'transition-shadow duration-120 ease-swiss',
      )}
    >
      {leading ? (
        <span className="shrink-0 text-ink-subtle text-xs">{leading}</span>
      ) : null}
      <input
        ref={ref}
        className={cn(
          'w-full bg-transparent text-sm text-ink placeholder:text-ink-subtle',
          'outline-none border-0',
          className,
        )}
        aria-invalid={invalid ? 'true' : undefined}
        {...rest}
      />
      {trailing ? (
        <span className="shrink-0 text-ink-subtle text-xs">{trailing}</span>
      ) : null}
    </div>
  );
});

export interface FieldProps {
  readonly label: string;
  readonly hint?: ReactNode;
  readonly error?: string | undefined;
  readonly required?: boolean;
  readonly children: ReactNode;
  readonly htmlFor?: string;
}

export const Field = ({ label, hint, error, required, children, htmlFor }: FieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label
      htmlFor={htmlFor}
      className="text-2xs uppercase tracking-[0.08em] text-ink-muted font-medium"
    >
      {label}
      {required ? <span className="ml-1 text-[var(--color-debit)]">*</span> : null}
    </label>
    {children}
    {error ? (
      <p className="text-xs text-[var(--color-debit)]">{error}</p>
    ) : hint ? (
      <p className="text-xs text-ink-subtle">{hint}</p>
    ) : null}
  </div>
);
