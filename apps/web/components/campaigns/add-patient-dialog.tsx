'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { DateTimePicker } from '../ui/date-time-picker';
import { useCreatePatient, useUpdatePatient } from '../../hooks/use-patients';
import { Patient } from '../../services/patient.service';

interface AddPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  campaignId: string;
  /** Si se pasa, el dialog opera en modo edición */
  patient?: Patient;
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  appointmentDate: Date | undefined;
  appointmentType: string;
  preferredChannel: 'SMS' | 'WHATSAPP';
  hasConsent: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  phone: '',
  email: '',
  appointmentDate: undefined,
  appointmentType: '',
  preferredChannel: 'SMS',
  hasConsent: false,
};

export function AddPatientDialog({
  open,
  onOpenChange,
  workspaceId,
  campaignId,
  patient,
}: AddPatientDialogProps) {
  const isEdit = !!patient;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const createPatient = useCreatePatient(workspaceId);
  const updatePatient = useUpdatePatient(workspaceId);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (patient) {
      setForm({
        name: patient.name,
        phone: patient.phone,
        email: patient.email ?? '',
        appointmentDate: new Date(patient.appointmentTime),
        appointmentType: patient.appointmentType ?? '',
        preferredChannel:
          (patient.preferredChannel as 'SMS' | 'WHATSAPP') ?? 'SMS',
        hasConsent: patient.hasConsent,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [patient, open]);

  const isPending = createPatient.isPending || updatePatient.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.appointmentDate) return;

    try {
      if (isEdit && patient) {
        await updatePatient.mutateAsync({
          patientId: patient.id,
          data: {
            name: form.name,
            phone: form.phone,
            email: form.email || undefined,
            appointmentTime: form.appointmentDate.toISOString(),
            appointmentType: form.appointmentType || undefined,
            preferredChannel: form.preferredChannel,
            hasConsent: form.hasConsent,
          },
        });
      } else {
        await createPatient.mutateAsync({
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          appointmentTime: form.appointmentDate.toISOString(),
          appointmentType: form.appointmentType || undefined,
          preferredChannel: form.preferredChannel,
          hasConsent: form.hasConsent,
          campaignId,
        });
      }

      queryClient.invalidateQueries({
        queryKey: ['patients', 'campaign', workspaceId, campaignId],
      });
      queryClient.invalidateQueries({
        queryKey: ['campaigns', workspaceId, campaignId],
      });

      onOpenChange(false);
    } catch {
      // errors handled by mutation hooks
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen && !isEdit) setForm(EMPTY_FORM);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Paciente' : 'Agregar Paciente'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifica los datos del paciente.'
              : 'Ingresa los datos del paciente para agregarlo a esta campaña.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Nombre completo *</Label>
              <Input
                placeholder="Ej. Juan Pérez"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Teléfono *</Label>
              <Input
                placeholder="+593999999999"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="juan@email.com"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Fecha y Hora de la Cita *</Label>
              <DateTimePicker
                value={form.appointmentDate}
                onChange={(date) =>
                  setForm((f) => ({ ...f, appointmentDate: date }))
                }
                placeholder="Selecciona fecha y hora"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Tipo de Cita</Label>
              <Input
                placeholder="Consulta, Limpieza, Cirugía…"
                value={form.appointmentType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, appointmentType: e.target.value }))
                }
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Canal Preferido</Label>
              <Select
                value={form.preferredChannel}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    preferredChannel: v as 'SMS' | 'WHATSAPP',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md border p-3">
            <Checkbox
              id="consent"
              checked={form.hasConsent}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, hasConsent: !!checked }))
              }
            />
            <div className="space-y-1">
              <Label htmlFor="consent" className="cursor-pointer font-medium">
                El paciente ha dado su consentimiento *
              </Label>
              <p className="text-xs text-muted-foreground">
                Requerido para poder enviarle mensajes de feedback.
              </p>
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
            <Button
              type="submit"
              disabled={
                !form.name ||
                !form.phone ||
                !form.appointmentDate ||
                !form.hasConsent ||
                isPending
              }
            >
              {isPending
                ? 'Guardando...'
                : isEdit
                  ? 'Guardar Cambios'
                  : 'Agregar Paciente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
