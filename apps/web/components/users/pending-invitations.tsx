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
import { Skeleton } from '../ui/skeleton';
import { X, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  usePendingInvitations,
  useCancelInvitation,
} from '../../hooks/use-users';

const roleLabel = (role: string) =>
  role === 'DOCTOR'
    ? 'Doctor'
    : role === 'RECEPTIONIST'
      ? 'Recepcionista'
      : role;

interface PendingInvitationsProps {
  workspaceId: string;
}

export function PendingInvitations({ workspaceId }: PendingInvitationsProps) {
  const { data: invitations, isLoading } = usePendingInvitations(workspaceId);
  const cancelMutation = useCancelInvitation(workspaceId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitaciones Pendientes</CardTitle>
        <CardDescription>
          Usuarios que han sido invitados pero aún no han aceptado
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !invitations || invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay invitaciones pendientes en este momento
          </p>
        ) : (
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invitado por {inv.invitedBy} · Expira{' '}
                      {format(new Date(inv.expiresAt), 'd MMM yyyy', {
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{roleLabel(inv.role)}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    disabled={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate(inv.id)}
                    title="Cancelar invitación"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
