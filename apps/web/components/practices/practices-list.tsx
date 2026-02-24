import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import {
  Building2,
  ExternalLink,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import { Practice } from '../../services/practice.service';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface PracticesListProps {
  practices: Practice[];
  onEdit: (practice: Practice) => void;
  onDelete: (practice: Practice) => void;
  onCreateClick?: () => void;
}

export function PracticesList({
  practices,
  onEdit,
  onDelete,
  onCreateClick,
}: PracticesListProps) {
  if (practices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <Building2 className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            No hay consultorios registrados
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Crea tu primer consultorio para empezar a enviar mensajes a tus
            pacientes.
          </p>
        </div>
        {onCreateClick && (
          <button
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Plus className="h-4 w-4" />
            Crear primer consultorio
          </button>
        )}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Dirección</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Link Reseña</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {practices.map((practice) => (
          <TableRow key={practice.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {practice.name}
              </div>
            </TableCell>
            <TableCell>
              {practice.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {practice.address}
                </div>
              )}
            </TableCell>
            <TableCell>
              {practice.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {practice.phone}
                </div>
              )}
            </TableCell>
            <TableCell>
              {practice.googlePlaceId ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={`https://search.google.com/local/writereview?placeid=${practice.googlePlaceId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      Google Reviews
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    Abrir link de reseña en Google
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className="text-xs text-muted-foreground/50">
                  Sin configurar
                </span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(practice)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Editar consultorio</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(practice)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Eliminar consultorio</TooltipContent>
                </Tooltip>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
