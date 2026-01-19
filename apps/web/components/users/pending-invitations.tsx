import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';

export function PendingInvitations() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitaciones Pendientes</CardTitle>
        <CardDescription>
          Usuarios que han sido invitados pero aún no han aceptado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          No hay invitaciones pendientes en este momento
        </p>
      </CardContent>
    </Card>
  );
}
