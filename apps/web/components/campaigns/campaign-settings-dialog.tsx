'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
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
import { Separator } from '../ui/separator';
import {
  useUpdateCampaign,
  useDeleteCampaign,
} from '../../hooks/use-campaigns';
import { Campaign } from '../../services/campaign.service';

interface CampaignSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  campaign: Campaign;
}

export function CampaignSettingsDialog({
  open,
  onOpenChange,
  workspaceId,
  campaign,
}: CampaignSettingsDialogProps) {
  const router = useRouter();
  const updateCampaign = useUpdateCampaign(workspaceId);
  const deleteCampaign = useDeleteCampaign(workspaceId);

  const [name, setName] = useState(campaign.name);
  const [description, setDescription] = useState(campaign.description ?? '');
  const [status, setStatus] = useState(campaign.status);
  const [scheduledHoursAfter, setScheduledHoursAfter] = useState(
    String(campaign.scheduledHoursAfter ?? 2),
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setName(campaign.name);
      setDescription(campaign.description ?? '');
      setStatus(campaign.status);
      setScheduledHoursAfter(String(campaign.scheduledHoursAfter ?? 2));
      setConfirmDelete(false);
    }
  }, [open, campaign]);

  const hoursValue = parseInt(scheduledHoursAfter, 10);
  const isHoursValid =
    !isNaN(hoursValue) && hoursValue >= 1 && hoursValue <= 72;

  const handleSave = () => {
    updateCampaign.mutate(
      {
        campaignId: campaign.id,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          status,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  const handleDelete = () => {
    deleteCampaign.mutate(campaign.id, {
      onSuccess: () => {
        onOpenChange(false);
        router.push('/dashboard/campaigns');
      },
    });
  };

  const statusLabels: Record<string, string> = {
    DRAFT: 'Borrador',
    ACTIVE: 'Activa',
    PAUSED: 'Pausada',
    COMPLETED: 'Completada',
    ARCHIVED: 'Archivada',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle>Configuración de Campaña</DialogTitle>
          <DialogDescription>
            Edita los datos generales de esta campaña.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="camp-name">Nombre</Label>
            <Input
              id="camp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de la campaña"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="camp-desc">Descripción</Label>
            <Textarea
              id="camp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción opcional"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="camp-status">Estado</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as Campaign['status'])}
            >
              <SelectTrigger id="camp-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="camp-hours">
              Horas de espera para enviar el mensaje
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="camp-hours"
                type="number"
                min={1}
                max={72}
                value={scheduledHoursAfter}
                onChange={(e) => setScheduledHoursAfter(e.target.value)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                horas después de la cita
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Danger zone */}
        <div className="pt-2">
          <p className="mb-2 text-sm font-medium text-destructive">
            Zona de peligro
          </p>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                ¿Seguro? Esta acción no se puede deshacer.
              </p>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteCampaign.isPending}
                onClick={handleDelete}
              >
                {deleteCampaign.isPending ? 'Eliminando...' : 'Confirmar'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setConfirmDelete(true)}
            >
              Eliminar campaña
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateCampaign.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateCampaign.isPending || !name.trim() || !isHoursValid}
          >
            {updateCampaign.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
