'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '../../../../components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Template } from '../../../../types/mock-types';
import { TemplatesList } from '../../../../components/templates/templates-list';

const TemplateDialog = dynamic(
  () =>
    import('../../../../components/templates/template-dialog').then(
      (mod) => mod.TemplateDialog,
    ),
  { ssr: false },
);

// Mock Data
const MOCK_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Solicitud Estándar',
    type: 'INITIAL',
    content:
      'Hola {nombre}, gracias por visitar a Dr. {doctor} en {consultorio}. ¿Podrías regalarnos 30 segundos para calificar tu experiencia? Responde con un número del 1 al 5.',
    variables: ['{nombre}', '{doctor}', '{consultorio}'],
    isDefault: true,
    updatedAt: '2025-02-15',
  },
  {
    id: '2',
    name: 'Seguimiento Feliz',
    type: 'FOLLOWUP_HAPPY',
    content:
      '¡Nos alegra que hayas tenido una buena experiencia! Nos ayudaría mucho si compartes tu opinión en Google: {link}',
    variables: ['{link}'],
    isDefault: true,
    updatedAt: '2025-02-14',
  },
  {
    id: '3',
    name: 'Seguimiento Descontento',
    type: 'FOLLOWUP_UNHAPPY',
    content:
      'Lamentamos que tu visita no haya sido perfecta. Por favor cuéntanos qué podemos mejorar en este formulario privado: {link}',
    variables: ['{link}'],
    isDefault: true,
    updatedAt: '2025-02-13',
  },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>(MOCK_TEMPLATES);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const handleCreate = (
    newTemplate: Omit<Template, 'id' | 'updatedAt' | 'variables'>,
  ) => {
    const template: Template = {
      ...newTemplate,
      id: Math.random().toString(36).substr(2, 9),
      updatedAt: new Date().toISOString().split('T')[0],
      isDefault: false,
      variables:
        newTemplate.content.match(/{[^}]+}/g)?.map((v) => v.toString()) || [],
    };
    setTemplates([...templates, template]);
    toast.success('Plantilla creada', {
      description: 'La nueva plantilla ha sido guardada correctamente.',
    });
  };

  const handleUpdate = (
    updatedData: Omit<Template, 'id' | 'updatedAt' | 'variables'>,
  ) => {
    if (!editingTemplate) return;
    setTemplates(
      templates.map((t) =>
        t.id === editingTemplate.id
          ? {
              ...t,
              ...updatedData,
              updatedAt: new Date().toISOString().split('T')[0],
              variables:
                updatedData.content
                  .match(/{[^}]+}/g)
                  ?.map((v) => v.toString()) || [],
            }
          : t,
      ),
    );
    toast.success('Plantilla actualizada', {
      description: 'Los cambios han sido guardados.',
    });
    setEditingTemplate(null);
  };

  const handleDuplicate = (template: Template) => {
    const newTemplate = {
      ...template,
      id: Math.random().toString(36).substr(2, 9),
      name: `${template.name} (Copia)`,
      isDefault: false,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setTemplates([...templates, newTemplate]);
    toast.success('Plantilla duplicada', {
      description: 'Se ha creado una copia de la plantilla.',
    });
  };

  const handleDelete = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
    toast.success('Plantilla eliminada', {
      description: 'La plantilla ha sido eliminada permanentemente.',
    });
  };

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
          setEditingTemplate(template);
          setIsCreateOpen(true);
        }}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />

      <TemplateDialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) setEditingTemplate(null);
        }}
        templateToEdit={editingTemplate}
        onSave={editingTemplate ? handleUpdate : handleCreate}
      />
    </div>
  );
}
