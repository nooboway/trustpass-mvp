import Link from 'next/link';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Zap,
  Lock,
  Eye,
  ArrowRight,
  CheckCircle2,
  Building2,
  User,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-mesh">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              Built for Nigeria&apos;s identity economy
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Verify once.
              <br />
              <span className="text-primary">Trust everywhere.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
              TrustPass is a secure, consent-driven identity wallet. Complete your
              KYC once and reuse it across every participating business — with
              explicit per-request approval. No more re-uploading your NIN for
              every app.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Create your identity wallet
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">I already have one</Link>
              </Button>
            </div>
          </div>

          {/* Hero visual: the Identity Ledger Card */}
          <div className="mx-auto mt-16 max-w-md">
            <div className="animate-slide-up rounded-2xl border bg-card p-1 shadow-2xl">
              <div className="rounded-xl border bg-gradient-to-br from-card to-muted/30 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <Brand size="sm" />
                  <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Level 2
                  </div>
                </div>
                <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <p className="text-sm font-semibold text-primary">Document verified</p>
                  <p className="text-xs text-muted-foreground">Verified 16 Jul 2026</p>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {[
                    ['Full Name', 'Adaeze Okonkwo'],
                    ['Date of Birth', '14 Mar 1992'],
                    ['Phone', '+234 803 ••• 4521'],
                    ['Email', 'adaeze@mail.com'],
                    ['Address', 'Lagos, Nigeria'],
                    ['Gov. ID Type', 'NIN'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {label}
                      </dt>
                      <dd className="mt-0.5 truncate text-sm font-medium text-foreground">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-card py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              One wallet. Every business. Zero re-verification.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Think &ldquo;Sign in with Google&rdquo; meets &ldquo;Apple Wallet&rdquo; — but for KYC.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: 'Verify once',
                desc: 'Upload your document once. TrustPass attests your identity to Level 2 — verified name, DOB, NIN, and address.',
              },
              {
                icon: Eye,
                title: 'Approve per request',
                desc: 'When a business asks for your data, you see exactly what they want and why. Approve all or reject all — nothing in between.',
              },
              {
                icon: Zap,
                title: 'Reuse instantly',
                desc: 'Approved businesses retrieve your verified package through a secure handoff. Onboarding drops from 10 minutes to 10 seconds.',
              },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="relative rounded-2xl border bg-background p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="absolute right-5 top-5 text-5xl font-bold text-muted/50">
                    {i + 1}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Two perspectives */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border bg-card p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">
                For individuals
              </h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {[
                  'Own your identity data in one wallet',
                  'See every request before you approve',
                  'Immutable history of every decision',
                  'Reject any request with one tap',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="mt-6" asChild>
                <Link href="/signup">
                  Open your wallet
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="rounded-2xl border bg-foreground p-8 text-background">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-background/10">
                <Building2 className="h-6 w-6 text-background" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">For businesses</h3>
              <ul className="space-y-2.5 text-sm text-background/70">
                {[
                  'Request verified identity packages by email',
                  'Stop re-running expensive KYC checks',
                  'Append-only audit trail of every retrieval',
                  'Drop onboarding friction to near-zero',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-background" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="secondary" className="mt-6" asChild>
                <Link href="/signup?role=business">
                  Build a business account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t bg-card py-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-4 text-sm font-medium text-muted-foreground sm:px-6">
          <span className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            Standard cryptography
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Consent-driven
          </span>
          <span className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            Per-request transparency
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Append-only audit logs
          </span>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <Brand size="sm" />
          <p className="text-sm text-muted-foreground">
            TrustPass — Identity infrastructure for Nigeria. V0 MVP.
          </p>
        </div>
      </footer>
    </div>
  );
}
