import { Outlet, createRoute, redirect } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { AppShell } from '@widgets/AppShell/AppShell';
import { useSession } from '@app/session.store';

export const opsLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_ops',
  beforeLoad: () => {
    const s = useSession.getState();
    if (s.status !== 'authenticated' || !s.session) {
      throw redirect({ to: '/login' });
    }
    // In a real system we'd check roles; here, persona suffices for the demo.
  },
  component: () => (
    <AppShell persona="operator">
      <Outlet />
    </AppShell>
  ),
});
