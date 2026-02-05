# Billing Module

Sistema de pagos y gestión de suscripciones usando Stripe.

## Configuración de Stripe

### 1. Crear cuenta de Stripe

1. Ir a [Stripe Dashboard](https://dashboard.stripe.com/)
2. Activar modo de pruebas (toggle en la esquina superior derecha)
3. Obtener API keys desde: https://dashboard.stripe.com/test/apikeys

### 2. Crear productos en Stripe

Necesitas crear productos y precios en Stripe para cada plan:

#### STARTER Plan

```bash
# Monthly price
stripe products create \
  --name="Starter Plan" \
  --description="500 message credits per month"

# Usar el product_id retornado
stripe prices create \
  --product={product_id} \
  --unit-amount=3900 \
  --currency=usd \
  --recurring[interval]=month \
  --nickname="Starter Monthly"
```

Copiar el `price_id` (empieza con `price_`) y agregarlo en `apps/api/src/billing/dto/index.ts`:

```typescript
STARTER: {
  stripePriceIdMonthly: 'price_xxxxxxxxxxxxx', // ← Pegar aquí
  stripePriceIdYearly: 'price_xxxxxxxxxxxxx',
  // ...
}
```

Repetir el proceso para:

- STARTER yearly (unit_amount: 39000, interval: year)
- PROFESSIONAL monthly (unit_amount: 12900)
- PROFESSIONAL yearly (unit_amount: 129000)

### 3. Configurar Webhook

1. Ir a: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. URL: `https://your-api.com/webhooks/stripe`
4. Seleccionar eventos:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copiar el "Signing secret" (empieza con `whsec_`)
6. Agregarlo a `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 4. Variables de entorno

Agregar a tu `.env`:

```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
FRONTEND_URL=http://localhost:4000
```

## Endpoints

### Billing Info

```http
GET /api/workspaces/:workspaceId/billing
```

Retorna información de billing actual:

```json
{
  "plan": "STARTER",
  "messageCredits": 450,
  "subscriptionStatus": "active",
  "subscriptionPeriodEnd": "2025-03-15T00:00:00.000Z",
  "cancelAtPeriodEnd": false,
  "stripeCustomerId": "cus_xxxxx",
  "hasPaymentMethod": true
}
```

### Planes disponibles

```http
GET /api/workspaces/:workspaceId/billing/plans
```

### Paquetes de créditos

```http
GET /api/workspaces/:workspaceId/billing/credit-packages
```

### Crear suscripción

```http
POST /api/workspaces/:workspaceId/billing/subscribe
Content-Type: application/json

{
  "plan": "STARTER",
  "interval": "monthly",
  "successUrl": "https://yourapp.com/billing/success",
  "cancelUrl": "https://yourapp.com/billing"
}
```

Retorna:

```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/xxxxx",
  "sessionId": "cs_test_xxxxx"
}
```

### Comprar créditos

```http
POST /api/workspaces/:workspaceId/billing/credits
Content-Type: application/json

{
  "credits": 500
}
```

### Cancelar suscripción

```http
POST /api/workspaces/:workspaceId/billing/cancel
Content-Type: application/json

