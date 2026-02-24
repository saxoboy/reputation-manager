import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Autenticación - Reputation Manager',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
        <Link
          href="/"
          className="font-display text-sm font-bold text-foreground"
        >
          Reputation<span className="text-primary">Manager</span>
        </Link>
      </div>
      {children}
    </div>
  );
}
