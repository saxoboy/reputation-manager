'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const RECENT_FEEDBACK = [
  {
    id: 1,
    patient: 'María García',
    rating: 5,
    comment: '¡Excelente atención del Dr. Pérez! Muy profesional.',
    time: 'Hace 2 horas',
    source: 'Google Reviews',
  },
  {
    id: 2,
    patient: 'Carlos López',
    rating: 4,
    comment: 'Todo bien, pero la espera fue un poco larga.',
    time: 'Hace 5 horas',
    source: 'Encuesta Interna',
  },
  {
    id: 3,
    patient: 'Ana Martinez',
    rating: 5,
    comment: 'Me encantaron las instalaciones. Volveré seguro.',
    time: 'Ayer',
    source: 'WhatsApp',
  },
  {
    id: 4,
    patient: 'Roberto Torres',
    rating: 2,
    comment: 'No me explicaron bien el procedimiento.',
    time: 'Ayer',
    source: 'Encuesta Interna',
  },
];

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback Reciente</CardTitle>
        <CardDescription>
          Últimas opiniones recibidas de tus pacientes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {RECENT_FEEDBACK.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium leading-none">
                    {item.patient}
                  </p>
                  <Badge
                    variant={item.rating >= 4 ? 'default' : 'destructive'}
                    className="text-[10px] px-1 py-0 h-5"
                  >
                    {item.rating} ★
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  "{item.comment}"
                </p>
                <p className="text-xs text-muted-foreground">
                  Via {item.source} • {item.time}
                </p>
              </div>
              {item.rating <= 3 && (
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  Responder
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
