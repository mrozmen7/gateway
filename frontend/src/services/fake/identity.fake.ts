import type { IIdentityService } from '../ports/identity.port';
import type { Result } from '@shared/lib/result';
import { err, ok } from '@shared/lib/result';
import type { Session, MfaChallenge } from '@entities/identity/model';
import { delay } from './_latency';
import { DEMO_CUSTOMER_ID } from './_fixtures';

const SESSION_KEY = 'helvetiq.session';

const readSession = (): Session | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
};

const writeSession = (s: Session | null): void => {
  if (s === null) sessionStorage.removeItem(SESSION_KEY);
  else sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
};

const buildSession = (persona: 'client' | 'operator'): Session => ({
  userId: persona === 'client' ? DEMO_CUSTOMER_ID : 'op_demo',
  customerId: persona === 'client' ? DEMO_CUSTOMER_ID : null,
  displayName: persona === 'client' ? 'Elena Brunner' : 'J. Meier',
  email: persona === 'client' ? 'elena.brunner@helvetiq.example' : 'j.meier@helvetiq.ops',
  persona,
  locale: 'de-CH',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
  deviceName: 'MacBook · Chrome',
});

export class FakeIdentityService implements IIdentityService {
  async login(params: { email: string; password: string }): Promise<
    Result<{ status: 'mfa_required'; challenge: MfaChallenge } | { status: 'ok'; session: Session }>
  > {
    await delay(240, 560);

    if (params.password.length < 4)
      return err({ kind: 'unauthorized', message: 'Invalid email or password.' });

    // Demo rule: elena@ => MFA path. ops@ => no MFA, operator persona.
    if (params.email.startsWith('ops')) {
      const session = buildSession('operator');
      writeSession(session);
      return ok({ status: 'ok', session });
    }

    const challenge: MfaChallenge = {
      challengeId: `chg_${Math.random().toString(36).slice(2, 10)}`,
      method: 'totp',
      maskedTarget: '•••• •• 67',
      expiresAt: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
    };
    return ok({ status: 'mfa_required', challenge });
  }

  async verifyMfa(params: { challengeId: string; code: string }): Promise<Result<Session>> {
    await delay(200, 420);
    if (params.code.replace(/\s+/g, '').length !== 6)
      return err({ kind: 'validation', message: 'Enter the 6-digit code.' });
    if (params.code === '000000')
      return err({ kind: 'unauthorized', message: 'Invalid code. Try again.' });
    const session = buildSession('client');
    writeSession(session);
    return ok(session);
  }

  async currentSession(): Promise<Result<Session | null>> {
    await delay(60, 140);
    return ok(readSession());
  }

  async logout(): Promise<Result<void>> {
    await delay(80, 140);
    writeSession(null);
    return ok(undefined);
  }
}
