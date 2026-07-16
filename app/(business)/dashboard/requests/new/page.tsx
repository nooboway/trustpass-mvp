'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { IDENTITY_FIELDS, FIELD_LABELS, type IdentityField, type Business } from '@/lib/types';
import { toast } from 'sonner';
import {
  Send,
  Loader2,
  Building2,
  Mail,
  ShieldQuestion,
  Link as LinkIcon,
  CheckSquare,
  Square,
  ArrowRight,
  KeyRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NewRequestPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [targetEmail, setTargetEmail] = useState('');
  const [selectedFields, setSelectedFields] = useState<Set<IdentityField>>(new Set());
  const [purpose, setPurpose] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?next=/dashboard/requests/new');
      return;
    }
    if (!user) return;

    const fetchBusiness = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!data) {
        toast.error('No business profile found. Sign up as a business first.');
        router.push('/signup?role=business');
        return;
      }
      setBusiness(data as Business);
      setLoading(false);
    };
    fetchBusiness();
  }, [user, authLoading, router]);

  const toggleField = (field: IdentityField) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    if (selectedFields.size === 0) {
      toast.error('Select at least one field to request');
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('consent_requests')
      .insert({
        business_id: business.id,
        target_email: targetEmail,
        requested_fields: Array.from(selectedFields),
        purpose,
        callback_url: callbackUrl,
      })
      .select('id')
      .single();

    if (error) {
      toast.error('Failed to create request: ' + error.message);
      setSubmitting(false);
      return;
    }

    toast.success('Request sent to ' + targetEmail);
    router.push('/dashboard/requests');
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          New Identity Request
        </h1>
        <p className="mt-1 text-muted-foreground">
          Configure the payload you want to request from a user.
        </p>
      </div>

      {/* Business info + API key */}
      <Card className="bg-foreground text-background">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/10">
              <Building2 className="h-5 w-5 text-background" />
            </div>
            <div>
              <p className="font-semibold">{business?.name}</p>
              <p className="text-sm text-background/70">
                {business?.industry || 'Business account'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-background/10 px-3 py-2">
            <KeyRound className="h-4 w-4 text-background/70" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-background/60">
                API Key
              </p>
              <p className="font-mono text-xs text-background">
                {business?.api_key?.slice(0, 16)}...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Target user */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Target User
            </CardTitle>
            <CardDescription>
              The email of the TrustPass user whose identity you want to verify.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="email">User email</Label>
              <Input
                id="email"
                type="email"
                required
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Requested fields */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldQuestion className="h-4 w-4 text-muted-foreground" />
              Requested Fields
            </CardTitle>
            <CardDescription>
              Select exactly which identity fields you need. The user will see
              this list before approving.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {IDENTITY_FIELDS.map((field) => {
                const checked = selectedFields.has(field);
                return (
                  <button
                    key={field}
                    type="button"
                    onClick={() => toggleField(field)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all',
                      checked
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-border/80'
                    )}
                  >
                    {checked ? (
                      <CheckSquare className="h-5 w-5 shrink-0 text-primary" />
                    ) : (
                      <Square className="h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {FIELD_LABELS[field]}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {selectedFields.size} field{selectedFields.size !== 1 && 's'} selected
            </p>
          </CardContent>
        </Card>

        {/* Purpose */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldQuestion className="h-4 w-4 text-muted-foreground" />
              Stated Purpose
            </CardTitle>
            <CardDescription>
              Why are you requesting this data? Be specific — the user will see this.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Account opening KYC verification"
            />
          </CardContent>
        </Card>

        {/* Callback URL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              Callback URL
            </CardTitle>
            <CardDescription>
              Where the user will be redirected after approving. Use the simulator
              URL to test the full handoff.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              required
              type="url"
              value={callbackUrl}
              onChange={(e) => setCallbackUrl(e.target.value)}
              placeholder="https://your-app.com/kyc/callback"
            />
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary/5 p-3">
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Tip:</span> Use{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  {typeof window !== 'undefined' ? window.location.origin : 'https://your-app'}/dashboard/simulator
                </code>{' '}
                as the callback to see the full handoff in the TrustPass simulator.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/requests')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send request
          </Button>
        </div>
      </form>
    </div>
  );
}
