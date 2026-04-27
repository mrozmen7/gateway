import type { Config } from 'tailwindcss';

/**
 * Tailwind is intentionally thin here. All colors, radii, shadows, and type
 * tokens live in `src/shared/tokens/tokens.css` as CSS variables and are
 * referenced via `var(--token)`. This keeps the design system source-of-truth
 * in one place and makes theme switching (light/dark) a pure CSS concern.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    // Opinionated scale. No in-between sizes.
    fontSize: {
      '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.01em' }], // 11
      xs: ['0.75rem', { lineHeight: '1.125rem' }], // 12
      sm: ['0.8125rem', { lineHeight: '1.25rem' }], // 13
      base: ['0.875rem', { lineHeight: '1.375rem' }], // 14 — UI default
      md: ['1rem', { lineHeight: '1.5rem' }], // 16
      lg: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }], // 20
      xl: ['1.75rem', { lineHeight: '2.125rem', letterSpacing: '-0.015em' }], // 28
      '2xl': ['2.5rem', { lineHeight: '2.75rem', letterSpacing: '-0.02em' }], // 40
      '3xl': ['3.5rem', { lineHeight: '3.75rem', letterSpacing: '-0.025em' }], // 56
    },
    fontFamily: {
      sans: ['var(--font-sans)'],
      mono: ['var(--font-mono)'],
    },
    borderRadius: {
      none: '0',
      sm: 'var(--radius-sm)', // 4px
      DEFAULT: 'var(--radius-md)', // 6px
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)', // 8px — maximum
      full: '9999px',
    },
    // Single-pixel depth philosophy. No blurry shadows.
    boxShadow: {
      none: 'none',
      hairline: '0 1px 0 0 var(--color-rule)',
      'hairline-t': '0 -1px 0 0 var(--color-rule)',
      ring: '0 0 0 1px var(--color-rule)',
      'ring-ink': '0 0 0 1px var(--color-ink)',
      focus: '0 0 0 2px var(--color-accent-200)',
    },
    extend: {
      colors: {
        paper: 'var(--color-paper)',
        'paper-raised': 'var(--color-paper-raised)',
        'paper-sunken': 'var(--color-paper-sunken)',
        ink: 'var(--color-ink)',
        'ink-muted': 'var(--color-ink-muted)',
        'ink-subtle': 'var(--color-ink-subtle)',
        rule: 'var(--color-rule)',
        'rule-strong': 'var(--color-rule-strong)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-200': 'var(--color-accent-200)',
        credit: 'var(--color-credit)',
        debit: 'var(--color-debit)',
        warning: 'var(--color-warning)',
      },
      spacing: {
        // 8px baseline rhythm extensions
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      transitionTimingFunction: {
        swiss: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      transitionDuration: {
        '120': '120ms',
        '180': '180ms',
      },
    },
  },
  plugins: [],
};

export default config;
