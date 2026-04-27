import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { env } from './shared/config/env';
import './i18n';
import './index.css';

/**
 * Boot sequence:
 *   1. If mocks are enabled, start the MSW worker BEFORE rendering. React will
 *      then see a world where every /api/* endpoint is served by the fake
 *      adapters — no conditional data-fetching code, no feature flags in
 *      components. The swap to the real gateway is a single env change.
 *   2. Render <App />.
 */
async function bootstrap(): Promise<void> {
  if (env.useMocks) {
    const { worker } = await import('./mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: '/mockServiceWorker.js' },
    });
    // eslint-disable-next-line no-console
    console.info(
      '%c[helvetiq]%c mocks enabled — all /api requests are intercepted by MSW.',
      'color:#1B2A3A;font-weight:600',
      'color:inherit',
    );
  }

  const container = document.getElementById('root');
  if (!container) throw new Error('Root element not found.');

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
