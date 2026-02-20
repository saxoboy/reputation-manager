'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Input } from '../ui/input';
import {
  MoreHorizontal,
  Search,
  Filter,
  History,
  Ban,
  Download,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Patient } from '../../services/patient.service';
import { useDeletePatient, useOptOutPatient } from '../../hooks/use-patients';

interface PatientsListProps {
  initialPatients?: Patient[];
  workspaceId: string;
}

export function PatientsList({
  initialPatients = [],
  workspaceId,
}: PatientsListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [historyPatient, setHistoryPatient] = useState<Patient | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmOptOutId, setConfirmOptOutId] = useState<string | null>(null);

  const deletePatient = useDeletePatient(workspaceId);
  const optOutPatient = useOptOutPatient(workspaceId);

  const patients = initialPatients;

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.includes(searchTerm) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'opt-out') return !!patient.optedOutAt;

    const lastMessage =
      patient.messages && patient.messages.length > 0
        ? patient.messages[patient.messages.length - 1]
        : null;

    if (statusFilter === 'pending') {
      return (
        !patient.optedOutAt &&
        (!lastMessage ||
          lastMessage.status === 'SENT' ||
          lastMessage.status === 'DELIVERED')
      );
    }

    if (statusFilter === 'responded') {
      return (
        !patient.optedOutAt &&
        lastMessage != null &&
        (lastMessage.status === 'RESPONDED' || !!lastMessage.rating)
      );
    }

    return true;
  });

  const getStatusBadge = (patient: Patient) => {
    if (patient.optedOutAt) {
      return <Badge variant="destructive">Baja (Stop)</Badge>;
    }
    if (patient.dataDeletedAt) {
      return (
        <Badge variant="outline" className="text-gray-500">
          Eliminado
        </Badge>
      );
    }
    if (!patient.messages || patient.messages.length === 0) {
      return <Badge variant="outline">Sin contactos</Badge>;
    }

    const lastMessage = patient.messages[patient.messages.length - 1];

    if (lastMessage.status === 'FAILED') {
      return <Badge variant="destructive">Error envío</Badge>;
    }
    if (lastMessage.rating) {
      if (lastMessage.rating >= 4) {
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            Promotor ({lastMessage.rating}★)
          </Badge>
        );
      } else {
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            Detractor ({lastMessage.rating}★)
          </Badge>
        );
      }
    }
    if (lastMessage.status === 'RESPONDED') {
      return <Badge variant="secondary">Respondió</Badge>;
    }
    return (
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-700 border-blue-200"
      >
        Enviado
      </Badge>
    );
  };

  const getLastContactDate = (patient: Patient) => {
    if (!patient.messages || patient.messages.length === 0) return 'Nunca';
    const lastMessage = patient.messages[patient.messages.length - 1];
    return format(new Date(lastMessage.createdAt), 'd MMM, HH:mm', {
      locale: es,
    });
  };

  const getMessageTypelabel = (type: string) => {
    switch (type) {
      case 'INITIAL':
        return 'Mensaje inicial';
      case 'FOLLOWUP_HAPPY':
        return 'Seguimiento positivo';
      case 'FOLLOWUP_UNHAPPY':
        return 'Seguimiento negativo';
      case 'REMINDER':
        return 'Recordatorio';
      default:
        return type;
    }
  };

  const getMessageStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline">Pendiente</Badge>;
      case 'SCHEDULED':
        return <Badge variant="secondary">Programado</Badge>;
      case 'SENT':
        return <Badge className="bg-blue-500">Enviado</Badge>;
      case 'DELIVERED':
        return <Badge className="bg-green-500">Entregado</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Error</Badge>;
      case 'REPLIED':
        return <Badge className="bg-purple-500">Respondido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por nombre, teléfono..."
            className="pl-9"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <Filter className="h-4 w-4" />
                Estado:{' '}
                {statusFilter === 'all'
                  ? 'Todos'
                  : statusFilter === 'pending'
                    ? 'Pendientes'
                    : statusFilter === 'responded'
                      ? 'Respondidos'
                      : 'Bajas'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                Pendientes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('responded')}>
                Respondidos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('opt-out')}>
                Bajas (Stop)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" title="Exportar CSV" disabled>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última Campaña</TableHead>
                <TableHead>Último Contacto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-gray-500"
                  >
                    No se encontraron pacientes
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow
                    key={patient.id}
                    className="hover:bg-gray-50/10 transition-colors"
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{patient.name}</span>
                        <span className="text-sm text-gray-500">
                          {patient.phone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(patient)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {patient.campaign ? patient.campaign.name : 'N/A'}
                        </span>
                        {patient.campaign && (
                          <span className="text-xs text-gray-500">
                            {format(new Date(patient.createdAt), 'd MMM yyyy', {
                              locale: es,
                            })}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {getLastContactDate(patient)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {confirmDeleteId === patient.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            disabled={deletePatient.isPending}
                            onClick={() =>
                              deletePatient.mutate(patient.id, {
                                onSuccess: () => setConfirmDeleteId(null),
                              })
                            }
                          >
                            Confirmar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : confirmOptOutId === patient.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            disabled={optOutPatient.isPending}
                            onClick={() =>
                              optOutPatient.mutate(patient.id, {
                                onSuccess: () => setConfirmOptOutId(null),
                              })
                            }
                          >
                            Confirmar baja
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setConfirmOptOutId(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
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
                              onClick={() => setHistoryPatient(patient)}
                            >
                              <History className="mr-2 h-4 w-4" /> Ver historial
                            </DropdownMenuItem>
                            {patient.campaignId && (
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/dashboard/campaigns/${patient.campaignId}`,
                                  )
                                }
                              >
                                <ExternalLink className="mr-2 h-4 w-4" /> Ir a
                                campaña
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {!patient.optedOutAt && (
                              <DropdownMenuItem
                                className="text-orange-600 focus:text-orange-600"
                                onClick={() => setConfirmOptOutId(patient.id)}
                              >
                                <Ban className="mr-2 h-4 w-4" /> Dar de baja
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => setConfirmDeleteId(patient.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center py-2">
        Mostrando {filteredPatients.length} de {patients.length} pacientes
      </div>

      {/* Historial de mensajes */}
      <Sheet
        open={!!historyPatient}
        onOpenChange={(open) => !open && setHistoryPatient(null)}
      >
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{historyPatient?.name}</SheetTitle>
            <SheetDescription>
              {historyPatient?.phone}
              {historyPatient?.email ? ` · ${historyPatient.email}` : ''}
              {historyPatient?.campaign
                ? ` · Campaña: ${historyPatient.campaign.name}`
                : ''}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-3">
            {!historyPatient?.messages ||
            historyPatient.messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Este paciente no tiene mensajes registrados.
              </p>
            ) : (
              historyPatient.messages.map((msg) => (
                <div key={msg.id} className="rounded-lg border p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {getMessageTypelabel(msg.type)}
                    </span>
                    {getMessageStatusBadge(msg.status)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {format(new Date(msg.createdAt), 'd MMM yyyy, HH:mm', {
                        locale: es,
                      })}
                    </span>
                    {msg.rating && (
                      <span className="font-medium text-foreground">
                        Rating: {msg.rating}★
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
