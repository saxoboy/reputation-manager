'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { PatientsList } from '../../../../components/patients/patients-list';
import { CreatePatientDialog } from '../../../../components/patients/create-patient-dialog';
import { usePatients, useCreatePatient } from '../../../../hooks/use-patients';
import { useWorkspace } from '../../../../hooks/use-workspace';
import { toast } from 'sonner';
import { CreatePatientDto } from '../../../../services/patient.service';
import { Alert, AlertDescription } from '../../../../components/ui/alert';

export default function PatientsContent() {
  const { workspace, loading: workspaceLoading } = useWorkspace();
  const workspaceId = workspace?.id || '';
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const {
    data: patientsResponse,
    isLoading: patientsLoading,
    error,
  } = usePatients(workspaceId, undefined, page, LIMIT);
  const createPatientMutation = useCreatePatient(workspaceId);

  const isLoading = workspaceLoading || patientsLoading;

  const handleCreatePatient = async (data: CreatePatientDto) => {
    try {
      await createPatientMutation.mutateAsync(data);
      toast.success('Paciente creado exitosamente');
    } catch (err) {
      console.error(err);
      // El hook ya maneja el toast de error generalmente
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar pacientes. Por favor, intenta de nuevo.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Pacientes
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestiona tu base de pacientes y monitorea sus interacciones.
          </p>
        </div>

        <CreatePatientDialog
          onCreate={handleCreatePatient}
          workspaceId={workspaceId}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientsList
            initialPatients={patientsResponse?.data ?? []}
            workspaceId={workspaceId}
            pagination={
              patientsResponse
                ? {
                    page: patientsResponse.page,
                    totalPages: patientsResponse.totalPages,
                    total: patientsResponse.total,
                    onPageChange: setPage,
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
