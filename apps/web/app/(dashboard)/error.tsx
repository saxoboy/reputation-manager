'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">
          Error en el Dashboard
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Algo salió mal al cargar esta sección. Puedes intentar de nuevo.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RefreshCcw className="h-4 w-4" />
            Reintentar
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && error.message && (
          <details className="mt-6 rounded-lg border bg-muted/50 p-3 text-left">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
              Detalles del error
            </summary>
            <pre className="mt-2 overflow-x-auto text-xs text-destructive">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
