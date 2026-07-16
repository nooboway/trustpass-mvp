'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import type { IdentityPackage } from '@/lib/types';
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
  FlaskConical,
  Loader2,
  ArrowDownToLine,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FIELD_LABELS: Record<string, string> = {
  user_id: 'User ID',
  verification_level: 'Verification Level',
  verified_at: 'Verified At',
  full_name: 'Full Name',
  date_of_birth: 'Date of Birth',
  phone: 'Phone',
  email: 'Email',
  address: 'Address',
  government_id_type: 'Government ID Type',
  consent_id: 'Consent ID',
  expires_at: 'Expires At',
};

function SimulatorContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get('requestId');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [pkg, setPkg] = useState<IdentityPackage | null>(null);
  const [loadingPkg, setLoadingPkg] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?next=/dashboard/simulator');
      return;
    }
    if (!user) return;
    if (requestId) {
      fetchPackage();
    }
  }, [user, authLoading, router, requestId]);

  const fetchPackage = async () => {
    if (!requestId) return;
    setLoadingPkg(true);
    setError(null);
    try {
      const res = await fetch(`/api/business/requests/${requestId}/package`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || `Request failed (${res.status})`);
        setPkg(null);
      } else {
        setPkg(json.package);
      }
      setFetched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setPkg(null);
    } finally {
      setLoadingPkg(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="animate-fade-in">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-foreground px-3 py-1 text-xs font-medium text-background">
          <FlaskConical className="h-3 w-3" />
          Simulator
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Business Callback Simulator
        </h1>
        <p className="mt-1 text-muted-foreground">
          This simulates a 3rd-party business receiving the TrustPass redirect and
          retrieving the decrypted identity package server-side.
        </p>
      </div>

      {!requestId ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ArrowRight className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-base font-medium text-foreground">
              No request selected
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Go to your requests list and click &ldquo;View package&rdquo; on an
              approved request to see the full handoff here.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/requests">Go to requests</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Request info */}
          <Card className="bg-muted/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Request ID
                  </p>
                  <p className="mt-1 font-mono text-sm text-foreground">
                    {requestId}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={fetchPackage} disabled={loadingPkg}>
                  <RefreshCw className={cn('mr-2 h-4 w-4', loadingPkg && 'animate-spin')} />
                  Re-fetch
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Fetch status */}
          {loadingPkg && (
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Fetching identity package from TrustPass API...
                </p>
              </CardContent>
            </Card>
          )}

          {error && !loadingPkg && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex items-start gap-3 p-5">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">Retrieval failed</p>
                  <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Make sure the user has approved the request in their consent
                    queue first.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Package display */}
          {pkg && !loadingPkg && (
            <Card className="animate-slide-up border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Unlock className="h-4 w-4 text-primary" />
                  </div>
                  Decrypted Identity Package
                </CardTitle>
                <CardDescription>
                  This is the JSON payload your business received from TrustPass.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Verification badge */}
                <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      Verification Level {pkg.verification_level}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pkg.verified_at
                        ? `Verified ${new Date(pkg.verified_at as string).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}`
                        : 'Not verified'}
                    </p>
                  </div>
                </div>

                {/* Field grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Object.entries(pkg).map(([key, value]) => {
                    if (key === 'verification_level' || key === 'verified_at') return null;
                    const display =
                      value === null || value === undefined
                        ? '—'
                        : key === 'date_of_birth' || key === 'expires_at' || key === 'verified_at'
                          ? new Date(value as string).toLocaleString('en-NG', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              ...(key === 'expires_at' && { hour: '2-digit', minute: '2-digit' }),
                            })
                          : key === 'user_id' || key === 'consent_id'
                            ? `${(value as string).slice(0, 8)}...`
                            : String(value);
                    return (
                      <div key={key} className="rounded-lg border bg-muted/30 p-3">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {FIELD_LABELS[key] || key}
                        </p>
                        <p className="mt-1 truncate text-sm font-medium text-foreground">
                          {display}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Raw JSON */}
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Raw JSON Response
                  </p>
                  <pre className="overflow-x-auto rounded-lg border bg-foreground p-4 text-xs text-background">
                    {JSON.stringify(pkg, null, 2)}
                  </pre>
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    This package was retrieved server-side using your authenticated
                    session. An audit entry has been written to your append-only
                    ledger. The package expires in 24 hours.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Initial state */}
          {!fetched && !loadingPkg && !error && (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <Lock className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Click below to simulate the server-side package retrieval.
                </p>
                <Button onClick={fetchPackage}>
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  Retrieve identity package
                </Button>
              </CardContent>
            </Card>
          )}

          {fetched && pkg && !error && (
            <div className="flex justify-center">
              <Button variant="outline" asChild>
                <Link href="/dashboard/audit-logs">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                  View in audit logs
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SimulatorPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <SimulatorContent />
    </Suspense>
  );
}
