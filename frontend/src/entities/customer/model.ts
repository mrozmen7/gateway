export type KycStatus = 'verified' | 'pending' | 'review' | 'rejected';
export type CustomerSegment = 'retail' | 'premier' | 'private';

export interface Customer {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly phone: string;
  readonly country: string; // ISO 3166-1 alpha-2
  readonly locale: string;
  readonly kycStatus: KycStatus;
  readonly segment: CustomerSegment;
  readonly createdAt: string;
  readonly lastLoginAt: string;
}
