import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Practice } from '../../types/mock-types';

interface DeletePracticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  practice: Practice | null;
  onConfirm: () => void;
}

export function DeletePracticeDialog({
  open,
  onOpenChange,
  practice,
  onConfirm,
}: DeletePracticeDialogProps) {
  if (!practice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Estás seguro?</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el
            consultorio
            <span className="font-medium text-foreground">
              {' '}
              {practice.name}{' '}
            </span>
            y todos los datos asociados.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
