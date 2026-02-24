'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../lib/api-client';

type FeedbackType = 'bug' | 'suggestion' | 'question';

const LABELS: Record<FeedbackType, string> = {
  bug: '🐛 Reportar un bug',
  suggestion: '💡 Sugerencia',
  question: '❓ Pregunta',
};

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('suggestion');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const posthog = usePostHog();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      await apiClient.post('/feedback', {
        type,
        message: message.trim(),
        url: pathname,
      });

      posthog?.capture('beta_feedback_submitted', { type });

      toast.success('¡Gracias por tu feedback!');
      setOpen(false);
      setMessage('');
      setType('suggestion');
    } catch {
      toast.error('No se pudo enviar el feedback. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
        aria-label="Enviar feedback"
      >
        <MessageSquare className="h-4 w-4" />
        Feedback Beta
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Feedback</DialogTitle>
            <DialogDescription>
              Ayúdanos a mejorar. Tu feedback va directo al equipo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as FeedbackType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(LABELS) as [FeedbackType, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback-message">Mensaje</Label>
              <Textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  type === 'bug'
                    ? 'Describe el problema: qué pasó y qué esperabas que pasara...'
                    : type === 'suggestion'
                      ? 'Describe tu idea o mejora...'
                      : 'Escribe tu pregunta...'
                }
                rows={4}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !message.trim()}>
                {loading ? 'Enviando...' : 'Enviar Feedback'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
