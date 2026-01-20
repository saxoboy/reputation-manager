'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { CreatePatientDto } from '../../services/patient.service';
import { useCampaigns } from '../../hooks/use-campaigns';

interface CreatePatientDialogProps {
  onCreate: (data: CreatePatientDto) => Promise<void>;
  workspaceId: string;
}

export function CreatePatientDialog({
  onCreate,
  workspaceId,
}: CreatePatientDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<CreatePatientDto>>({
    name: '',
    phone: '',
    email: '',
    campaignId: '',
  });

  const { data: campaigns, isLoading: loadingCampaigns } =
    useCampaigns(workspaceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.campaignId) {
      return; // Basic validation
    }

    try {
      setIsSubmitting(true);

      const newPatient: CreatePatientDto = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        campaignId: formData.campaignId,
        appointmentTime: new Date().toISOString(), // Default to now
        hasConsent: true, // Default to true as per requirements (managed elsewhere usually but required by DTO)
      };

      await onCreate(newPatient);
      setOpen(false);
      setFormData({ name: '', phone: '', email: '', campaignId: '' });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Agregar Paciente</DialogTitle>
            <DialogDescription>
              Agrega un paciente manualmente a una campaña activa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Teléfono
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="col-span-3"
                placeholder="+593..."
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="campaign" className="text-right">
                Campaña
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.campaignId}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, campaignId: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar campaña" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingCampaigns ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : campaigns && campaigns.length > 0 ? (
                      campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500 text-center">
                        No hay campañas activas
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || loadingCampaigns}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
