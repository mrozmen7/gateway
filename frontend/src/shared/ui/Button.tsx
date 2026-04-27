import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@shared/lib/cn';

const button = cva(
  [
    'inline-flex items-center justify-center gap-2 select-none',
    'font-medium whitespace-nowrap',
    'transition-colors duration-120 ease-swiss',
    'disabled:opacity-50 disabled:pointer-events-none',
    'focus-visible:outline-none',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-accent text-[var(--color-on-accent)]',
          'hover:bg-accent-hover',
        ],
        secondary: [
          'bg-paper text-ink',
          'shadow-ring hover:shadow-ring-ink',
        ],
        ghost: ['bg-transparent text-ink hover:bg-paper-sunken'],
        destructive: [
          'bg-[var(--color-debit)] text-[var(--color-paper)]',
          'hover:brightness-110',
        ],
        link: [
          'bg-transparent text-ink underline-offset-4 hover:underline px-0 h-auto',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
      radius: {
        sm: 'rounded-sm',
        md: 'rounded-md',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md', radius: 'sm' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  readonly asChild?: boolean;
  readonly loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, radius, asChild, loading, disabled, children, ...rest },
  ref,
) {
  const Comp = asChild ? Slot : 'button';

  if (asChild) {
    return (
      <Comp
        ref={ref}
        data-loading={loading ? 'true' : undefined}
        className={cn(button({ variant, size, radius }), className)}
        {...rest}
      >
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      ref={ref}
      data-loading={loading ? 'true' : undefined}
      disabled={disabled ?? loading}
      className={cn(button({ variant, size, radius }), className)}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent"
        />
      ) : null}
      {children}
    </Comp>
  );
});
