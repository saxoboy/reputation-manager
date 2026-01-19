import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Info } from 'lucide-react';
import { MOCK_PLANS } from '../../types/mock-types';

export function BillingSettings() {
  const [currentPlan] = useState('STARTER');

  return (
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
            La gestión de facturación estará disponible en la siguiente fase del
            proyecto.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h3 className="font-semibold">Cambiar Plan</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {MOCK_PLANS.map((plan) => (
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
  );
}