{
  "when": "period_end"  // o "now"
}
```

### Reanudar suscripción

```http
POST /api/workspaces/:workspaceId/billing/resume
```

### Billing Portal (Stripe hosted)

```http
GET /api/workspaces/:workspaceId/billing/portal
```

Retorna URL para que el cliente gestione su suscripción (actualizar tarjeta, ver facturas, etc.)

### Historial de transacciones

```http
GET /api/workspaces/:workspaceId/billing/transactions
```

## Flujo de Suscripción

1. **Usuario hace click en "Upgrade to Starter"**
   - Frontend llama: `POST /workspaces/:id/billing/subscribe`
   - API retorna Stripe Checkout URL

2. **Usuario completa pago en Stripe Checkout**
   - Stripe envía webhook: `customer.subscription.created`
   - API actualiza `Workspace`: plan, stripeSubscriptionId, messageCredits

3. **Cada mes, Stripe cobra automáticamente**
   - Stripe envía webhook: `invoice.paid`
   - API crea `Transaction` record
   - Resetea `messageCredits` al límite del plan

4. **Usuario cancela suscripción**
   - Frontend llama: `POST /workspaces/:id/billing/cancel`
   - Stripe envía webhook: `customer.subscription.updated` (cancelAtPeriodEnd=true)
   - API actualiza `Workspace.cancelAtPeriodEnd = true`

5. **Final del periodo de facturación**
   - Stripe envía webhook: `customer.subscription.deleted`
   - API baja el plan a FREE

## Flujo de Compra de Créditos

1. **Usuario compra créditos**
   - Frontend llama: `POST /workspaces/:id/billing/credits`
   - API crea PaymentIntent y Transaction (status=PENDING)
   - Retorna `client_secret`

2. **Frontend usa Stripe Elements para completar pago**
   - Usuario ingresa tarjeta
   - Stripe procesa pago

3. **Pago exitoso**
   - Stripe envía webhook: `payment_intent.succeeded`
   - API suma créditos en `Workspace.messageCredits`
   - Actualiza Transaction a status=SUCCEEDED

## Testing

### Test con Stripe CLI

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Escuchar webhooks locales
stripe listen --forward-to localhost:3333/webhooks/stripe

# Simular eventos
stripe trigger customer.subscription.created
stripe trigger payment_intent.succeeded
```

### Tarjetas de prueba

- Éxito: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Authentication required: `4000 0025 0000 3155`
- Insufficient funds: `4000 0000 0000 9995`

Cualquier fecha futura y cualquier CVC de 3 dígitos.

## Gestión de Créditos

### Descontar créditos al enviar mensaje

```typescript
// En el worker o donde se envíen mensajes
await billingService.deductCredits(workspaceId, 1);
```

Si no hay suficientes créditos, lanza `BadRequestException`.

### Agregar créditos manualmente (admin)

```typescript
await billingService.addCredits(workspaceId, 100, 'Bonus credits for beta tester');
```

### Verificar créditos antes de enviar

```typescript
const billing = await billingService.getBillingInfo(workspaceId);
if (billing.plan !== 'ENTERPRISE' && billing.messageCredits < 1) {
  throw new BadRequestException('Insufficient credits');
}
```

## Guards y Permisos

Los endpoints de billing requieren:

- ✅ Autenticación (JwtGuard)
- ✅ Workspace membership (WorkspaceGuard)
- ✅ Role OWNER (RolesGuard) - excepto GET /billing

**Nota**: Guards comentados temporalmente hasta que auth esté implementado.

## Base de Datos

### Workspace (billing fields)

```prisma
model Workspace {
  stripeCustomerId      String?
  stripeSubscriptionId  String?
  subscriptionStatus    String?  // active, canceled, incomplete, past_due, trialing, unpaid
  subscriptionPeriodEnd DateTime?
  trialEnd             DateTime?
  cancelAtPeriodEnd    Boolean @default(false)
  transactions         Transaction[]
}
```

### Transaction

```prisma
model Transaction {
  id                    String   @id @default(cuid())
  workspaceId           String
  stripePaymentIntentId String?
  stripeInvoiceId       String?
  stripeChargeId        String?
  type                  TransactionType  // SUBSCRIPTION_PAYMENT, CREDIT_PURCHASE, REFUND, CREDIT_ADJUSTMENT
  status                TransactionStatus // PENDING, SUCCEEDED, FAILED, REFUNDED
  amount                Int      // in cents
  currency              String   @default("usd")
  creditsAdded          Int      @default(0)
  description           String?
  metadata              Json?
  createdAt             DateTime @default(now())
}
```

## Próximos pasos

- [ ] Implementar email notifications en webhooks (low credits, payment failed, etc.)
- [ ] Integrar deductCredits() en el message worker
- [ ] Crear frontend UI para billing page
- [ ] Agregar usage alerts (< 20% credits remaining)
- [ ] Tests E2E con Stripe mock
