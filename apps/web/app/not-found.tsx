import Link from 'next/link';

export default function NotFound() {
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
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontSize: '1.25rem',
            color: '#64748b',
            marginBottom: '0.5rem',
          }}
        >
          Página no encontrada
        </h2>
        <p
          style={{
            color: '#94a3b8',
            marginBottom: '2rem',
          }}
        >
          La página que buscas no existe o fue movida.
        </p>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: '500',
          }}
        >
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}
