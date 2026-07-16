'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { ConsentRequest, Identity } from '@/lib/types';
import { FIELD_LABELS, FIELD_ICONS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import {
  ShieldCheck,
  ShieldX,
  Loader2,
  Building2,
  ArrowRight,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Clock,
} from 'lucide-react';
import {
  User,
  CalendarDays,
  Phone,
  Mail,
  MapPin,
  CreditCard,
} from 'lucide-react';

const FIELD_ICON_COMPONENTS: Record<string, typeof User> = {
  full_name: User,
  date_of_birth: CalendarDays,
  phone: Phone,
  email: Mail,
  address: MapPin,
  government_id_type: CreditCard,
};

export default function HandoffGateway() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const requestId = params.requestId as string;

  const [request, setRequest] = useState<ConsentRequest | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState<'approved' | 'rejected' | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!user || !requestId) return;

    const fetchData = async () => {
      const supabase = createClient();
      const [{ data: req }, { data: ident }] = await Promise.all([
        supabase
          .from('consent_requests')
          .select('*, businesses(name, industry)')
          .eq('id', requestId)
          .maybeSingle(),
        supabase.from('identities').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      setRequest(req as ConsentRequest | null);
      setIdentity(ident as Identity | null);

      if (req && (req as ConsentRequest).status !== 'pending') {
        setResolved((req as ConsentRequest).status as 'approved' | 'rejected');
      }

      setLoading(false);
    };
    fetchData();
  }, [user, authLoading, router, requestId]);

  const handleResolve = async (decision: 'approved' | 'rejected') => {
    setResolving(true);
    const supabase = createClient();

    const { data, error } = await supabase.rpc('resolve_consent', {
      p_request_id: requestId,
      p_decision: decision,
    });

    if (error) {
      toast.error(error.message);
      setResolving(false);
      return;
    }

    setResolved(decision);
    setRequest(data as ConsentRequest);
    toast.success(
      decision === 'approved'
        ? 'Approved — redirecting to business...'
        : 'Request rejected'
    );

    if (decision === 'approved') {
      setTimeout(() => {
        const callbackUrl = (data as ConsentRequest)?.callback_url;
        if (callbackUrl) {
          window.location.href = callbackUrl;
        }
      }, 1500);
    }

    setResolving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!request) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle className="mb-4 h-10 w-10 text-destructive" />
          <p className="font-semibold text-foreground">Request not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This consent request doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/consent">Back to queue</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isPending = request.status === 'pending' && !resolved;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/consent"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to consent queue
        </Link>
      </div>

      {/* Header */}
      <div className="animate-fade-in">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Lock className="h-3 w-3" />
          Handoff Gateway
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {request.businesses?.name || 'A business'} is requesting your identity
        </h1>
        <p className="mt-1 text-muted-foreground">
          Review exactly what they&apos;re asking for and why. Approve all or reject all.
        </p>
      </div>

      {/* Resolved banner */}
      {resolved && (
        <Card
          className={
            resolved === 'approved'
              ? 'border-primary/30 bg-primary/5'
              : 'border-destructive/30 bg-destructive/5'
          }
        >
          <CardContent className="flex items-center gap-3 p-5">
            {resolved === 'approved' ? (
              <CheckCircle2 className="h-6 w-6 text-primary" />
            ) : (
              <XCircle className="h-6 w-6 text-destructive" />
            )}
            <div>
              <p className="font-semibold text-foreground">
                {resolved === 'approved'
                  ? 'Request approved'
                  : 'Request rejected'}
              </p>
              <p className="text-sm text-muted-foreground">
                {resolved === 'approved'
                  ? 'You authorized this business to retrieve your verified identity package.'
                  : 'You denied this request. The business will not receive your data.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Requesting Business
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {request.businesses?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {request.businesses?.industry || 'Business'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purpose */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stated Purpose</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground">{request.purpose}</p>
        </CardContent>
      </Card>

      {/* Requested fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4 text-muted-foreground" />
            Requested Data Fields
          </CardTitle>
          <CardDescription>
            The business will receive exactly these fields — nothing more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {request.requested_fields.map((field) => {
              const Icon = FIELD_ICON_COMPONENTS[field] || User;
              const value =
                identity && field in identity
                  ? (identity as unknown as Record<string, unknown>)[field]
                  : null;
              const display: string =
                value && field === 'date_of_birth'
                  ? new Date(value as string).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : (value as string) || '—';
              return (
                <div
                  key={field}
                  className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {FIELD_LABELS[field as keyof typeof FIELD_LABELS] || field}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {isPending ? (
                      <span className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Locked until approved
                      </span>
                    ) : resolved === 'approved' ? (
                      display
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Callback URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Callback URL</CardTitle>
          <CardDescription>
            After approval, you&apos;ll be redirected to the business&apos;s endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <code className="block truncate rounded-lg border bg-muted px-3 py-2 text-xs text-muted-foreground">
            {request.callback_url}
          </code>
        </CardContent>
      </Card>

      {/* Action buttons */}
      {isPending && (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-6">
            <div className="mb-4 flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                By approving, you grant this business one-time access to retrieve
                your verified identity package. The package expires in 24 hours.
                You can view this decision in your history at any time.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="flex-1 bg-primary"
                onClick={() => handleResolve('approved')}
                disabled={resolving}
              >
                {resolving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                Authorize all
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
                onClick={() => handleResolve('rejected')}
                disabled={resolving}
              >
                <ShieldX className="mr-2 h-4 w-4" />
                Reject all
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {resolved === 'approved' && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-5">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm font-medium text-primary">
              Redirecting to business callback...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
