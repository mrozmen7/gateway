/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCKS: string;
  readonly VITE_AUTH_MODE: string;
  readonly VITE_API_GATEWAY_URL: string;
  readonly VITE_OIDC_ISSUER_URL: string;
  readonly VITE_OIDC_CLIENT_ID: string;
  readonly VITE_TRACE_HEADER: string;
  readonly VITE_FEATURE_OPS_CONSOLE: string;
  readonly VITE_FEATURE_QR_BILL: string;
  readonly VITE_FEATURE_DARK_MODE: string;
  readonly VITE_DEFAULT_LOCALE: string;
  readonly VITE_SUPPORTED_LOCALES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
