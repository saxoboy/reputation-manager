'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export const dynamic = 'force-dynamic';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h1>Algo salió mal</h1>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>
            Nuestro equipo ha sido notificado del error.
          </p>
          <button
            onClick={() => reset()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
