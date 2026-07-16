'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Send,
  ListChecks,
  ScrollText,
  FlaskConical,
  LogOut,
  Menu,
  X,
  Building2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const NAV_ITEMS = [
  { href: '/dashboard/requests/new', label: 'New Request', icon: Send },
  { href: '/dashboard/requests', label: 'Requests', icon: ListChecks },
  { href: '/dashboard/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { href: '/dashboard/simulator', label: 'Simulator', icon: FlaskConical },
];

export function BusinessNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-foreground text-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard/requests" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-background/10">
              <Building2 className="h-4 w-4 text-background" />
            </div>
            <span className="text-base font-bold tracking-tight">
              TrustPass <span className="text-background/60">Business</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-background/15 text-background'
                      : 'text-background/70 hover:bg-background/10 hover:text-background'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user && (
            <span className="text-sm text-background/70">{user.email}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            disabled={loading}
            className="text-background hover:bg-background/10 hover:text-background"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-background/10 md:hidden">
          <nav className="flex flex-col gap-1 p-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-background/15 text-background'
                      : 'text-background/70 hover:bg-background/10 hover:text-background'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="mt-2 justify-start text-background hover:bg-background/10 hover:text-background"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
