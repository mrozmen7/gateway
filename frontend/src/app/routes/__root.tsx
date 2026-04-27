import { Outlet, createRootRoute } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useSession } from '@app/session.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const Hydrator = () => {
  const hydrate = useSession((s) => s.hydrate);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    void hydrate().finally(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [hydrate]);
  if (!ready) return null;
  return <Outlet />;
};

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Hydrator />
    </QueryClientProvider>
  ),
});
