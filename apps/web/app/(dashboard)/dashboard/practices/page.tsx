'use client';

import { useState } from 'react';
import { useWorkspace } from '../../../../hooks/use-workspace';
import { usePractices } from '../../../../hooks/use-practices';
import { Button } from '../../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import { Skeleton } from '../../../../components/ui/skeleton';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { Plus, AlertCircle } from 'lucide-react';
import { PracticesList } from '../../../../components/practices/practices-list';
import { PracticeDialog } from '../../../../components/practices/practice-dialog';
import { DeletePracticeDialog } from '../../../../components/practices/delete-practice-dialog';
import type { Practice } from '../../../../services/practice.service';

export default function PracticesPage() {
  const { workspace, loading: workspaceLoading } = useWorkspace();
  const {
    data: practices = [],
    isLoading: practicesLoading,
    error,
  } = usePractices(workspace?.id || '');

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPractice, setEditingPractice] = useState<Practice | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [practiceToDelete, setPracticeToDelete] = useState<Practice | null>(
    null
  );

  const handleOpenCreateDialog = () => {
    setEditingPractice(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (practice: Practice) => {
    setEditingPractice(practice);
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (practice: Practice) => {
    setPracticeToDelete(practice);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = () => {
    setIsDialogOpen(false);
    setEditingPractice(null);
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(false);
    setPracticeToDelete(null);
  };

  if (workspaceLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No se encontró un workspace activo. Por favor crea uno primero.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar los consultorios. Por favor, intenta de nuevo.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Consultorios</h2>
          <p className="text-muted-foreground">
            Gestiona tus ubicaciones físicas y su información de contacto.
          </p>
        </div>

        <Button onClick={handleOpenCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Consultorio
        </Button>
      </div>

      <PracticeDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        // @ts-expect-error Type mismatch between Practice from service and mock-types
        practiceToEdit={editingPractice}
        onSave={handleSave}
      />

      <DeletePracticeDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        // @ts-expect-error Type mismatch between Practice from service and mock-types
        practice={practiceToDelete}
        onConfirm={handleDelete}
      />

      <Card>
        <CardHeader>
          <CardTitle>Listado de Consultorios</CardTitle>
          <CardDescription>
            {practices.length} ubicación(es) registrada(s) en este workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {practicesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : practices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay consultorios registrados. Crea uno para comenzar.
            </div>
          ) : (
            <PracticesList
              // @ts-expect-error Type mismatch between Practice from service and mock-types
              practices={practices}
              // @ts-expect-error Handler type mismatch
              onEdit={handleOpenEditDialog}
              // @ts-expect-error Handler type mismatch
              onDelete={handleOpenDeleteDialog}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
