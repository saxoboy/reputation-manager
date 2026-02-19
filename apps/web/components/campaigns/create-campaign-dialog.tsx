'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Plus, FileSpreadsheet, X } from 'lucide-react';
import { useCreateCampaign } from '../../hooks/use-campaigns';
import { usePractices, useCreatePractice } from '../../hooks/use-practices';
import { campaignService } from '../../services/campaign.service';

interface CreateCampaignDialogProps {
  workspaceId: string;
}

export function CreateCampaignDialog({
  workspaceId,
}: CreateCampaignDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({ name: '', practiceId: '' });
  const [showNewPractice, setShowNewPractice] = useState(false);
  const [newPracticeName, setNewPracticeName] = useState('');

  const { data: practices = [] } = usePractices(workspaceId);
  const createCampaign = useCreateCampaign(workspaceId);
  const createPractice = useCreatePractice(workspaceId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSelectPractice = (val: string) => {
    if (val === '__new__') {
      setShowNewPractice(true);
      return;
    }
    setFormData((curr) => ({ ...curr, practiceId: val }));
  };

  const handleCreatePractice = async () => {
    if (!newPracticeName.trim()) return;
    try {
      const practice = await createPractice.mutateAsync({
        name: newPracticeName.trim(),
      });
      setFormData((curr) => ({ ...curr, practiceId: practice.id }));
      setShowNewPractice(false);
      setNewPracticeName('');
    } catch {
      // error handled by mutation hook
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const campaign = await createCampaign.mutateAsync({
        name: formData.name,
        practiceId: formData.practiceId,
        patients: [],
      });

      if (selectedFile) {
        const csvContent = await selectedFile.text();
        await campaignService.uploadCsv(workspaceId, campaign.id, csvContent);
      }

      setIsOpen(false);
      setFormData({ name: '', practiceId: '' });
      setSelectedFile(null);
    } catch {
      // errors handled by mutation hooks
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setFormData({ name: '', practiceId: '' });
      setSelectedFile(null);
      setShowNewPractice(false);
      setNewPracticeName('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Campaña
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Crear Nueva Campaña</DialogTitle>
          <DialogDescription>
            Crea la campaña y opcionalmente importa tu lista de pacientes en
            CSV.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Nombre de la Campaña</Label>
            <Input
              placeholder="Ej. Visitas Enero 2026"
              value={formData.name}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((curr) => ({ ...curr, name: value }));
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Consultorio</Label>

            {showNewPractice ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre del consultorio"
                  value={newPracticeName}
                  onChange={(e) => setNewPracticeName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    (e.preventDefault(), handleCreatePractice())
                  }
                  autoFocus
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreatePractice}
                  disabled={!newPracticeName.trim() || createPractice.isPending}
                >
                  {createPractice.isPending ? '...' : 'Crear'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowNewPractice(false);
                    setNewPracticeName('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Select
                value={formData.practiceId}
                onValueChange={handleSelectPractice}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el consultorio" />
                </SelectTrigger>
                <SelectContent>
                  {practices.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                  <SelectItem
                    value="__new__"
                    className="text-primary font-medium"
                  >
                    + Nuevo consultorio
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Lista de Pacientes (CSV){' '}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </Label>
            <label
              htmlFor="csv-upload"
              className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground mb-2" />
              {selectedFile ? (
                <div className="text-sm">
                  <p className="font-medium text-primary">
                    {selectedFile.name}
                  </p>
                  <p className="text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">Arrastra tu archivo aquí</p>
                  <p>o haz clic para seleccionar</p>
                </div>
              )}
              <Input
                type="file"
                accept=".csv"
                className="hidden"
                id="csv-upload"
                onChange={handleFileChange}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              Formato: Nombre, Teléfono, Email (opcional) — puedes agregar
              pacientes después
            </p>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={
                !formData.name ||
                !formData.practiceId ||
                showNewPractice ||
                createCampaign.isPending
              }
            >
              {createCampaign.isPending ? 'Creando...' : 'Crear Campaña'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
