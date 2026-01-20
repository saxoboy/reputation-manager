'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { CsvUpload } from './csv-upload';

interface CsvUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  workspaceId: string;
  campaignName: string;
  onUploadSuccess?: () => void;
}

export function CsvUploadDialog({
  open,
  onOpenChange,
  campaignId,
  workspaceId,
  campaignName,
  onUploadSuccess,
}: CsvUploadDialogProps) {
  const handleSuccess = () => {
    if (onUploadSuccess) {
      onUploadSuccess();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Pacientes por CSV</DialogTitle>
          <DialogDescription>
            Campaña: <span className="font-semibold">{campaignName}</span>
          </DialogDescription>
        </DialogHeader>

        <CsvUpload
          campaignId={campaignId}
          workspaceId={workspaceId}
          onUploadSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
