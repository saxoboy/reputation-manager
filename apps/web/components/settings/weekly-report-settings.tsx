'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { CalendarDays, Mail, Send, X } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { getBaseUrl } from '../../lib/get-base-url';
import { useCurrentWorkspace } from '../../hooks/use-workspaces';

interface WeeklyReportConfig {
  id: string;
  enabled: boolean;
  dayOfWeek: string;
  recipients: string[];
  lastSentAt: string | null;
}

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Lunes' },
  { value: 'TUESDAY', label: 'Martes' },
  { value: 'WEDNESDAY', label: 'Miércoles' },
  { value: 'THURSDAY', label: 'Jueves' },
  { value: 'FRIDAY', label: 'Viernes' },
  { value: 'SATURDAY', label: 'Sábado' },
  { value: 'SUNDAY', label: 'Domingo' },
];

export function WeeklyReportSettings() {
  const { toast } = useToast();
  const { data: workspace } = useCurrentWorkspace();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  // Config state
  const [enabled, setEnabled] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState('MONDAY');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);

  // Form state
  const [newEmail, setNewEmail] = useState('');
  const [testEmail, setTestEmail] = useState('');

  // Cargar configuración actual
  useEffect(() => {
    if (workspace?.id) loadConfig();
  }, [workspace?.id]);

  const loadConfig = async () => {
    if (!workspace?.id) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${getBaseUrl()}/api/workspaces/${workspace.id}/weekly-reports/config`,
        {
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('Error al cargar la configuración');
      }

      const config: WeeklyReportConfig = await response.json();

      setEnabled(config.enabled);
      setDayOfWeek(config.dayOfWeek);
      setRecipients(config.recipients || []);
      setLastSentAt(config.lastSentAt);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la configuración de reportes semanales',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!workspace?.id) return;
    setSaving(true);
    try {
      const response = await fetch(
        `${getBaseUrl()}/api/workspaces/${workspace.id}/weekly-reports/config`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            enabled,
            dayOfWeek,
            recipients,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Error al guardar la configuración');
      }

      toast({
        title: 'Guardado',
        description: 'Configuración de reportes semanales actualizada',
      });

      // Recargar config
      await loadConfig();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddEmail = () => {
    const email = newEmail.trim();

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Email inválido',
        description: 'Por favor ingresa un email válido',
        variant: 'destructive',
      });
      return;
    }

    // Verificar si ya existe
    if (recipients.includes(email)) {
      toast({
        title: 'Email duplicado',
        description: 'Este email ya está en la lista',
        variant: 'destructive',
      });
      return;
    }

    setRecipients([...recipients, email]);
    setNewEmail('');
  };

  const handleRemoveEmail = (email: string) => {
    setRecipients(recipients.filter((e) => e !== email));
  };

  const handleSendTest = async () => {
    const email = testEmail.trim();

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Email inválido',
        description: 'Por favor ingresa un email válido para el test',
        variant: 'destructive',
      });
      return;
    }

    if (!workspace?.id) return;
    setTestingEmail(true);
    try {
      const response = await fetch(
        `${getBaseUrl()}/api/workspaces/${workspace.id}/weekly-reports/test`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            testEmail: email,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Error al enviar email de prueba');
      }

      toast({
        title: 'Email de prueba enviado',
        description: `Se ha enviado un reporte de prueba a ${email}`,
      });

      setTestEmail('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo enviar el email de prueba',
        variant: 'destructive',
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const formatLastSent = (date: string | null) => {
    if (!date) return 'Nunca';
    const d = new Date(date);
    return new Intl.DateTimeFormat('es-EC', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Reportes Semanales
          </CardTitle>
          <CardDescription>Cargando configuración...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Reportes Semanales
        </CardTitle>
        <CardDescription>
          Recibe automáticamente un resumen semanal de tus métricas por email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1">
            <Label htmlFor="enable-reports" className="text-base">
              Habilitar reportes semanales
            </Label>
            <p className="text-sm text-muted-foreground">
              Recibe un email automático cada semana con tus estadísticas
            </p>
          </div>
          <Switch
            id="enable-reports"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <>
            {/* Day of Week Selector */}
            <div className="space-y-2">
              <Label htmlFor="day-of-week">Día de envío</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger id="day-of-week">
                  <SelectValue placeholder="Selecciona un día" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Los reportes se enviarán cada{' '}
                {DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label} a las
                9:00 AM (hora de Ecuador)
              </p>
            </div>

            {/* Recipients List */}
            <div className="space-y-2">
              <Label>Destinatarios</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEmail();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddEmail}
                >
                  Agregar
                </Button>
              </div>

              {recipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {recipients.map((email) => (
                    <Badge
                      key={email}
                      variant="secondary"
                      className="flex items-center gap-1 px-3 py-1"
                    >
                      <Mail className="h-3 w-3" />
                      {email}
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {recipients.length === 0 && (
                <Alert>
                  <AlertDescription>
                    Agrega al menos un email para recibir los reportes semanales
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Last Sent Info */}
            {lastSentAt && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm">
                  <strong>Último envío:</strong> {formatLastSent(lastSentAt)}
                </p>
              </div>
            )}
          </>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving || (enabled && recipients.length === 0)}
        >
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>

        {/* Test Email Section */}
        {enabled && recipients.length > 0 && (
          <div className="border-t pt-6 space-y-4">
            <div>
              <h4 className="font-medium mb-1">Enviar reporte de prueba</h4>
              <p className="text-sm text-muted-foreground">
                Envía un reporte inmediatamente para verificar que todo funciona
                correctamente
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@ejemplo.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendTest();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSendTest}
                disabled={testingEmail || !testEmail.trim()}
              >
                {testingEmail ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Test
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
