'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { ConsentRequest, Business } from '@/lib/types';
import { FIELD_LABELS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  approved: { label: 'Approved', icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  expired: { label: 'Expired', icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
} as const;

export default function BusinessRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<ConsentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?next=/dashboard/requests');
      return;
    }
    if (!user) return;

    const fetchData = async () => {
      const supabase = createClient();
      const { data: biz } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!biz) {
        router.push('/signup?role=business');
        return;
      }
      const { data } = await supabase
        .from('consent_requests')
        .select('*')
        .eq('business_id', (biz as Business).id)
        .order('created_at', { ascending: false });
      setRequests((data as ConsentRequest[]) || []);
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

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Request Telemetry
          </h1>
          <p className="mt-1 text-muted-foreground">
            Outbound identity requests and their status.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/requests/new">
            <Plus className="mr-2 h-4 w-4" />
            New request
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground' },
          { label: 'Pending', value: stats.pending, color: 'text-warning' },
          { label: 'Approved', value: stats.approved, color: 'text-primary' },
          { label: 'Rejected', value: stats.rejected, color: 'text-destructive' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </p>
              <p className={cn('mt-1 text-2xl font-bold', s.color)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Request list */}
      {requests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Send className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-base font-medium text-foreground">
              No requests sent yet
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create your first identity request to see it appear here with
              real-time status updates.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/requests/new">
                <Plus className="mr-2 h-4 w-4" />
                Create request
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const config = STATUS_CONFIG[req.status];
            const Icon = config.icon;
            return (
              <Card key={req.id} className="animate-slide-up">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {req.target_email}
                        </p>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                            config.bg,
                            config.color
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {req.purpose}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {req.requested_fields.map((f) => (
                          <span
                            key={f}
                            className="rounded-md border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                          >
                            {FIELD_LABELS[f as keyof typeof FIELD_LABELS] || f}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(req.created_at).toLocaleString('en-NG', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {req.resolved_at && (
                          <span>
                            {' · '}
                            resolved{' '}
                            {new Date(req.resolved_at).toLocaleString('en-NG', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {req.status === 'approved' ? (
                        <Button size="sm" asChild>
                          <Link href={`/dashboard/simulator?requestId=${req.id}`}>
                            View package
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">
                          {req.id.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
