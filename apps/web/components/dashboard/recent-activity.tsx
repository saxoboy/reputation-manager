'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { MessageSquare } from 'lucide-react';
import { useMessages } from '../../hooks/use-messages';

interface RecentActivityProps {
  workspaceId: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  return `Hace ${days} días`;
}

const CHANNEL_LABEL: Record<string, string> = {
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'Email',
};

export function RecentActivity({ workspaceId }: RecentActivityProps) {
  const { data: messages = [], isLoading } = useMessages(workspaceId, {
    status: 'REPLIED',
  });

  const recent = messages
    .filter((m) => m.rating != null && m.respondedAt)
    .sort(
      (a, b) =>
        new Date(b.respondedAt ?? '').getTime() -
        new Date(a.respondedAt ?? '').getTime(),
    )
    .slice(0, 5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-56 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between border-b pb-4">
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-64" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback Reciente</CardTitle>
        <CardDescription>
          Últimas opiniones recibidas de tus pacientes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No hay feedback reciente aún.
            </p>
            <Link
              href="/dashboard/campaigns"
              className="text-xs text-primary hover:underline"
            >
              Enviar mensajes a pacientes →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recent.map((msg) => (
              <div
                key={msg.id}
                className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium leading-none">
                      {msg.patient?.name ?? 'Paciente'}
                    </p>
                    <Badge
                      variant={
                        (msg.rating ?? 0) >= 4 ? 'default' : 'destructive'
                      }
                      className="text-[10px] px-1 py-0 h-5"
                    >
                      {msg.rating} ★
                    </Badge>
                  </div>
                  {msg.feedback && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      &ldquo;{msg.feedback}&rdquo;
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Via {CHANNEL_LABEL[msg.channel] ?? msg.channel} •{' '}
                    {timeAgo(msg.respondedAt ?? '')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
