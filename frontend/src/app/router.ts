import { createRouter } from '@tanstack/react-router';
import { Route as rootRoute } from './routes/__root';
import { publicLayoutRoute } from './routes/_public';
import { clientLayoutRoute } from './routes/_client';
import { opsLayoutRoute } from './routes/_ops';

import { loginRoute, oidcCallbackRoute } from '@pages/public/Login';
import { overviewRoute } from '@pages/client/Overview';
import { transferRoute } from '@pages/client/Transfer';
import { opsHealthRoute } from '@pages/ops/PlatformHealth';
import { opsInspectorRoute } from '@pages/ops/TransactionInspector';

// Layout composition: root → (public | client | ops) → leaf pages
const routeTree = rootRoute.addChildren([
  publicLayoutRoute.addChildren([loginRoute, oidcCallbackRoute]),
  clientLayoutRoute.addChildren([overviewRoute, transferRoute]),
  opsLayoutRoute.addChildren([opsHealthRoute, opsInspectorRoute]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
