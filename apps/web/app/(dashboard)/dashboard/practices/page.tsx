'use client';

import { useState, useEffect } from 'react';
import { useWorkspace } from '../../../../hooks/use-workspace';
import { Button } from '../../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import { Plus } from 'lucide-react';
import { Practice } from '../../../../types/mock-types';
import { PracticesList } from '../../../../components/practices/practices-list';
import { PracticeDialog } from '../../../../components/practices/practice-dialog';
import { DeletePracticeDialog } from '../../../../components/practices/delete-practice-dialog';

export default function PracticesPage() {
  const { workspace, loading: workspaceLoading } = useWorkspace();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPractice, setEditingPractice] = useState<Practice | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [practiceToDelete, setPracticeToDelete] = useState<Practice | null>(
    null,
  );

  const fetchPractices = async () => {
    if (!workspace) return;
    try {
      const response = await fetch(`/api/workspaces/${workspace.id}/practices`);
      if (response.ok) {
        const data = await response.json();
        setPractices(data);
      }
    } catch (error) {
      console.error('Error fetching practices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspace) {
      fetchPractices();
    }
  }, [workspace]);

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

  const handleSave = async (practiceData: Partial<Practice>) => {
    if (!workspace) return;

    try {
      const url = editingPractice
        ? `/api/workspaces/${workspace.id}/practices/${editingPractice.id}`
        : `/api/workspaces/${workspace.id}/practices`;

      const method = editingPractice ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(practiceData),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        fetchPractices();
      } else {
        console.error('Failed to save practice');
      }
    } catch (error) {
      console.error('Error saving practice:', error);
    }
  };

  const handleDelete = async () => {
    if (!workspace || !practiceToDelete) return;

    try {
      const response = await fetch(
        `/api/workspaces/${workspace.id}/practices/${practiceToDelete.id}`,
        {
          method: 'DELETE',
        },
      );

      if (response.ok) {
        setIsDeleteDialogOpen(false);
        setPracticeToDelete(null);
        fetchPractices();
      } else {
        console.error('Failed to delete practice');
      }
    } catch (error) {
      console.error('Error deleting practice:', error);
    }
  };

  if (workspaceLoading) {
    return <div className="p-6">Cargando workspace...</div>;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Consultorios</h2>
          <p className="text-muted-foreground">
            Gestiona tus ubicaciones físicas y su información de contacto.
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Consultorio
          </Button>
        </div>

        <PracticeDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          practiceToEdit={editingPractice}
          onSave={handleSave}
        />

        <DeletePracticeDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          practice={practiceToDelete}
          onConfirm={handleDelete}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Consultorios</CardTitle>
          <CardDescription>
            {practices.length} ubicación(es) registrada(s) en este workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Cargando consultorios...</div>
          ) : (
            <PracticesList
              practices={practices}
              onEdit={handleOpenEditDialog}
              onDelete={handleOpenDeleteDialog}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
