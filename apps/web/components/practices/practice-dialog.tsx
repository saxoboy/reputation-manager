import { useEffect, useState } from 'react';
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
import { Practice } from '../../types/mock-types';

interface PracticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  practiceToEdit?: Practice | null;
  onSave: (practiceData: Partial<Practice>) => void;
}

export function PracticeDialog({
  open,
  onOpenChange,
  practiceToEdit,
  onSave,
}: PracticeDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    googlePlaceId: '',
  });

  useEffect(() => {
    if (practiceToEdit) {
      setFormData({
        name: practiceToEdit.name,
        address: practiceToEdit.address || '',
        phone: practiceToEdit.phone || '',
        googlePlaceId: practiceToEdit.googlePlaceId || '',
      });
    } else {
      setFormData({ name: '', address: '', phone: '', googlePlaceId: '' });
    }
  }, [practiceToEdit, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {practiceToEdit
              ? 'Editar Consultorio'
              : 'Agregar Nuevo Consultorio'}
          </DialogTitle>
          <DialogDescription>
            {practiceToEdit
              ? 'Modifica los detalles de la ubicación existente.'
              : 'Ingresa los detalles de la nueva ubicación.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Consultorio Norte"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Av. Principal 123"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+593 999 999 999"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="googlePlaceId">Google Place ID (Opcional)</Label>
            <Input
              id="googlePlaceId"
              value={formData.googlePlaceId}
              onChange={(e) =>
                setFormData({ ...formData, googlePlaceId: e.target.value })
              }
              placeholder="ChIJ..."
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {practiceToEdit ? 'Guardar Cambios' : 'Guardar Consultorio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
