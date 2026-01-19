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
import { Info } from 'lucide-react';
import { MOCK_PLANS } from '../../types/mock-types';

export function WorkspaceSettings() {
  const [workspaceName, setWorkspaceName] = useState('Mi Consultorio');
  const [currentPlan] = useState('STARTER');
  const [messageCredits] = useState(500);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

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
                  width: `${
                    (messageCredits / (currentPlanDetails?.messages || 1)) * 100
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
