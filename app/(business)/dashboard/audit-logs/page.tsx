'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { AuditLog, Business } from '@/lib/types';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  ScrollText,
  Loader2,
  ArrowDownToLine,
  ShieldCheck,
  ShieldX,
  Send,
} from 'lucide-react';

const EVENT_CONFIG: Record<string, { icon: typeof Send; color: string; label: string }> = {
  package_retrieved: { icon: ArrowDownToLine, color: 'text-primary', label: 'Package retrieved' },
  request_approved: { icon: ShieldCheck, color: 'text-primary', label: 'Request approved' },
  request_rejected: { icon: ShieldX, color: 'text-destructive', label: 'Request rejected' },
  request_sent: { icon: Send, color: 'text-muted-foreground', label: 'Request sent' },
};

export default function AuditLogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?next=/dashboard/audit-logs');
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
        .from('audit_logs')
        .select('*')
        .eq('business_id', (biz as Business).id)
        .order('created_at', { ascending: false })
        .limit(100);
      setLogs((data as AuditLog[]) || []);
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
          Audit Logs
        </h1>
        <p className="mt-1 text-muted-foreground">
          An append-only ledger of every data ingress event for your business.
        </p>
      </div>

      {logs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ScrollText className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-base font-medium text-foreground">
              No audit events yet
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              When a user approves a request and your business retrieves their
              identity package, the event is permanently recorded here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {logs.map((log) => {
                const config = EVENT_CONFIG[log.event] || {
                  icon: ScrollText,
                  color: 'text-muted-foreground',
                  label: log.event,
                };
                const Icon = config.icon;
                return (
                  <div key={log.id} className="flex items-start gap-4 p-4">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {config.label}
                        </p>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('en-NG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                      {log.detail && (
                        <pre className="mt-1 overflow-x-auto rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
                          {JSON.stringify(log.detail, null, 2)}
                        </pre>
                      )}
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        Request: {log.request_id?.slice(0, 8) || '—'}...
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
