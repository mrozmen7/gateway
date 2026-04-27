import type { ICustomerService } from '../ports/customer.port';
import type { Result } from '@shared/lib/result';
import { ok } from '@shared/lib/result';
import type { Customer } from '@entities/customer/model';
import { http } from './_client';

interface CustomerProfileDto {
  readonly userId: string;
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly residencyCountry: string;
  readonly preferredLanguage: string;
  readonly segment: string;
  readonly relationshipSince: string;
}

interface CustomerKycDto {
  readonly kycStatus: string;
}

export class HttpCustomerService implements ICustomerService {
  async getById(_customerId: string): Promise<Result<Customer>> {
    const [profile, kyc] = await Promise.all([
      http<CustomerProfileDto>('/api/v1/customers/me'),
      http<CustomerKycDto>('/api/v1/customers/me/kyc'),
    ]);
    if (!profile.ok) return profile;
    if (!kyc.ok) return kyc;

    return ok({
      id: profile.value.userId,
      displayName: profile.value.fullName,
      email: profile.value.email,
      phone: profile.value.phone,
      country: profile.value.residencyCountry,
      locale: profile.value.preferredLanguage,
      kycStatus: mapKycStatus(kyc.value.kycStatus),
      segment: mapSegment(profile.value.segment),
      createdAt: profile.value.relationshipSince,
      lastLoginAt: new Date().toISOString(),
    });
  }

  async search(query: string, limit = 20): Promise<Result<readonly Customer[]>> {
    const customer = await this.getById('');
    if (!customer.ok) return customer;
    const q = query.trim().toLowerCase();
    if (!q) return ok([customer.value].slice(0, limit));

    const haystack = `${customer.value.displayName} ${customer.value.email} ${customer.value.id}`.toLowerCase();
    return ok(haystack.includes(q) ? [customer.value].slice(0, limit) : []);
  }
}

const mapKycStatus = (value: string): Customer['kycStatus'] => {
  const normalized = value.toLowerCase();
  if (normalized === 'pending') return 'pending';
  if (normalized === 'review') return 'review';
  if (normalized === 'rejected') return 'rejected';
  return 'verified';
};

const mapSegment = (value: string): Customer['segment'] => {
  const normalized = value.toLowerCase();
  if (normalized === 'retail') return 'retail';
  if (normalized === 'premier') return 'premier';
  return 'private';
};
