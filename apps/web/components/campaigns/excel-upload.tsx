'use client';

import { useState, useCallback, DragEvent } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  Download,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { useParseExcel, useUploadCsv } from '../../hooks/use-campaigns';
import {
  campaignService,
  type ParsedPatientPreview,
} from '../../services/campaign.service';
import { toast } from 'sonner';

interface ExcelUploadProps {
  campaignId: string;
  workspaceId: string;
  onUploadSuccess?: () => void;
  onCancel?: () => void;
}

interface EditablePatient extends ParsedPatientPreview {
  appointmentTime: string;
}

export function ExcelUpload({
  campaignId,
  workspaceId,
  onUploadSuccess,
  onCancel,
}: ExcelUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [patients, setPatients] = useState<EditablePatient[]>([]);
  const [parseErrors, setParseErrors] = useState<
    { row: number; field: string; message: string }[]
  >([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const parseExcel = useParseExcel(workspaceId, campaignId);
  const uploadCsv = useUploadCsv(workspaceId, campaignId);

  const processFile = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile);
      setPatients([]);
      setParseErrors([]);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        const result = await parseExcel.mutateAsync(base64);
        setPatients(
          result.patients.map((p) => ({
            ...p,
            // appointmentTime llega como string ISO desde la API
            // datetime-local input espera "YYYY-MM-DDTHH:mm"
            appointmentTime: String(p.appointmentTime).slice(0, 16),
          })),
        );
        setParseErrors(result.errors);
      };
      reader.readAsArrayBuffer(selectedFile);
    },
    [parseExcel],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile &&
        (droppedFile.name.endsWith('.xlsx') ||
          droppedFile.name.endsWith('.xls'))
      ) {
        processFile(droppedFile);
      }
    },
    [processFile],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const handleDeleteRow = (index: number) => {
    setPatients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFieldChange = (
    index: number,
    field: keyof EditablePatient,
    value: string | boolean,
  ) => {
    setPatients((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  };

  const handleConfirm = async () => {
    if (patients.length === 0) return;

    const csvLines = [
      'name,phone,email,appointmentTime,appointmentType,hasConsent',
      ...patients.map((p) => {
        const name = (p.name ?? '').replace(/,/g, ' ');
        const phone = (p.phone ?? '').replace(/,/g, '');
        const email = (p.email ?? '').replace(/,/g, '');
        const time = (p.appointmentTime ?? '').replace(/,/g, '');
        const type = (p.appointmentType ?? '').replace(/,/g, ' ');
        const consent = p.hasConsent ? 'true' : 'false';
        return `${name},${phone},${email},${time},${type},${consent}`;
      }),
    ];
    const csvContent = csvLines.join('\n');

    await uploadCsv.mutateAsync(csvContent);
    onUploadSuccess?.();
  };

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      await campaignService.downloadExcelTemplate(workspaceId);
    } catch {
      toast.error('Error al descargar la plantilla');
    } finally {
      setIsDownloading(false);
    }
  };

  const isLoading = parseExcel.isPending;
  const isUploading = uploadCsv.isPending;
  const showPreview = patients.length > 0 || parseErrors.length > 0;

  return (
    <div className="space-y-5">
      {/* Zona de carga */}
      {!file && (
        <div
          className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">
            Arrastra tu archivo Excel aquí
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Acepta .xlsx y .xls
          </p>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="excel-upload"
          />
          <label htmlFor="excel-upload">
            <Button variant="outline" asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Seleccionar Archivo
              </span>
            </Button>
          </label>
        </div>
      )}

      {/* Archivo seleccionado + loading */}
      {file && !showPreview && (
        <Alert>
          <FileSpreadsheet className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
              {isLoading && (
                <span className="text-muted-foreground text-sm">
                  — Analizando con IA...
                </span>
              )}
            </span>
            {!isLoading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setPatients([]);
                  setParseErrors([]);
                  parseExcel.reset();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Errores de parseo */}
      {parseErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-1">
              {parseErrors.length} fila(s) con errores detectados por la IA
            </p>
            <div className="space-y-0.5 max-h-32 overflow-y-auto text-sm">
              {parseErrors.map((e, i) => (
                <p key={i}>
                  Fila {e.row} · <span className="font-medium">{e.field}</span>:{' '}
                  {e.message}
                </p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabla editable de preview */}
      {patients.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {patients.length} paciente(s) listos para importar — puedes editar
              o eliminar filas
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFile(null);
                setPatients([]);
                setParseErrors([]);
                parseExcel.reset();
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Cambiar archivo
            </Button>
          </div>

          <div className="border rounded-lg overflow-auto max-h-80">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-36">Nombre</TableHead>
                  <TableHead className="min-w-32">Teléfono</TableHead>
                  <TableHead className="min-w-36">Email</TableHead>
                  <TableHead className="min-w-36">Fecha Cita</TableHead>
                  <TableHead className="min-w-28">Tipo</TableHead>
                  <TableHead className="w-12 text-center">OK</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="p-1">
                      <Input
                        value={p.name}
                        onChange={(e) =>
                          handleFieldChange(i, 'name', e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        value={p.phone}
                        onChange={(e) =>
                          handleFieldChange(i, 'phone', e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        value={p.email ?? ''}
                        onChange={(e) =>
                          handleFieldChange(i, 'email', e.target.value)
                        }
                        className="h-8 text-sm"
                        placeholder="—"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        type="datetime-local"
                        value={p.appointmentTime}
                        onChange={(e) =>
                          handleFieldChange(
                            i,
                            'appointmentTime',
                            e.target.value,
                          )
                        }
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        value={p.appointmentType ?? ''}
                        onChange={(e) =>
                          handleFieldChange(
                            i,
                            'appointmentType',
                            e.target.value,
                          )
                        }
                        className="h-8 text-sm"
                        placeholder="—"
                      />
                    </TableCell>
                    <TableCell className="p-1 text-center">
                      <Checkbox
                        checked={p.hasConsent}
                        onCheckedChange={(v) =>
                          handleFieldChange(i, 'hasConsent', !!v)
                        }
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteRow(i)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Resultado de importación */}
      {uploadCsv.isSuccess && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Importación completada exitosamente
          </AlertDescription>
        </Alert>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownloadTemplate}
          disabled={isDownloading}
          className="text-muted-foreground"
        >
          {isDownloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Descargar plantilla
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isUploading}>
            Cancelar
          </Button>
          {patients.length > 0 && (
            <Button
              onClick={handleConfirm}
              disabled={isUploading || patients.length === 0}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                `Confirmar Importación (${patients.length})`
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
