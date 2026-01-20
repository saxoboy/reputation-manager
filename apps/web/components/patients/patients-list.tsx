'use client';

import { useState } from 'react';
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
import { Input } from '../ui/input';
import {
  MoreHorizontal,
  Search,
  Filter,
  MessageSquare,
  History,
  Ban,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Patient } from '../../services/patient.service';

interface PatientsListProps {
  initialPatients?: Patient[];
}

export function PatientsList({ initialPatients = [] }: PatientsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Use local state if we want to support client-side filtering on the initial data
  // In a real app with pagination, filtering would happen server-side/API-side
  const patients = initialPatients;

  // Filter patients based on search and status
  const filteredPatients = patients.filter((patient) => {
    // Search filter
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.includes(searchTerm) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter logic
    if (statusFilter === 'all') return true;

    if (statusFilter === 'opt-out') return !!patient.optedOutAt;

    // Check last message for status
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
        lastMessage &&
        (lastMessage.status === 'RESPONDED' || lastMessage.rating)
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

    // Check message history
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

          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border shadow-sm overflow-hidden">
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
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {patient.name}
                      </span>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <History className="mr-2 h-4 w-4" /> Ver historial
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="mr-2 h-4 w-4" /> Enviar
                          mensaje
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600">
                          <Ban className="mr-2 h-4 w-4" /> Dar de baja
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-gray-500 text-center py-2">
        Mostrando {filteredPatients.length} de {patients.length} pacientes
      </div>
    </div>
  );
}
