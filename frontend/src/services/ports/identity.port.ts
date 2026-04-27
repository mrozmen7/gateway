import type { Result } from '@shared/lib/result';
import type { Session, MfaChallenge } from '@entities/identity/model';

/** Maps to identity-service behind the API Gateway. */
export interface IIdentityService {
  login(params: { email: string; password: string }): Promise<
    Result<
      | { status: 'mfa_required'; challenge: MfaChallenge }
      | { status: 'ok'; session: Session }
    >
  >;

  verifyMfa(params: { challengeId: string; code: string }): Promise<Result<Session>>;

  currentSession(): Promise<Result<Session | null>>;

  logout(): Promise<Result<void>>;
}
