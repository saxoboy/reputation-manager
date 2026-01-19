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
import { FileText, Pencil, Trash2, Copy } from 'lucide-react';
import { Template, MessageType } from '../../types/mock-types';

interface TemplatesListProps {
  templates: Template[];
  onEdit: (template: Template) => void;
  onDelete: (id: string) => void;
  onDuplicate: (template: Template) => void;
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
}: TemplatesListProps) {
  const getBadgeVariant = (type: MessageType) => {
    switch (type) {
      case 'INITIAL':
        return 'default';
      case 'FOLLOWUP_HAPPY':
        return 'success'; // Assuming you have a success variant or stick to default/secondary
      case 'FOLLOWUP_UNHAPPY':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
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
              <Badge variant="outline">{TEMPLATE_TYPES[template.type]}</Badge>
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
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDuplicate(template)}
                  title="Duplicar"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(template)}
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(template.id)}
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
