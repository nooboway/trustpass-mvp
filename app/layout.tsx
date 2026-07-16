import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TrustPass — Verify Once. Trust Everywhere.',
  description:
    'A secure, consent-driven identity wallet for Nigeria. Verify your KYC once and reuse it across participating businesses with explicit per-request consent.',
  openGraph: {
    title: 'TrustPass — Verify Once. Trust Everywhere.',
    description:
      'A secure, consent-driven identity wallet for Nigeria. Verify your KYC once and reuse it across participating businesses.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
