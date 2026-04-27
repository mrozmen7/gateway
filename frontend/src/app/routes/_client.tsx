import { Outlet, createRoute, redirect } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { AppShell } from '@widgets/AppShell/AppShell';
import { useSession } from '@app/session.store';

export const clientLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_client',
  beforeLoad: () => {
    const s = useSession.getState();
    if (s.status !== 'authenticated' || !s.session) {
      throw redirect({ to: '/login' });
    }
    if (s.session.persona !== 'client') {
      throw redirect({ to: '/ops' });
    }
  },
  component: () => (
    <AppShell persona="client">
      <Outlet />
    </AppShell>
  ),
});
