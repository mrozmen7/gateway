import type { IIdentityService } from '../ports/identity.port';
import type { Result } from '@shared/lib/result';
import { err, ok } from '@shared/lib/result';
import type { Session, MfaChallenge } from '@entities/identity/model';
import { http } from './_client';
import { authTokenStore } from './_auth';

interface LoginResponseDto {
  readonly accessToken: string;
  readonly tokenType: string;
  readonly expiresInSeconds: number;
  readonly username: string;
  readonly role: string;
}

interface CurrentUserDto {
  readonly userId: string;
  readonly username: string;
  readonly role: string;
  readonly tokenId: string;
}

interface CustomerProfileDto {
  readonly userId: string;
  readonly username: string;
  readonly fullName: string;
  readonly preferredLanguage?: string;
  readonly email?: string;
}

/**
 * Real API Gateway contract:
 *   POST /api/v1/auth/login -> JWT contract
 *   GET  /api/v1/auth/me    -> current bearer principal
 */
export class HttpIdentityService implements IIdentityService {
  private async buildSessionFromPrincipal(principal: CurrentUserDto): Promise<Result<Session>> {
    const persona = principal.role === 'CUSTOMER' ? 'client' : 'operator';

    let displayName = prettyName(principal.username);
    let email = principal.username;
    let locale = 'en';

    if (persona === 'client') {
      const profile = await http<CustomerProfileDto>('/api/v1/customers/me');
      if (profile.ok) {
        displayName = profile.value.fullName || displayName;
        email = profile.value.email || principal.username;
        locale = profile.value.preferredLanguage || locale;
      }
    } else {
      displayName = operatorName(principal.username);
      email = principal.username;
    }

    return ok({
      userId: principal.userId,
      customerId: persona === 'client' ? principal.userId : null,
      displayName,
      email,
      persona,
      locale,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      deviceName: 'Browser session',
    });
  }

  login(params: { email: string; password: string }): Promise<
    Result<
      { status: 'mfa_required'; challenge: MfaChallenge } | { status: 'ok'; session: Session }
    >
  > {
    return (async () => {
      const username = normalizeUsername(params.email);
      const login = await http<LoginResponseDto>('/api/v1/auth/login', {
        method: 'POST',
        body: {
          username,
          password: params.password,
        },
      });
      if (!login.ok) return login;

      authTokenStore.set(login.value.accessToken);
      const session = await this.currentSession();
      if (!session.ok || !session.value) {
        return err({
          kind: 'unknown',
          message: 'Authenticated, but no session could be established.',
        });
      }

      return ok({ status: 'ok', session: session.value });
    })();
  }

  verifyMfa(_params: { challengeId: string; code: string }): Promise<Result<Session>> {
    return Promise.resolve(
      err({
        kind: 'validation',
        message: 'MFA is not required in the real backend flow.',
      }),
    );
  }

  currentSession(): Promise<Result<Session | null>> {
    return (async () => {
      if (!authTokenStore.get()) return ok(null);

      const me = await http<CurrentUserDto>('/api/v1/auth/me');
      if (!me.ok) {
        if (me.error.kind === 'unauthorized' || me.error.kind === 'forbidden') {
          authTokenStore.clear();
          return ok(null);
        }
        return me;
      }

      return this.buildSessionFromPrincipal(me.value);
    })();
  }

  logout(): Promise<Result<void>> {
    authTokenStore.clear();
    return Promise.resolve(ok(undefined));
  }
}

const normalizeUsername = (value: string): string =>
  value.includes('@') ? value.split('@')[0] || value : value;

const prettyName = (username: string): string =>
  username
    .split(/[.@_-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const operatorName = (username: string): string => {
  const known: Record<string, string> = {
    'marc.steiner': 'Marc Steiner',
    'audrey.keller': 'Audrey Keller',
  };
  return known[username] || prettyName(username);
};
