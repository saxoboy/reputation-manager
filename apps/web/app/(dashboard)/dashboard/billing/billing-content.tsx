'use client';

import { useState, useEffect } from 'react';
import { useWorkspace } from '../../../../hooks/use-workspace';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { Skeleton } from '../../../../components/ui/skeleton';
import { Progress } from '../../../../components/ui/progress';
import {
  CreditCard,
  Check,
  Zap,
  Building2,
  ExternalLink,
  AlertCircle,
  TrendingUp,
  Calendar,
  DollarSign,
} from 'lucide-react';
import {
  billingService,
  type PlanType,
  type BillingInfo,
  type PlanDetails,
  type Transaction,
} from '../../../../services/billing.service';
import { useToast } from '../../../../hooks/use-toast';

export default function BillingContent() {
  const { workspace } = useWorkspace();
  const { toast } = useToast();

  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [plans, setPlans] = useState<PlanDetails[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>(
    'monthly',
  );
  const [processingAction, setProcessingAction] = useState(false);

  const workspaceId = workspace?.id;

  useEffect(() => {
    if (workspaceId) {
      loadBillingData();
    }
  }, [workspaceId]);

  const loadBillingData = async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      const [info, availablePlans, txHistory] = await Promise.all([
        billingService.getBillingInfo(workspaceId),
        billingService.getAvailablePlans(workspaceId),
        billingService.getTransactions(workspaceId),
      ]);

      setBillingInfo(info);
      setPlans(availablePlans);
      setTransactions(txHistory);
    } catch (err) {
      console.error('Failed to load billing data:', err);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información de facturación',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = async () => {
    if (!selectedPlan || !workspaceId) return;

    try {
      setProcessingAction(true);
      const result = await billingService.createSubscription(workspaceId, {
        plan: selectedPlan,
        interval: billingInterval,
        successUrl: `${window.location.origin}/dashboard/billing?success=true`,
        cancelUrl: `${window.location.origin}/dashboard/billing`,
      });

      // Redirect to Stripe Checkout
      window.location.href = result.checkoutUrl;
    } catch (err) {
      console.error('Failed to upgrade plan:', err);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar el proceso de pago',
        variant: 'destructive',
      });
      setProcessingAction(false);
    }
  };

  const handlePurchaseCredits = async (credits: number) => {
    if (!workspaceId) return;

    try {
      setProcessingAction(true);
      const result = await billingService.purchaseCredits(workspaceId, {
        credits,
      });

      // For now, this returns a payment intent client secret
      // In production, you'd redirect to a payment page
      toast({
        title: 'Redirigiendo a checkout',
        description: 'Serás redirigido a la página de pago...',
      });

      // TODO: Implement payment flow with Stripe Elements
      console.log('Payment client secret:', result.checkoutUrl);
    } catch (err) {
      console.error('Failed to purchase credits:', err);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la compra de créditos',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCancelSubscription = async (when: 'now' | 'period_end') => {
    if (!workspaceId) return;

    try {
      setProcessingAction(true);
      const result = await billingService.cancelSubscription(workspaceId, {
        when,
      });

      toast({
        title: 'Suscripción cancelada',
        description: result.message,
      });

      setCancelDialogOpen(false);
      await loadBillingData();
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la suscripción',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleResumeSubscription = async () => {
    if (!workspaceId) return;

    try {
      setProcessingAction(true);
      const result = await billingService.resumeSubscription(workspaceId);

      toast({
        title: 'Suscripción reanudada',
        description: result.message,
      });

      await loadBillingData();
    } catch (err) {
      console.error('Failed to resume subscription:', err);
      toast({
        title: 'Error',
        description: 'No se pudo reanudar la suscripción',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    if (!workspaceId) return;

    try {
      setProcessingAction(true);
      const result = await billingService.getBillingPortal(workspaceId);
      window.location.href = result.url;
    } catch (err) {
      console.error('Failed to open billing portal:', err);
      toast({
        title: 'Error',
        description: 'No se pudo abrir el portal de facturación',
        variant: 'destructive',
      });
      setProcessingAction(false);
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return <Zap className="h-5 w-5" />;
      case 'STARTER':
        return <TrendingUp className="h-5 w-5" />;
      case 'PROFESSIONAL':
        return <Building2 className="h-5 w-5" />;
      case 'ENTERPRISE':
        return <Building2 className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const variants: Record<
      string,
      {
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        label: string;
      }
    > = {
      active: { variant: 'default', label: 'Activa' },
      canceled: { variant: 'secondary', label: 'Cancelada' },
      past_due: { variant: 'destructive', label: 'Pago vencido' },
      trialing: { variant: 'outline', label: 'Prueba' },
      incomplete: { variant: 'outline', label: 'Incompleta' },
    };

    const config = variants[status] || {
      variant: 'outline' as const,
      label: status,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const creditsPercentage = billingInfo
    ? Math.min(
      (billingInfo.messageCredits /
        (plans.find((p) => p.plan === billingInfo.plan)?.credits || 1)) *
      100,
      100,
    )
    : 0;

  // Guard: Show loading state if workspace is not loaded yet
  if (!workspace || !workspaceId) {
    return (
      <div className="container max-w-6xl py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cargando información de workspace...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Facturación</h1>
          <p className="text-muted-foreground">
            Gestiona tu plan y métodos de pago
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-50" />
          <Skeleton className="h-50" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Facturación</h1>
        <p className="text-muted-foreground">
          Gestiona tu plan, créditos y métodos de pago
        </p>
      </div>

      {/* Alert Success */}
      {typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('success') ===
        'true' && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              ¡Pago exitoso! Tu suscripción ha sido actualizada.
            </AlertDescription>
          </Alert>
        )}

      {/* Cancel at period end warning */}
      {billingInfo?.cancelAtPeriodEnd && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tu suscripción será cancelada el{' '}
            {billingInfo.subscriptionPeriodEnd
              ? new Date(billingInfo.subscriptionPeriodEnd).toLocaleDateString(
                'es-ES',
              )
              : 'final del periodo'}
            .
            <Button
              variant="link"
              size="sm"
              onClick={handleResumeSubscription}
              disabled={processingAction}
              className="ml-2"
            >
              Reanudar suscripción
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan & Credits */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getPlanIcon(billingInfo?.plan || 'FREE')}
              Plan Actual
            </CardTitle>
            <CardDescription>
              {plans.find((p) => p.plan === billingInfo?.plan)?.name || 'FREE'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {billingInfo?.plan === 'FREE'
                  ? '$0'
                  : `$${(plans.find((p) => p.plan === billingInfo?.plan)?.price || 0) / 100}`}
              </span>
              <span className="text-muted-foreground">/mes</span>
            </div>

            {billingInfo?.subscriptionStatus && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado:</span>
                {getStatusBadge(billingInfo.subscriptionStatus)}
              </div>
            )}

            {billingInfo?.subscriptionPeriodEnd &&
              !billingInfo.cancelAtPeriodEnd && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Renueva el{' '}
                  {new Date(
                    billingInfo.subscriptionPeriodEnd,
                  ).toLocaleDateString('es-ES')}
                </div>
              )}
          </CardContent>
          <CardFooter className="flex gap-2">
            {billingInfo?.plan !== 'ENTERPRISE' && (
              <Button
                onClick={() => {
                  setSelectedPlan(null);
                  setUpgradeDialogOpen(true);
                }}
                className="flex-1"
              >
                Cambiar Plan
              </Button>
            )}
            {billingInfo?.hasPaymentMethod && (
              <Button
                variant="outline"
                onClick={handleOpenBillingPortal}
                disabled={processingAction}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Portal
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Créditos de Mensajes
            </CardTitle>
            <CardDescription>
              {billingInfo?.plan === 'ENTERPRISE'
                ? 'Ilimitados'
                : `${billingInfo?.messageCredits || 0} disponibles`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {billingInfo?.plan !== 'ENTERPRISE' && (
              <>
                <Progress value={creditsPercentage} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{billingInfo?.messageCredits || 0} restantes</span>
                  <span>
                    {plans.find((p) => p.plan === billingInfo?.plan)?.credits ||
                      0}{' '}
                    total
                  </span>
                </div>
              </>
            )}

            {creditsPercentage < 20 && billingInfo?.plan !== 'ENTERPRISE' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Créditos bajos. Considera comprar más créditos.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handlePurchaseCredits(100)}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Comprar Créditos
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Planes Disponibles</CardTitle>
          <CardDescription>
            Elige el plan que mejor se adapte a tus necesidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {plans.map((plan) => (
              <Card
                key={plan.plan}
                className={
                  billingInfo?.plan === plan.plan
                    ? 'border-primary ring-2 ring-primary'
                    : ''
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {billingInfo?.plan === plan.plan && (
                      <Badge variant="default">Actual</Badge>
                    )}
                  </div>
                  <CardDescription className="text-2xl font-bold">
                    ${plan.price / 100}
                    <span className="text-sm font-normal text-muted-foreground">
                      /mes
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>
                      {plan.credits === -1 ? 'Ilimitado' : plan.credits}{' '}
                      créditos
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>
                      {plan.maxUsers === -1 ? 'Ilimitado' : plan.maxUsers}{' '}
                      usuarios
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>
                      {plan.maxPractices === -1
                        ? 'Ilimitadas'
                        : plan.maxPractices}{' '}
                      locations
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  {billingInfo?.plan !== plan.plan && plan.plan !== 'FREE' && (
                    <Button
                      className="w-full"
                      variant={
                        plan.plan === 'PROFESSIONAL' ? 'default' : 'outline'
                      }
                      onClick={() => {
                        setSelectedPlan(plan.plan as PlanType);
                        setUpgradeDialogOpen(true);
                      }}
                    >
                      Seleccionar
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
          <CardDescription>Últimas transacciones de tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay transacciones registradas
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Créditos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">
                      {new Date(tx.createdAt).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {tx.type.replace('_', ' ')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {tx.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tx.status === 'SUCCEEDED'
                            ? 'default'
                            : tx.status === 'FAILED'
                              ? 'destructive'
                              : 'outline'
                        }
                      >
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      ${(tx.amount / 100).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {tx.creditsAdded > 0 ? `+${tx.creditsAdded}` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Plan</DialogTitle>
            <DialogDescription>
              Selecciona el plan y la frecuencia de facturación
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan</label>
              <Select
                value={selectedPlan || undefined}
                onValueChange={(value) => setSelectedPlan(value as PlanType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans
                    .filter(
                      (p) => p.plan !== 'FREE' && p.plan !== billingInfo?.plan,
                    )
                    .map((p) => (
                      <SelectItem key={p.plan} value={p.plan}>
                        {p.name} - ${p.price / 100}/mes
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Frecuencia</label>
              <Select
                value={billingInterval}
                onValueChange={(value: 'monthly' | 'yearly') =>
                  setBillingInterval(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="yearly">Anual (10% descuento)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedPlan && (
              <Alert>
                <AlertDescription>
                  Serás redirigido a Stripe para completar el pago de forma
                  segura.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpgradeDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpgradePlan}
              disabled={!selectedPlan || processingAction}
            >
              {processingAction ? 'Procesando...' : 'Continuar al pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Suscripción</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cancelar tu suscripción?
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Al cancelar, bajarás al plan FREE al final del periodo de
              facturación.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              No, mantener suscripción
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleCancelSubscription('period_end')}
              disabled={processingAction}
            >
              {processingAction ? 'Procesando...' : 'Sí, cancelar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
