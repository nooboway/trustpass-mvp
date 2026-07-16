'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { ConsentDecision, ConsentRequest } from '@/lib/types';
import { FIELD_LABELS } from '@/lib/types';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  History,
  Building2,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';

interface HistoryEntry extends ConsentDecision {
  consent_requests?: ConsentRequest;
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!user) return;

    const fetchData = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('consent_decisions')
        .select('*, consent_requests(*, businesses(name, industry))')
        .eq('user_id', user.id)
        .order('decided_at', { ascending: false });
      setEntries((data as HistoryEntry[]) || []);
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

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Decision History
        </h1>
        <p className="mt-1 text-muted-foreground">
          An immutable log of every consent decision you&apos;ve made.
        </p>
      </div>

      {entries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <History className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-base font-medium text-foreground">
              No decisions yet
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              When you approve or reject a consent request, the decision is
              permanently recorded here. This log is append-only — nothing is ever
              deleted or modified.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const req = entry.consent_requests;
            const approved = entry.decision === 'approved';
            return (
              <Card key={entry.id} className="animate-slide-up">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        approved ? 'bg-primary/10' : 'bg-destructive/10'
                      }`}
                    >
                      {approved ? (
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      ) : (
                        <ShieldX className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-foreground">
                          {approved ? 'Approved' : 'Rejected'}{' '}
                          <span className="font-normal text-muted-foreground">
                            — {req?.businesses?.name || 'Unknown business'}
                          </span>
                        </p>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {new Date(entry.decided_at).toLocaleString('en-NG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {req?.purpose && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {req.purpose}
                        </p>
                      )}
                      {req?.requested_fields && req.requested_fields.length > 0 && (
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
                      )}
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">
                          Consent ID: {entry.consent_id.slice(0, 8)}...
                        </span>
                      </div>
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
