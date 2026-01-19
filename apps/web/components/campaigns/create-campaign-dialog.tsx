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
import { Plus, FileSpreadsheet } from 'lucide-react';
import { Campaign } from '../../types/mock-types';

interface CreateCampaignDialogProps {
  onCreate: (campaign: Campaign) => void;
}

const MOCK_PRACTICES = [
  { id: '1', name: 'Consultorio Norte' },
  { id: '2', name: 'Consultorio Centro' },
];

export function CreateCampaignDialog({ onCreate }: CreateCampaignDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    practiceId: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simulate campaign creation with file processing
    const practiceName = MOCK_PRACTICES.find(p => p.id === formData.practiceId)?.name || 'Desconocido';

    const newCampaign: Campaign = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      practiceName,
      status: 'DRAFT',
      patientsCount: selectedFile ? Math.floor(Math.random() * 50) + 10 : 0, // Mock parsed count
      respondedCount: 0,
      nps: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onCreate(newCampaign);
    setIsOpen(false);

    // Reset form
    setFormData({ name: '', practiceId: '' });
    setSelectedFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            Importa un archivo CSV con tus pacientes para iniciar el proceso de feedback.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Nombre de la Campaña</Label>
            <Input
              placeholder="Ej. Visitas Enero 2026"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Consultorio</Label>
            <Select
              value={formData.practiceId}
              onValueChange={(val: string) => setFormData({ ...formData, practiceId: val })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el consultorio" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_PRACTICES.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Lista de Pacientes (CSV)</Label>
            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors">
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground mb-2" />
              {selectedFile ? (
                <div className="text-sm">
                  <p className="font-medium text-primary">{selectedFile.name}</p>
                  <p className="text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
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
                required // For now mandatory
              />
              <Label
                htmlFor="csv-upload"
                className="absolute inset-0 cursor-pointer"
                aria-label="Subir archivo CSV"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Formato requerido: Nombre, Teléfono, Email (opcional)
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!selectedFile || !formData.name}>
              Crear Campaña
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
