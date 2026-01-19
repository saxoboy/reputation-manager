'use client';

import { useState } from 'react';
import { useAuth } from '../../../../hooks/use-auth';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../../components/ui/tabs';
import { Badge } from '../../../../components/ui/badge';
import { Separator } from '../../../../components/ui/separator';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { Info } from 'lucide-react';

const plans = [
  { id: 'FREE', name: 'Free', price: '$0', messages: 50 },
  { id: 'STARTER', name: 'Starter', price: '$39', messages: 500 },
  { id: 'PROFESSIONAL', name: 'Professional', price: '$129', messages: 2000 },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Workspace settings
  const [workspaceName, setWorkspaceName] = useState('Mi Consultorio');
  const [currentPlan] = useState('STARTER');
  const [messageCredits] = useState(500);

  // Personal settings
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');

  const handleUpdateWorkspace = async () => {
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

  const handleUpdateProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // TODO: Implement API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess('Perfil actualizado correctamente');
    } catch {
      setError('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Administra tu cuenta y preferencias del workspace
        </p>
      </div>

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

      <Tabs defaultValue="workspace" className="space-y-6">
        <TabsList>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
          <TabsTrigger value="billing">Facturación</TabsTrigger>
        </TabsList>

        <TabsContent value="workspace" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Workspace</CardTitle>
              <CardDescription>
                Información básica sobre tu consultorio o clínica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    {plans.find((p) => p.id === currentPlan)?.name}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {plans.find((p) => p.id === currentPlan)?.price}/mes
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Créditos de Mensajes</Label>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{messageCredits}</div>
                  <span className="text-sm text-muted-foreground">
                    de {plans.find((p) => p.id === currentPlan)?.messages}{' '}
                    disponibles
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${
                        (messageCredits /
                          (plans.find((p) => p.id === currentPlan)?.messages ||
                            1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <Button onClick={handleUpdateWorkspace} disabled={loading}>
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
                  Eliminar tu workspace borrará todos los datos, campañas,
                  pacientes y plantillas. Esta acción no se puede deshacer.
                </AlertDescription>
              </Alert>
              <Button variant="destructive" disabled>
                Eliminar Workspace
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Actualiza tu información personal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} disabled />
                <p className="text-xs text-muted-foreground">
                  No puedes cambiar tu email por el momento
                </p>
              </div>

              <Button onClick={handleUpdateProfile} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Facturación</CardTitle>
              <CardDescription>
                Administra tu plan y métodos de pago
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  La gestión de facturación estará disponible en la siguiente
                  fase del proyecto.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold">Cambiar Plan</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {plans.map((plan) => (
                    <Card
                      key={plan.id}
                      className={
                        currentPlan === plan.id
                          ? 'border-primary ring-2 ring-primary'
                          : ''
                      }
                    >
                      <CardHeader>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>{plan.price}/mes</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {plan.messages} mensajes
                        </p>
                        {currentPlan === plan.id && (
                          <Badge className="mt-2">Plan Actual</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
