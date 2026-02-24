import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FileText, Pencil, Trash2, Copy, Plus } from 'lucide-react';
import { Template, MessageType } from '../../types/mock-types';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface TemplatesListProps {
  templates: Template[];
  onEdit: (template: Template) => void;
  onDelete: (id: string) => void;
  onDuplicate: (template: Template) => void;
  onCreateClick?: () => void;
}

const TEMPLATE_TYPES: Record<MessageType, string> = {
  INITIAL: 'Solicitud Inicial',
  FOLLOWUP_HAPPY: 'Seguimiento Feliz',
  FOLLOWUP_UNHAPPY: 'Seguimiento Descontento',
  REMINDER: 'Recordatorio',
};

export function TemplatesList({
  templates,
  onEdit,
  onDelete,
  onDuplicate,
  onCreateClick,
}: TemplatesListProps) {
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <FileText className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            No hay plantillas
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Crea una plantilla para personalizar los mensajes a tus pacientes.
          </p>
        </div>
        {onCreateClick && (
          <Button size="sm" onClick={onCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            Crear mi primera plantilla
          </Button>
        )}
      </div>
    );
  }

  const actionButtons = (template: Template) => (
    <div className="flex justify-end gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDuplicate(template)}
          >
            <Copy className="h-4 w-4" />
            <span className="sr-only">Duplicar</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Duplicar plantilla</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={() => onEdit(template)}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Editar plantilla</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(template.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Eliminar</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Eliminar plantilla</TooltipContent>
      </Tooltip>
    </div>
  );

  return (
    <>
      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {templates.map((template) => (
          <div key={template.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="font-medium text-sm truncate">{template.name}</p>
              </div>
              <Badge variant="outline" className="shrink-0 text-xs">
                {TEMPLATE_TYPES[template.type]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {template.content}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {template.updatedAt}
              </span>
              {actionButtons(template)}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="w-[40%]">Contenido</TableHead>
              <TableHead>Última Actualización</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {template.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {TEMPLATE_TYPES[template.type]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-muted-foreground truncate max-w-75">
                    {template.content}
                  </p>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {template.updatedAt}
                </TableCell>
                <TableCell className="text-right">
                  {actionButtons(template)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
