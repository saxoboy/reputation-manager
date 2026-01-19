'use client';

import { useState } from 'react';
import dynamicImport from 'next/dynamic';
import { Button } from '../../../../components/ui/button';
import { Skeleton } from '../../../../components/ui/skeleton';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { Plus, AlertCircle } from 'lucide-react';
import { useWorkspace } from '../../../../hooks/use-workspace';
import {
  useTemplates,
  useDeleteTemplate,
  useDuplicateTemplate,
} from '../../../../hooks/use-templates';
import { TemplatesList } from '../../../../components/templates/templates-list';
import type { MessageTemplate } from '../../../../services/template.service';

const TemplateDialog = dynamicImport(
  () =>
    import('../../../../components/templates/template-dialog').then(
      (mod) => mod.TemplateDialog
    ),
  { ssr: false }
);

// Disable SSR for Radix UI compatibility
export const dynamic = 'force-dynamic';

export default function TemplatesPage() {
  const { workspace, loading: workspaceLoading } = useWorkspace();
  const workspaceId = workspace?.id || '';

  const {
    data: templatesData = [],
    isLoading: templatesLoading,
    error,
  } = useTemplates(workspaceId);

  const deleteMutation = useDeleteTemplate(workspaceId);
  const duplicateMutation = useDuplicateTemplate(workspaceId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<MessageTemplate | null>(null);

  const isLoading = workspaceLoading || templatesLoading;

  // No renderizar nada hasta tener workspace
  if (!workspace && !workspaceLoading) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No se pudo cargar el espacio de trabajo.
        </AlertDescription>
      </Alert>
    );
  }

  // Transform backend data to match component expectations
  const templates = templatesData.map((template) => ({
    ...template,
    isDefault: false as const, // TODO: Add isDefault field to backend
    updatedAt: new Date(template.updatedAt).toISOString().split('T')[0],
  })) as Array<typeof templatesData[0] & { isDefault?: boolean; updatedAt: string }>;

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleDuplicate = (template: { id: string; workspaceId?: string }) => {
    // useDuplicateTemplate solo necesita el ID
    duplicateMutation.mutate(template.id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar las plantillas. Por favor, intenta de nuevo.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plantillas</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los mensajes automáticos que se envían a tus pacientes.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Plantilla
        </Button>
      </div>

      <TemplatesList
        templates={templates}
        onEdit={(template) => {
          setEditingTemplate(template as unknown as MessageTemplate);
          setIsCreateOpen(true);
        }}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />

      <TemplateDialog
        open={isCreateOpen}
        onOpenChange={(open: boolean) => {
          setIsCreateOpen(open);
          if (!open) setEditingTemplate(null);
        }}
        templateToEdit={editingTemplate}
        onSave={() => {
          setIsCreateOpen(false);
          setEditingTemplate(null);
        }}
      />
    </div>
  );
}
