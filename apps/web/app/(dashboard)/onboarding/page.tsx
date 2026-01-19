'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

const plans = [
  {
    id: 'FREE',
    name: 'Free',
    price: '$0',
    period: '/mes',
    messages: 50,
    users: 1,
    locations: 1,
    features: [
      '50 mensajes incluidos',
      '1 usuario',
      '1 consultorio',
      'Plantillas básicas',
      'Soporte por email',
    ],
  },
  {
    id: 'STARTER',
    name: 'Starter',
    price: '$39',
    period: '/mes',
    messages: 500,
    users: 2,
    locations: 1,
    popular: true,
    features: [
      '500 mensajes incluidos',
      '2 usuarios',
      '1 consultorio',
      'Plantillas personalizadas',
      'Analytics básicos',
      'Soporte prioritario',
    ],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    price: '$129',
    period: '/mes',
    messages: 2000,
    users: 5,
    locations: 5,
    features: [
      '2000 mensajes incluidos',
      '5 usuarios',
      '5 consultorios',
      'Plantillas avanzadas',
      'Analytics completos',
      'NPS tracking',
      'Soporte 24/7',
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Workspace info
  const [workspaceName, setWorkspaceName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('STARTER');

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      setError('Por favor ingresa el nombre de tu consultorio');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: workspaceName,
          plan: selectedPlan,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear el workspace');
      }

      // Redirigir al dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Create workspace error:', err);
      setError('Error al crear el workspace. Por favor intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-4xl">
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                ¡Bienvenido a Reputation Manager!
              </CardTitle>
              <CardDescription>
                Configuremos tu espacio de trabajo en 2 simples pasos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="workspace-name">
                  Nombre de tu Consultorio o Clínica
                </Label>
                <Input
                  id="workspace-name"
                  placeholder="Ej: Consultorio Dr. Pérez"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Este nombre aparecerá en los mensajes a tus pacientes
                </p>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!workspaceName.trim() || loading}
                >
                  Siguiente: Elegir Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Elige tu plan</h2>
              <p className="text-muted-foreground">
                Puedes cambiarlo cuando quieras
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative cursor-pointer transition-all ${
                    selectedPlan === plan.id
                      ? 'border-primary ring-2 ring-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge>Más Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-baseline gap-2">
                      <span className="text-3xl">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">
                        {plan.period}
                      </span>
                    </CardTitle>
                    <CardDescription className="text-lg font-semibold text-foreground">
                      {plan.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <svg
                            className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {error && (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Atrás
              </Button>
              <Button onClick={handleCreateWorkspace} disabled={loading}>
                {loading ? 'Creando...' : 'Crear Workspace'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
