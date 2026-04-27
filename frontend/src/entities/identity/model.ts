export type Persona = 'client' | 'operator';

export interface Session {
  readonly userId: string;
  readonly customerId: string | null; // null for operators
  readonly displayName: string;
  readonly email: string;
  readonly persona: Persona;
  readonly locale: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly deviceName: string;
}

export interface MfaChallenge {
  readonly challengeId: string;
  readonly method: 'totp' | 'sms' | 'push';
  readonly maskedTarget: string;
  readonly expiresAt: string;
}
