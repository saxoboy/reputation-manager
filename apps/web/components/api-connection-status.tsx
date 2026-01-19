'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, XCircle } from 'lucide-react';

type ConnectionStatus = 'connecting' | 'connected' | 'error' | 'disconnected';

export function ApiConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/api/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setStatus('connected');
          setMessage('API conectado correctamente');
        } else {
          setStatus('error');
          setMessage(`Error: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        setStatus('disconnected');
        setMessage(
          error instanceof Error
            ? error.message
            : 'No se puede conectar al API',
        );
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, []);

  // Solo mostrar si hay error
  if (status === 'connected') return null;

  const icons = {
    connecting: <Loader2 className="h-4 w-4 animate-spin" />,
    connected: <CheckCircle2 className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
    disconnected: <XCircle className="h-4 w-4" />,
  };

  const colors = {
    connecting: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    connected: 'bg-green-500/10 text-green-500 border-green-500/20',
    error: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    disconnected: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <div
      className={`fixed bottom-4 right-4 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${colors[status]}`}
    >
      {icons[status]}
      <span>{message}</span>
    </div>
  );
}
