'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error('Global error:', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '1rem',
          }}
        >
          ⚠️
        </div>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
          }}
        >
          Algo salió mal
        </h1>
        <p
          style={{
            color: '#64748b',
            marginBottom: '2rem',
          }}
        >
          Ocurrió un error inesperado. Puedes intentar de nuevo o volver al
          inicio.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={reset}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '0.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Intentar de nuevo
          </button>
          <a
            href="/dashboard"
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0',
              textDecoration: 'none',
              color: 'inherit',
              fontSize: '0.875rem',
            }}
          >
            Ir al Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
