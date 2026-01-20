'use client';

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

export default function PatientsPage() {
  const { workspace, loading: workspaceLoading } = useWorkspace();
  const workspaceId = workspace?.id || '';

  const {
    data: patients,
    isLoading: patientsLoading,
    error,
  } = usePatients(workspaceId);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pacientes</h2>
          <p className="text-muted-foreground">
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
          <PatientsList initialPatients={patients || []} />
        </CardContent>
      </Card>
    </div>
  );
}
