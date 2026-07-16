'use client';

import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/brand';
import type { Identity } from '@/lib/types';
import { ShieldCheck, ShieldAlert, Shield, Lock, Calendar, Phone, Mail, MapPin, CreditCard, User } from 'lucide-react';

const LEVEL_CONFIG = {
  0: {
    label: 'Unverified',
    sublabel: 'No identity on file',
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-border',
    icon: ShieldAlert,
    glow: '',
  },
  1: {
    label: 'Level 1',
    sublabel: 'Basic details',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    icon: Shield,
    glow: '',
  },
  2: {
    label: 'Level 2',
    sublabel: 'Document verified',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    icon: ShieldCheck,
    glow: 'shadow-[0_0_40px_-8px_hsl(var(--primary)/0.3)]',
  },
} as const;

const FIELD_ICONS: Record<string, typeof User> = {
  full_name: User,
  date_of_birth: Calendar,
  phone: Phone,
  email: Mail,
  address: MapPin,
  government_id_type: CreditCard,
};

const FIELD_LABELS: Record<string, string> = {
  full_name: 'Full Name',
  date_of_birth: 'Date of Birth',
  phone: 'Phone',
  email: 'Email',
  address: 'Address',
  government_id_type: 'Gov. ID Type',
};

export function IdentityLedgerCard({
  identity,
  className,
  compact = false,
}: {
  identity: Identity | null;
  className?: string;
  compact?: boolean;
}) {
  const level = identity?.verification_level ?? 0;
  const config = LEVEL_CONFIG[level];
  const Icon = config.icon;

  const fields = identity
    ? ([
        { key: 'full_name', value: identity.full_name },
        { key: 'date_of_birth', value: identity.date_of_birth },
        { key: 'phone', value: identity.phone },
        { key: 'email', value: identity.email },
        { key: 'address', value: identity.address },
        { key: 'government_id_type', value: identity.government_id_type },
      ] as const)
    : [];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-card text-card-foreground transition-all',
        config.glow,
        className
      )}
    >
      {/* Decorative top band */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-primary/20" />

      {/* Header */}
      <div className="flex items-start justify-between p-5 pb-3">
        <div className="flex items-center gap-3">
          <BrandMark className="h-10 w-10" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Identity Ledger
            </p>
            <p className="text-sm font-semibold text-foreground">
              TrustPass Wallet
            </p>
          </div>
        </div>
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
            config.bg,
            config.border,
            config.color
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {config.label}
        </div>
      </div>

      {/* Verification status banner */}
      <div className="mx-5 mb-4">
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl border p-3',
            config.bg,
            config.border
          )}
        >
          <Icon className={cn('h-6 w-6 shrink-0', config.color)} />
          <div className="min-w-0">
            <p className={cn('text-sm font-semibold', config.color)}>
              {identity ? config.sublabel : 'No identity connected'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {identity?.verified_at
                ? `Verified ${new Date(identity.verified_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : 'Awaiting document upload'}
            </p>
          </div>
        </div>
      </div>

      {/* Identity fields */}
      {!compact && (
        <div className="px-5 pb-5">
          {identity && level > 0 ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              {fields.map(({ key, value }) => {
                const FieldIcon = FIELD_ICONS[key];
                const display = value
                  ? key === 'date_of_birth'
                    ? new Date(value).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                    : value
                  : '—';
                return (
                  <div key={key} className="min-w-0">
                    <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      <FieldIcon className="h-3 w-3" />
                      {FIELD_LABELS[key]}
                    </dt>
                    <dd className="mt-0.5 truncate text-sm font-medium text-foreground">
                      {display}
                    </dd>
                  </div>
                );
              })}
            </dl>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Lock className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {level === 0
                  ? 'Upload a document to mint your verified identity'
                  : 'Complete verification to unlock identity fields'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t bg-muted/30 px-5 py-3">
        <p className="font-mono text-[11px] text-muted-foreground">
          {identity ? `ID·${identity.id.slice(0, 8)}` : '—'}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {level === 2 ? 'Cryptographically attested' : 'Not attested'}
        </p>
      </div>
    </div>
  );
}
