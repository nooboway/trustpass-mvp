'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { IdentityLedgerCard } from '@/components/identity-ledger-card';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Identity, ConsentRequest } from '@/lib/types';
import {
  FileText,
  ShieldCheck,
  History,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
} from 'lucide-react';

export default function ConsumerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [pendingRequests, setPendingRequests] = useState<ConsentRequest[]>([]);
  const [recentDecisions, setRecentDecisions] = useState<
    { id: string; request_id: string; decision: string; decided_at: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!user) return;

    const fetchData = async () => {
      const supabase = createClient();

      const [{ data: ident }, { data: requests }, { data: decisions }] = await Promise.all([
        supabase.from('identities').select('*').eq('user_id', user.id).maybeSingle(),
        supabase
          .from('consent_requests')
          .select('*, businesses(name, industry)')
          .eq('target_email', user.email)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
        supabase
          .from('consent_decisions')
          .select('id, request_id, decision, decided_at')
          .eq('user_id', user.id)
          .order('decided_at', { ascending: false })
          .limit(5),
      ]);

      setIdentity(ident as Identity | null);
      setPendingRequests((requests as ConsentRequest[]) || []);
      setRecentDecisions(decisions || []);
      setLoading(false);
    };

    fetchData();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const level = identity?.verification_level ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Identity Control Plane
        </h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back, {user?.email}. Your verified identity at a glance.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Identity Ledger Card */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Your Identity Ledger
            </h2>
            {level < 2 && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/documents">
                  <FileText className="mr-2 h-4 w-4" />
                  Verify identity
                </Link>
              </Button>
            )}
          </div>
          <IdentityLedgerCard identity={identity} />
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verification Level
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                Level {level}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {level === 0
                  ? 'Not verified — upload a document'
                  : level === 1
                    ? 'Basic details on file'
                    : 'Document verified — ready to reuse'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Requests
              </CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {pendingRequests.length}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Awaiting your decision
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Decisions Made
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {recentDecisions.length}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                In your recent history
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pending consent requests */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Pending Consent Requests
          </h2>
          <Button size="sm" variant="ghost" asChild>
            <Link href="/consent">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {pendingRequests.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">
                No pending requests
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                When a business requests your identity, it&apos;ll appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingRequests.slice(0, 3).map((req) => (
              <Card key={req.id} className="animate-slide-up">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      {req.businesses?.name || 'Unknown business'}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {req.purpose}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {req.requested_fields.length} fields requested
                    </p>
                  </div>
                  <Button size="sm" asChild>
                    <Link href={`/consent/${req.id}`}>Review</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent decisions */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Decisions
          </h2>
          <Button size="sm" variant="ghost" asChild>
            <Link href="/history">
              View history
              <History className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {recentDecisions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <History className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No decisions yet. Your approve/reject history will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentDecisions.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {d.decision === 'approved' ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {d.decision === 'approved' ? 'Approved' : 'Rejected'} a consent request
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(d.decided_at).toLocaleString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
