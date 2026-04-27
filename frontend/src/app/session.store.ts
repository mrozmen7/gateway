import { create } from 'zustand';
import type { Session } from '@entities/identity/model';
import { services } from '@services/index';
import { unwrap } from '@shared/lib/result';

interface SessionState {
  readonly session: Session | null;
  readonly status: 'idle' | 'loading' | 'authenticated' | 'anonymous';
  readonly hydrate: () => Promise<void>;
  readonly setSession: (s: Session) => void;
  readonly signOut: () => Promise<void>;
}

export const useSession = create<SessionState>((set) => ({
  session: null,
  status: 'idle',

  hydrate: async () => {
    set({ status: 'loading' });
    const r = await services.identity.currentSession();
    if (r.ok && r.value) set({ session: r.value, status: 'authenticated' });
    else set({ session: null, status: 'anonymous' });
  },

  setSession: (s) => set({ session: s, status: 'authenticated' }),

  signOut: async () => {
    const r = await services.identity.logout();
    unwrap(r);
    set({ session: null, status: 'anonymous' });
  },
}));
