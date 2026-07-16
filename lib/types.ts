export type VerificationLevel = 0 | 1 | 2;

export interface Identity {
  id: string;
  user_id: string;
  verification_level: VerificationLevel;
  full_name: string | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  government_id_type: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  user_id: string;
  name: string;
  industry: string | null;
  api_key: string;
  created_at: string;
}

export type ConsentStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type Decision = 'approved' | 'rejected';

export interface ConsentRequest {
  id: string;
  business_id: string;
  target_email: string;
  requested_fields: string[];
  purpose: string;
  callback_url: string;
  status: ConsentStatus;
  consent_id: string | null;
  package_expires_at: string | null;
  created_at: string;
  resolved_at: string | null;
  businesses?: Pick<Business, 'name' | 'industry'>;
}

export interface ConsentDecision {
  id: string;
  request_id: string;
  user_id: string;
  decision: Decision;
  consent_id: string;
  decided_at: string;
}

export interface AuditLog {
  id: string;
  business_id: string;
  request_id: string | null;
  event: string;
  detail: Record<string, unknown> | null;
  created_at: string;
}

export interface IdentityPackage {
  user_id: string;
  verification_level: number;
  verified_at: string | null;
  full_name?: string;
  date_of_birth?: string;
  phone?: string;
  email?: string;
  address?: string;
  government_id_type?: string;
  consent_id: string;
  expires_at: string | null;
}

export const IDENTITY_FIELDS = [
  'full_name',
  'date_of_birth',
  'phone',
  'email',
  'address',
  'government_id_type',
] as const;

export type IdentityField = (typeof IDENTITY_FIELDS)[number];

export const FIELD_LABELS: Record<IdentityField, string> = {
  full_name: 'Full Name',
  date_of_birth: 'Date of Birth',
  phone: 'Phone Number',
  email: 'Email Address',
  address: 'Home Address',
  government_id_type: 'Government ID Type',
};

export const FIELD_ICONS: Record<IdentityField, string> = {
  full_name: 'User',
  date_of_birth: 'CalendarDays',
  phone: 'Phone',
  email: 'Mail',
  address: 'MapPin',
  government_id_type: 'CreditCard',
};
