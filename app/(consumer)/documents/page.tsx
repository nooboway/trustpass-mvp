'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
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
import type { Identity } from '@/lib/types';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ID_TYPES = ['NIN', 'Driver License', 'Voter Card', 'International Passport'];

export default function DocumentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<'upload' | 'details'>('upload');
  const [fileName, setFileName] = useState('');

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [idType, setIdType] = useState('NIN');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!user) return;

    const fetchIdentity = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('identities')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setIdentity(data as Identity | null);
      if (data?.full_name) setFullName(data.full_name);
      if (data?.date_of_birth) setDob(data.date_of_birth);
      if (data?.phone) setPhone(data.phone);
      if (data?.address) setAddress(data.address);
      if (data?.government_id_type) setIdType(data.government_id_type);
      setLoading(false);
    };
    fetchIdentity();
  }, [user, authLoading, router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    toast.success('Document received. Enter your details to complete verification.');
    setStep('details');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    const supabase = createClient();

    const { data, error } = await supabase.rpc('mark_identity_verified_l2', {
      p_full_name: fullName,
      p_dob: dob,
      p_phone: phone,
      p_address: address,
      p_gov_id_type: idType,
    });

    if (error) {
      toast.error('Verification failed: ' + error.message);
      setUploading(false);
      return;
    }

    setIdentity(data as Identity);
    setUploading(false);
    toast.success('Identity verified to Level 2!');
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isVerified = (identity?.verification_level ?? 0) >= 2;

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Documents & Verification
        </h1>
        <p className="mt-1 text-muted-foreground">
          Upload a government ID to mint your Level 2 verified identity.
        </p>
      </div>

      {isVerified && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-primary">Already verified</p>
              <p className="text-sm text-muted-foreground">
                Your identity is at Level 2. You can reuse it across participating businesses.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload zone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Document
            </CardTitle>
            <CardDescription>
              NIN, Driver License, Voter Card, or International Passport.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className={cn(
                'flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all hover:border-primary/50 hover:bg-primary/5',
                fileName && 'border-primary/40 bg-primary/5'
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                {fileName ? (
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                ) : (
                  <FileText className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              {fileName ? (
                <>
                  <p className="text-sm font-medium text-foreground">{fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    Click to choose a different file
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground">
                    Click to upload your document
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, or PDF (mock — no real upload)
                  </p>
                </>
              )}
            </button>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 p-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                For this V0 demo, no file is actually uploaded or stored. The upload
                simulates a successful document check and grants Level 2 status.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Details form */}
        <Card className={cn(!fileName && 'opacity-60')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Identity Details
            </CardTitle>
            <CardDescription>
              {fileName
                ? 'Confirm the details extracted from your document.'
                : 'Upload a document first to enable this step.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="As shown on your document"
                  disabled={!fileName || uploading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    disabled={!fileName || uploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234..."
                    disabled={!fileName || uploading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Lagos, Nigeria"
                  disabled={!fileName || uploading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="idType">Government ID Type</Label>
                <select
                  id="idType"
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  disabled={!fileName || uploading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {ID_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!fileName || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & mint identity
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
