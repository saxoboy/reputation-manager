'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '../../hooks/use-workspace';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import { Info, ExternalLink, Check } from 'lucide-react';
import {
  billingService,
  type BillingInfo,
  type PlanDetails,
} from '../../services/billing.service';
import { useToast } from '../../hooks/use-toast';

export function BillingSettings() {
  const { workspace } = useWorkspace();
  const router = useRouter();
  const { toast } = useToast();

  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [plans, setPlans] = useState<PlanDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const workspaceId = workspace?.id;

  useEffect(() => {
    if (!workspaceId) return;

    const loadBillingData = async () => {
      try {
        setLoading(true);
        const [info, availablePlans] = await Promise.all([
          billingService.getBillingInfo(workspaceId),
          billingService.getAvailablePlans(workspaceId),
        ]);

        setBillingInfo(info);
        setPlans(availablePlans);
      } catch {
        toast({
          title: 'Error',
          description: 'No se pudo cargar la información de facturación',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadBillingData();
  }, [workspaceId, toast]);

  const handleViewFullBillingPage = () => {
    if (!workspaceId) return;
    router.push(`/dashboard/billing`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facturación</CardTitle>
          <CardDescription>
            Administra tu plan y métodos de pago
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Facturación</CardTitle>
        <CardDescription>Administra tu plan y métodos de pago</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan Summary */}
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Plan Actual</p>
              <p className="text-2xl font-bold">
                {plans.find((p) => p.plan === billingInfo?.plan)?.name ||
                  'FREE'}
              </p>
            </div>
            <Badge variant="default">
              {billingInfo?.plan === 'FREE' ? 'Gratis' : 'Activo'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-sm text-muted-foreground">Créditos</p>
              <p className="text-lg font-semibold">
                {billingInfo?.plan === 'ENTERPRISE'
                  ? 'Ilimitados'
                  : `${billingInfo?.messageCredits || 0}`}
              </p>
            </div>
            {billingInfo?.subscriptionPeriodEnd && (
              <div>
                <p className="text-sm text-muted-foreground">Renovación</p>
                <p className="text-lg font-semibold">
                  {new Date(
                    billingInfo.subscriptionPeriodEnd,
                  ).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Visita la página de facturación completa para ver planes, comprar
            créditos y gestionar tu suscripción.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h3 className="font-semibold">Planes Disponibles</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.slice(0, 3).map((plan) => (
              <Card
                key={plan.plan}
                className={
                  billingInfo?.plan === plan.plan
                    ? 'border-primary ring-2 ring-primary'
                    : ''
                }
              >
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>${plan.price / 100}/mes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>
                      {plan.credits === -1 ? 'Ilimitados' : plan.credits}{' '}
                      mensajes
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>
                      {plan.maxUsers === -1 ? 'Ilimitados' : plan.maxUsers}{' '}
                      usuarios
                    </span>
                  </div>
                  {billingInfo?.plan === plan.plan && (
                    <Badge className="mt-2">Plan Actual</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleViewFullBillingPage} className="w-full">
          <ExternalLink className="mr-2 h-4 w-4" />
          Ver Facturación Completa
        </Button>
      </CardFooter>
    </Card>
  );
}
