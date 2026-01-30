import { useState } from 'react';
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
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Info, MessageSquare, Send } from 'lucide-react';
import { MOCK_PLANS } from '../../types/mock-types';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export function WorkspaceSettings() {
  const [workspaceName, setWorkspaceName] = useState('Mi Consultorio');
  const [currentPlan] = useState('STARTER');
  const [messageCredits] = useState(500);

  // Channel settings
  const [defaultChannel, setDefaultChannel] = useState<
    'SMS' | 'WHATSAPP' | 'EMAIL'
  >('SMS');
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const [loading, setLoading] = useState(false);
  const [channelLoading, setChannelLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [channelSuccess, setChannelSuccess] = useState('');
  const [channelError, setChannelError] = useState('');

  const currentPlanDetails = MOCK_PLANS.find((p) => p.id === currentPlan);

  const handleUpdate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // TODO: Implement API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess('Configuración del workspace actualizada correctamente');
    } catch {
      setError('Error al actualizar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleChannelUpdate = async () => {
    setChannelLoading(true);
    setChannelError('');
    setChannelSuccess('');

    // Validación: al menos un canal debe estar habilitado
    if (!smsEnabled && !whatsappEnabled && !emailEnabled) {
      setChannelError(
        'Al menos un canal debe estar habilitado (SMS, WhatsApp o Email)',
      );
      setChannelLoading(false);
      return;
    }

    // Validación: el canal por defecto debe estar habilitado
    if (defaultChannel === 'SMS' && !smsEnabled) {
      setChannelError(
        'No puedes establecer SMS como canal por defecto si está deshabilitado',
      );
      setChannelLoading(false);
      return;
    }
    if (defaultChannel === 'WHATSAPP' && !whatsappEnabled) {
      setChannelError(
        'No puedes establecer WhatsApp como canal por defecto si está deshabilitado',
      );
      setChannelLoading(false);
      return;
    }
    if (defaultChannel === 'EMAIL' && !emailEnabled) {
      setChannelError(
        'No puedes establecer Email como canal por defecto si está deshabilitado',
      );
      setChannelLoading(false);
      return;
    }

    try {
      // TODO: Implement API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setChannelSuccess('Configuración de canales actualizada correctamente');
    } catch {
      setChannelError('Error al actualizar la configuración de canales');
    } finally {
      setChannelLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Workspace</CardTitle>
          <CardDescription>
            Información básica sobre tu consultorio o clínica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <Alert className="border-green-500 bg-green-50 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="workspace-name">Nombre del Workspace</Label>
            <Input
              id="workspace-name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              disabled={loading}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Plan Actual</Label>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-base">
                {currentPlanDetails?.name}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {currentPlanDetails?.price}/mes
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Créditos de Mensajes</Label>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{messageCredits}</div>
              <span className="text-sm text-muted-foreground">
                de {currentPlanDetails?.messages} disponibles
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${(messageCredits / (currentPlanDetails?.messages || 1)) * 100
                    }%`,
                }}
              />
            </div>
          </div>

          <Button onClick={handleUpdate} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Configuración de Canales
          </CardTitle>
          <CardDescription>
            Configura los canales de mensajería disponibles para tus campañas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {channelSuccess && (
            <Alert className="border-green-500 bg-green-50 text-green-800">
              <AlertDescription>{channelSuccess}</AlertDescription>
            </Alert>
          )}

          {channelError && (
            <Alert variant="destructive">
              <AlertDescription>{channelError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-enabled" className="text-base font-medium">
                  SMS (Twilio)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Envía mensajes de texto vía Twilio
                </p>
              </div>
              <Switch
                id="sms-enabled"
                checked={smsEnabled}
                onCheckedChange={setSmsEnabled}
                disabled={channelLoading}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="whatsapp-enabled"
                  className="text-base font-medium"
                >
                  WhatsApp Business
                </Label>
                <p className="text-sm text-muted-foreground">
                  Envía mensajes vía WhatsApp Business API
                </p>
              </div>
              <Switch
                id="whatsapp-enabled"
                checked={whatsappEnabled}
                onCheckedChange={setWhatsappEnabled}
                disabled={channelLoading}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="email-enabled"
                  className="text-base font-medium"
                >
                  Email (SendGrid)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Envía correos electrónicos vía SendGrid
                </p>
              </div>
              <Switch
                id="email-enabled"
                checked={emailEnabled}
                onCheckedChange={setEmailEnabled}
                disabled={channelLoading}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="default-channel" className="text-base font-medium">
                Canal por Defecto
              </Label>
              <p className="text-sm text-muted-foreground">
                Canal que se usará cuando el paciente no tenga preferencia
              </p>
              <Select
                value={defaultChannel}
                onValueChange={(value: 'SMS' | 'WHATSAPP' | 'EMAIL') =>
                  setDefaultChannel(value)
                }
                disabled={channelLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMS" disabled={!smsEnabled}>
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      <span>SMS</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="WHATSAPP" disabled={!whatsappEnabled}>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>WhatsApp</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="EMAIL" disabled={!emailEnabled}>
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Los mensajes se enviarán usando el canal preferido del paciente si
              está disponible, o el canal por defecto del workspace.
            </AlertDescription>
          </Alert>

          <Button onClick={handleChannelUpdate} disabled={channelLoading}>
            {channelLoading
              ? 'Guardando...'
              : 'Guardar Configuración de Canales'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zona de Peligro</CardTitle>
          <CardDescription>
            Acciones irreversibles en tu workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Eliminar tu workspace borrará todos los datos, campañas, pacientes
              y plantillas. Esta acción no se puede deshacer.
            </AlertDescription>
          </Alert>
          <Button variant="destructive" disabled>
            Eliminar Workspace
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
