import { Outlet, createRoute, redirect } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { useSession } from '@app/session.store';

export const publicLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_public',
  beforeLoad: () => {
    const s = useSession.getState();
    if (s.status === 'authenticated' && s.session) {
      throw redirect({
        to: s.session.persona === 'operator' ? '/ops' : '/',
      });
    }
  },
  component: () => (
    <div className="min-h-screen bg-paper text-ink">
      <Outlet />
    </div>
  ),
});
