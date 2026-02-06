'use client';

import { useState } from 'react';
import { MessageSquareWarning, X, Send } from 'lucide-react';
import { toast } from 'sonner';

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'other';

const FEEDBACK_TYPES: { value: FeedbackType; label: string }[] = [
  { value: 'bug', label: '🐛 Bug / Error' },
  { value: 'feature', label: '✨ Nueva funcionalidad' },
  { value: 'improvement', label: '💡 Mejora' },
  { value: 'other', label: '💬 Otro' },
];

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('bug');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Por favor escribe tu feedback');
      return;
    }

    setSending(true);
    try {
      // Collect context automatically
      const feedbackData = {
        type,
        message: message.trim(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      };

      // TODO: Send to API endpoint POST /api/feedback
      // For now, log and show success
      console.log('[Beta Feedback]', feedbackData);

      toast.success('¡Gracias por tu feedback! Lo revisaremos pronto.');
      setMessage('');
      setType('bug');
      setIsOpen(false);
    } catch {
      toast.error('Error al enviar feedback. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  // Only show in development or when BETA flag is set
  const isBeta =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_BETA_MODE === 'true';

  if (!isBeta) return null;

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95"
          title="Enviar feedback"
        >
          <MessageSquareWarning className="h-5 w-5" />
        </button>
      )}

      {/* Feedback panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 rounded-lg border bg-background shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold">Feedback Beta</h3>
              <p className="text-xs text-muted-foreground">
                Ayúdanos a mejorar
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 p-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as FeedbackType)}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
              >
                {FEEDBACK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Descripción</label>
              <textarea
                placeholder="Describe tu feedback..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-xs resize-none h-24 focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={sending}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={sending || !message.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                'Enviando...'
              ) : (
                <>
                  <Send className="h-3 w-3" /> Enviar Feedback
                </>
              )}
            </button>

            <p className="text-[10px] text-muted-foreground text-center">
              Se incluye la URL actual y datos del navegador
            </p>
          </div>
        </div>
      )}
    </>
  );
}
