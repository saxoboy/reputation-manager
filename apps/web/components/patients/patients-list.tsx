import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { MoreHorizontal, Star } from 'lucide-react';
import { Patient, PatientStatus } from '../../types/mock-types';

interface PatientsListProps {
  patients: Patient[];
}

export function PatientsList({ patients }: PatientsListProps) {
  const getStatusBadge = (status: PatientStatus) => {
    const variants: Record<
      PatientStatus,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      PENDING: 'secondary',
      SENT: 'outline',
      RESPONDED: 'default',
      OPT_OUT: 'destructive',
    };

    const labels: Record<PatientStatus, string> = {
      PENDING: 'Pendiente',
      SENT: 'Enviado',
      RESPONDED: 'Respondió',
      OPT_OUT: 'Baja (Stop)',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const renderRating = (rating?: number) => {
    if (!rating) return '-';

    return (
      <div className="flex items-center gap-1">
        <Star
          className={`h-4 w-4 ${rating >= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
        />
        <span
          className={
            rating >= 4
              ? 'font-bold'
              : rating <= 2
                ? 'text-destructive font-bold'
                : ''
          }
        >
          {rating}
        </span>
      </div>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Campaña</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Última Visita</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell className="font-medium">
                <div>{patient.name}</div>
                <div className="text-xs text-muted-foreground">
                  {patient.phone}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(patient.status)}</TableCell>
              <TableCell className="text-sm">{patient.campaign}</TableCell>
              <TableCell>{renderRating(patient.rating)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {patient.lastVisit}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => navigator.clipboard.writeText(patient.id)}
                    >
                      Copiar ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Ver historial</DropdownMenuItem>
                    <DropdownMenuItem>Reenviar mensaje</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      Dar de baja
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
