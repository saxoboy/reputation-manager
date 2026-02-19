'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { ExcelUpload } from './excel-upload';

interface ExcelUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  workspaceId: string;
  campaignName: string;
  onUploadSuccess?: () => void;
}

export function ExcelUploadDialog({
  open,
  onOpenChange,
  campaignId,
  workspaceId,
  campaignName,
  onUploadSuccess,
}: ExcelUploadDialogProps) {
  const handleSuccess = () => {
    onUploadSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Pacientes desde Excel</DialogTitle>
          <DialogDescription>
            Campaña: <span className="font-semibold">{campaignName}</span> — La
            IA mapeará automáticamente las columnas de tu archivo.
          </DialogDescription>
        </DialogHeader>

        <ExcelUpload
          campaignId={campaignId}
          workspaceId={workspaceId}
          onUploadSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
