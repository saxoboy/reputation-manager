'use client';

import { useState, useCallback, DragEvent } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';

interface CsvUploadProps {
  campaignId: string;
  workspaceId: string;
  onUploadSuccess?: () => void;
  onCancel?: () => void;
}

interface ParsedRow {
  name: string;
  phone: string;
  email?: string;
  appointmentTime: string;
  appointmentType?: string;
  hasConsent: string;
}

interface ValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export function CsvUpload({
  campaignId,
  workspaceId,
  onUploadSuccess,
  onCancel,
}: CsvUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [previewData, setPreviewData] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    summary?: {
      totalRows: number;
      validRows: number;
      invalidRows: number;
      patientsCreated: number;
    };
  } | null>(null);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      processFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrors([]);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      parsePreview(content);
    };
    reader.readAsText(selectedFile);
  };

  const parsePreview = (content: string) => {
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length === 0) {
      setPreviewData([]);
      return;
    }

    // Asumir que la primera línea es header
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    // Parsear hasta 5 filas de preview
    const rows: ParsedRow[] = [];
    for (let i = 1; i < Math.min(6, lines.length); i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const row: ParsedRow = {
        name: values[headers.indexOf('name')] || '',
        phone: values[headers.indexOf('phone')] || '',
        email: values[headers.indexOf('email')],
        appointmentTime: values[headers.indexOf('appointmenttime')] || '',
        appointmentType: values[headers.indexOf('appointmenttype')],
        hasConsent: values[headers.indexOf('hasconsent')] || '',
      };
      rows.push(row);
    }

    setPreviewData(rows);
  };

  const handleUpload = async () => {
    if (!csvContent) return;

    setIsUploading(true);
    setErrors([]);

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/campaigns/${campaignId}/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            csvContent,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setErrors(result.errors || []);
        setUploadResult({
          success: false,
          message: result.message || 'Error al procesar el CSV',
        });
      } else {
        setUploadResult({
          success: true,
          message: result.message,
          summary: result.summary,
        });
        setErrors(result.errors || []);

        if (onUploadSuccess) {
          setTimeout(() => onUploadSuccess(), 2000);
        }
      }
    } catch {
      setUploadResult({
        success: false,
        message: 'Error de red al subir el archivo',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!file && (
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Arrastra tu archivo CSV aquí
          </h3>
          <p className="text-muted-foreground mb-4">
            o haz click para seleccionar
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload">
            <Button variant="outline" asChild>
              <span>Seleccionar Archivo</span>
            </Button>
          </label>
        </div>
      )}

      {/* File Info */}
      {file && !uploadResult && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFile(null);
                setCsvContent('');
                setPreviewData([]);
                setErrors([]);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Table */}
      {previewData.length > 0 && !uploadResult && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted px-4 py-2">
            <h4 className="font-semibold">Vista Previa (primeras 5 filas)</h4>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Fecha Cita</TableHead>
                <TableHead>Consentimiento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.phone}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.email || '-'}
                  </TableCell>
                  <TableCell>{row.appointmentTime}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.hasConsent === 'true' ? 'default' : 'destructive'
                      }
                    >
                      {row.hasConsent}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <Alert variant={uploadResult.success ? 'default' : 'destructive'}>
          {uploadResult.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            <p className="font-semibold">{uploadResult.message}</p>
            {uploadResult.summary && (
              <div className="mt-2 space-y-1 text-sm">
                <p>Total de filas: {uploadResult.summary.totalRows}</p>
                <p>Filas válidas: {uploadResult.summary.validRows}</p>
                <p>Pacientes creados: {uploadResult.summary.patientsCreated}</p>
                {uploadResult.summary.invalidRows > 0 && (
                  <p className="text-destructive">
                    Filas con errores: {uploadResult.summary.invalidRows}
                  </p>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="border border-destructive rounded-lg p-4">
          <h4 className="font-semibold text-destructive mb-2">
            Errores de Validación ({errors.length})
          </h4>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {errors.map((error, index) => (
              <div key={index} className="text-sm">
                <span className="font-medium">Fila {error.row}</span> -{' '}
                <span className="text-muted-foreground">{error.field}</span>:{' '}
                {error.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {file && !uploadResult && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? 'Procesando...' : 'Importar Pacientes'}
          </Button>
        </div>
      )}

      {uploadResult && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setFile(null);
              setCsvContent('');
              setPreviewData([]);
              setErrors([]);
              setUploadResult(null);
            }}
          >
            Importar Otro Archivo
          </Button>
          <Button onClick={onUploadSuccess}>Cerrar</Button>
        </div>
      )}

      {/* CSV Format Help */}
      <div className="text-sm text-muted-foreground border-t pt-4">
        <p className="font-semibold mb-2">Formato CSV esperado:</p>
        <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
          {`name,phone,email,appointmentTime,appointmentType,hasConsent
Juan Pérez,+593999999999,juan@email.com,2026-01-20T10:00:00,Consulta,true
María López,0988888888,maria@email.com,2026-01-20T11:30:00,Limpieza,true`}
        </pre>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li>
            El teléfono debe estar en formato ecuatoriano (+593XXXXXXXXX o
            0XXXXXXXXX)
          </li>
          <li>appointmentTime en formato ISO 8601 (YYYY-MM-DDTHH:mm:ss)</li>
          <li>hasConsent debe ser true para poder enviar mensajes</li>
        </ul>
      </div>
    </div>
  );
}
