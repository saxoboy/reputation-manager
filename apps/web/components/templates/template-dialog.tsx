import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Template, MessageType } from '../../types/mock-types';

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateToEdit?: Template | null;
  onSave: (template: Omit<Template, 'id' | 'updatedAt' | 'variables'>) => void;
}

const TEMPLATE_TYPES_OPTIONS: { value: MessageType; label: string }[] = [
  { value: 'INITIAL', label: 'Solicitud Inicial (Rating)' },
  { value: 'FOLLOWUP_HAPPY', label: 'Seguimiento Feliz (4-5★)' },
  { value: 'FOLLOWUP_UNHAPPY', label: 'Seguimiento Descontento (1-3★)' },
  { value: 'REMINDER', label: 'Recordatorio' },
];

const AVAILABLE_VARIABLES = ['{nombre}', '{doctor}', '{consultorio}', '{link}'];

export function TemplateDialog({
  open,
  onOpenChange,
  templateToEdit,
  onSave,
}: TemplateDialogProps) {
  const [formData, setFormData] = useState<{
    name: string;
    type: MessageType;
    content: string;
  }>({
    name: '',
    type: 'INITIAL',
    content: '',
  });

  useEffect(() => {
    if (templateToEdit) {
      setFormData({
        name: templateToEdit.name,
        type: templateToEdit.type,
        content: templateToEdit.content,
      });
    } else {
      setFormData({
        name: '',
        type: 'INITIAL',
        content: '',
      });
    }
  }, [templateToEdit, open]);

  const insertVariable = (variable: string) => {
    setFormData((prev) => ({
      ...prev,
      content: prev.content + ' ' + variable,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>
            {templateToEdit ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}
          </DialogTitle>
          <DialogDescription>
            Configura el mensaje que recibirán tus pacientes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre de Plantilla</Label>
              <Input
                placeholder="Ej. Recordatorio Amigable"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Mensaje</Label>
              <Select
                value={formData.type}
                onValueChange={(val: string) =>
                  setFormData({ ...formData, type: val as MessageType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPES_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Contenido del Mensaje</Label>
              <span className="text-xs text-muted-foreground">
                {formData.content.length} caracteres
              </span>
            </div>
            <Textarea
              placeholder="Escribe tu mensaje aquí..."
              className="h-32 resize-none"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              required
            />
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs text-muted-foreground mr-2 self-center">
                Variables disponibles:
              </span>
              {AVAILABLE_VARIABLES.map((v) => (
                <Badge
                  key={v}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80 font-mono text-xs"
                  onClick={() => insertVariable(v)}
                >
                  {v}
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Guardar Plantilla</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
