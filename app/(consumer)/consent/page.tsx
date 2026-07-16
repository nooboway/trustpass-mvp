'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { ConsentRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { FIELD_LABELS } from '@/lib/types';
import {
  Clock,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Building2,
} from 'lucide-react';

export default function ConsentQueuePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<ConsentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!user) return;

    const fetchRequests = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('consent_requests')
        .select('*, businesses(name, industry)')
        .eq('target_email', user.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      setRequests((data as ConsentRequest[]) || []);
      setLoading(false);
    };
    fetchRequests();
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
          Consent Queue
        </h1>
        <p className="mt-1 text-muted-foreground">
          Pending authorization requests from businesses.
        </p>
      </div>

      {requests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ShieldCheck className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-base font-medium text-foreground">
              Your queue is empty
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              When a business requests your identity, it appears here for your
              review. You approve or reject — nothing happens without your say-so.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="animate-slide-up overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {req.businesses?.name || 'Unknown business'}
                        </p>
                        <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                          Pending
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
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(req.created_at).toLocaleString('en-NG', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <Button asChild className="shrink-0">
                    <Link href={`/consent/${req.id}`}>
                      Review request
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
