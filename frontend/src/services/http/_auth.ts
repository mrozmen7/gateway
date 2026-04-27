const TOKEN_KEY = 'helvetiq.access-token';

export const authTokenStore = {
  get(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  set(token: string): void {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore storage failures in demo mode
    }
  },

  clear(): void {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore storage failures in demo mode
    }
  },
};
