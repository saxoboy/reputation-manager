'use client';

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
import { toast } from 'sonner';
import { Copy, ExternalLink, Star } from 'lucide-react';
import { Practice } from '../../services/practice.service';
import { GooglePlacesAutocompleteInput } from './google-places-autocomplete';
import { googlePlacesService } from '../../services/google-places.service';
import { useCurrentWorkspace } from '../../hooks/use-workspaces';

interface PracticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  practiceToEdit?: Practice | null;
  onSave: (practiceData: Partial<Practice>) => void | Promise<void>;
}

export function PracticeDialog({
  open,
  onOpenChange,
  practiceToEdit,
  onSave,
}: PracticeDialogProps) {
  const { data: workspace } = useCurrentWorkspace();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    googlePlaceId: '',
  });
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

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

  const handleGooglePlaceSelect = async (
    placeId: string,
    description: string,
  ) => {
    if (!workspace?.id) return;

    setFormData({ ...formData, googlePlaceId: placeId, address: description });

    // Cargar detalles adicionales del lugar
    setIsLoadingDetails(true);
    try {
      const details = await googlePlacesService.getPlaceDetails(
        workspace.id,
        placeId,
      );
      setFormData({
        ...formData,
        name: details.name || formData.name,
        address: details.formattedAddress || description,
        phone: details.formattedPhoneNumber || formData.phone,
        googlePlaceId: placeId,
      });
    } catch (error) {
      console.error('Error loading place details:', error);
      // Si falla, al menos guardamos el placeId y la dirección
      setFormData({
        ...formData,
        address: description,
        googlePlaceId: placeId,
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

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
          {/* Google Places Autocomplete */}
          {workspace?.id && (
            <GooglePlacesAutocompleteInput
              workspaceId={workspace.id}
              value={formData.address}
              onSelect={handleGooglePlaceSelect}
              onInputChange={(value) =>
                setFormData({ ...formData, address: value })
              }
              placeholder="Busca tu consultorio en Google Maps..."
              label="Buscar en Google Maps"
              required
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Consultorio</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Consultorio Norte"
              required
              disabled={isLoadingDetails}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Dirección Completa</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Av. Principal 123"
              disabled={isLoadingDetails}
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
              disabled={isLoadingDetails}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="googlePlaceId">Google Place ID</Label>
            <Input
              id="googlePlaceId"
              value={formData.googlePlaceId}
              onChange={(e) =>
                setFormData({ ...formData, googlePlaceId: e.target.value })
              }
              placeholder="ChIJ... (auto-completado)"
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Se completa automáticamente al buscar en Google Maps
            </p>
          </div>
          {formData.googlePlaceId && (
            <div className="space-y-2 rounded-md border bg-muted/40 p-3">
              <div className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <Label className="text-xs font-medium">
                  Link de Reseña Google
                </Label>
              </div>
              <p className="truncate text-xs text-muted-foreground font-mono">
                {`https://search.google.com/local/writereview?placeid=${formData.googlePlaceId}`}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const url = `https://search.google.com/local/writereview?placeid=${formData.googlePlaceId}`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <ExternalLink className="mr-1.5 h-3 w-3" />
                  Probar link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const url = `https://search.google.com/local/writereview?placeid=${formData.googlePlaceId}`;
                    navigator.clipboard.writeText(url);
                    toast.success('Link copiado al portapapeles');
                  }}
                >
                  <Copy className="mr-1.5 h-3 w-3" />
                  Copiar link
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoadingDetails}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoadingDetails}>
              {isLoadingDetails
                ? 'Cargando...'
                : practiceToEdit
                  ? 'Guardar Cambios'
                  : 'Guardar Consultorio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
