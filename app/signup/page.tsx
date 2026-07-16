'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Brand } from '@/components/brand';
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
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { User, Building2, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Role = 'consumer' | 'business';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get('role') as Role) || 'consumer';

  const [role, setRole] = useState<Role>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      toast.error('Sign up failed. Please try again.');
      setLoading(false);
      return;
    }

    if (role === 'business' && businessName) {
      const { error: bizError } = await supabase.from('businesses').insert({
        user_id: data.user.id,
        name: businessName,
        industry: industry || null,
      });

      if (bizError) {
        toast.error('Account created, but business profile failed: ' + bizError.message);
      }
    }

    toast.success('Account created');
    router.push(role === 'business' ? '/dashboard/requests' : '/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-mesh">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="relative flex min-h-screen flex-col">
        <header className="p-4 sm:p-6">
          <Link href="/">
            <Brand size="sm" />
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="w-full max-w-md animate-slide-up">
            <Card className="border-border/60 shadow-xl">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Create your account</CardTitle>
                <CardDescription>
                  Choose how you want to use TrustPass
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Role selector */}
                <div className="mb-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('consumer')}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                      role === 'consumer'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-border/80'
                    )}
                  >
                    <User
                      className={cn(
                        'h-6 w-6',
                        role === 'consumer' ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    <span className="text-sm font-medium">Individual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('business')}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                      role === 'business'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-border/80'
                    )}
                  >
                    <Building2
                      className={cn(
                        'h-6 w-6',
                        role === 'business' ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    <span className="text-sm font-medium">Business</span>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {role === 'business' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Business name</Label>
                        <Input
                          id="businessName"
                          type="text"
                          placeholder="e.g. PayTide Microfinance"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry (optional)</Label>
                        <Input
                          id="industry"
                          type="text"
                          placeholder="e.g. Fintech"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create account'
                    )}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="font-medium text-primary hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </CardContent>
            </Card>

            <div className="mt-4 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to home
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SignupForm />
    </Suspense>
  );
}
