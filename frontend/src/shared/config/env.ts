/**
 * Env access happens here and only here. Everything else imports `env` /
 * `features` — keeps import.meta.env usage inspectable and testable.
 */

const bool = (v: string | undefined, fallback: boolean): boolean => {
  if (v === undefined) return fallback;
  return v === 'true' || v === '1';
};

const list = (v: string | undefined, fallback: string[]): string[] => {
  if (!v) return fallback;
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

export const env = {
  useMocks: bool(import.meta.env.VITE_USE_MOCKS, true),
  authMode: import.meta.env.VITE_AUTH_MODE || 'legacy',
  apiGatewayUrl: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8090',
  riskServiceUrl: import.meta.env.VITE_RISK_SERVICE_URL || 'http://localhost:8091',
  oidcIssuerUrl: import.meta.env.VITE_OIDC_ISSUER_URL || 'http://127.0.0.1:8089/realms/banking-platform',
  oidcClientId: import.meta.env.VITE_OIDC_CLIENT_ID || 'helvetiq-frontend',
  traceHeader: import.meta.env.VITE_TRACE_HEADER || 'X-Correlation-Id',
  defaultLocale: import.meta.env.VITE_DEFAULT_LOCALE || 'en',
  supportedLocales: list(import.meta.env.VITE_SUPPORTED_LOCALES, ['en', 'de']),
} as const;

export const features = {
  opsConsole: bool(import.meta.env.VITE_FEATURE_OPS_CONSOLE, true),
  qrBill: bool(import.meta.env.VITE_FEATURE_QR_BILL, true),
  darkMode: bool(import.meta.env.VITE_FEATURE_DARK_MODE, true),
} as const;

export type FeatureFlag = keyof typeof features;
