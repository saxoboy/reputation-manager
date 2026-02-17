'use client';

import { Button } from '../ui/button';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { useToast } from '../../hooks/use-toast';
import { getBaseUrl } from '../../lib/get-base-url';

interface ExportButtonsProps {
  workspaceId: string;
  dateRange?: DateRange;
}

export function ExportButtons({ workspaceId, dateRange }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);

    try {
      const params = new URLSearchParams();
      if (dateRange?.from) {
        params.append('startDate', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('endDate', dateRange.to.toISOString());
      }

      const queryString = params.toString();
      const url = `${getBaseUrl()}/api/workspaces/${workspaceId}/analytics/export/${format}${queryString ? `?${queryString}` : ''}`;

      // Hacer download del archivo
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export error details:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url,
        });
        throw new Error(`Error al exportar (${response.status}): ${errorText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `analytics-${timestamp}.${format}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: 'Exportación exitosa',
        description: `Reporte ${format.toUpperCase()} descargado correctamente`,
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: 'Error al exportar',
        description: 'No se pudo generar el reporte. Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('csv')}
        disabled={isExporting}
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Exportar CSV
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('pdf')}
        disabled={isExporting}
      >
        <FileText className="h-4 w-4 mr-2" />
        Exportar PDF
      </Button>
    </div>
  );
}
