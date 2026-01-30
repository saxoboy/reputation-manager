# Twilio SMS Integration - Testing Guide

## Setup Inicial

### 1. Crear cuenta de Twilio

1. Ve a [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Regístrate (obtendrás **$15 USD de crédito gratis**)
3. Verifica tu número de teléfono

### 2. Obtener credenciales

1. Ve al Dashboard: [console.twilio.com](https://console.twilio.com)
2. Copia:
   - **Account SID**
   - **Auth Token**
3. Ve a **Phone Numbers** → **Manage** → **Buy a number**
   - Selecciona un número con capacidad SMS
   - Costo: ~$1 USD/mes

### 3. Configurar variables de entorno

Edita tu archivo `.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
TWILIO_WEBHOOK_URL=https://your-domain.railway.app/api/webhooks/twilio/sms
```

⚠️ **Nota**: Para desarrollo local, necesitas exponer tu API con ngrok (ver sección siguiente).

---

## Testing Local con ngrok

### 1. Instalar ngrok

```bash
# macOS
brew install ngrok

# O descarga de ngrok.com
```

### 2. Exponer tu API local

```bash
# En una terminal separada
ngrok http 3000
```

Verás algo como:

```
Forwarding https://abc123.ngrok.io -> http://localhost:3000
```

### 3. Configurar Twilio webhook

1. Ve a [console.twilio.com/phone-numbers](https://console.twilio.com/phone-numbers)
2. Click en tu número
3. En **Messaging Configuration**:
   - **A MESSAGE COMES IN**: Webhook
   - URL: `https://abc123.ngrok.io/api/webhooks/twilio/sms`
   - HTTP: `POST`
4. Guarda

### 4. Actualizar .env

```env
TWILIO_WEBHOOK_URL=https://abc123.ngrok.io/api/webhooks/twilio/sms
```

---

## Flujo de Testing

### Test 1: Enviar SMS inicial

1. Levanta la aplicación:

```bash
pnpm dev
```

2. Crea una campaña con tu número:

```bash
curl -X POST http://localhost:3000/api/workspaces/{workspaceId}/campaigns/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@patients-test.csv"
```

Archivo `patients-test.csv`:

```csv
name,phone,email,appointmentTime,hasConsent
Tu Nombre,+593999999999,tu@email.com,2026-01-20T18:00:00,true
```

3. Espera 2 horas (o modifica `scheduledHoursAfter` a 0 para testing inmediato)

4. Verifica logs del worker:

```bash
pnpm nx serve worker
```

Deberías ver:

```
📱 Sending SMS to +593999999999...
✅ SMS sent successfully. SID: SM..., Status: queued
```

5. **Revisa tu teléfono** - deberías recibir:

> Hola Tu Nombre, gracias por tu visita. ¿Cómo nos calificarías del 1 al 5?

### Test 2: Responder al SMS

1. Responde al SMS con un número del **1 al 5**

   Ejemplo: `5`

2. Verifica logs del API:

```
📥 Incoming SMS from +593999999999: "5"
✅ Response queued for patient abc123 with rating 5
```

3. Verifica logs del worker:

```
Handling response for message xyz with rating 5
Sending FOLLOWUP (HAPPY) to abc123
📱 Sending SMS to +593999999999...
```

4. **Revisa tu teléfono** - deberías recibir:

> ¡Nos alegra mucho! Por favor ayúdanos con una reseña en Google: https://g.page/review/...

### Test 3: Rating bajo

1. Repite el proceso pero responde con **1**, **2** o **3**

2. Deberías recibir:

> Lamentamos escuchar eso. Por favor cuéntanos más para mejorar: https://forms.gle/...

### Test 4: Opt-out

1. Responde al SMS con: `STOP`

2. Verifica logs:

```
Patient abc123 opted out
```

3. En Prisma Studio, verifica que `patient.optedOutAt` esté seteado

---

## Verificación en Twilio Console

### Ver mensajes enviados

1. Ve a [console.twilio.com/messaging/logs](https://console.twilio.com/messaging/logs)
2. Verás todos los SMS enviados con:
   - Status (queued, sent, delivered, failed)
   - Cost (~$0.05 USD por SMS a Ecuador)
   - Error codes (si falló)

### Ver webhooks recibidos

1. Ve a **Monitor** → **Logs** → **Webhooks**
2. Verás todas las requests POST a tu webhook con:
   - Request body
   - Response status
   - Response time

---

## Troubleshooting

### ❌ SMS no llega

**Posibles causas:**

1. **Número no verificado** (cuenta trial)
   - En trial, solo puedes enviar a números verificados
   - Ve a [console.twilio.com/phone-numbers/verified](https://console.twilio.com/phone-numbers/verified)
   - Agrega tu número

2. **Formato de número incorrecto**
   - Ecuador: `+593999999999` (12 dígitos con +593)
   - Verifica que el CSV use este formato exacto

3. **Créditos agotados**
   - Ve al Dashboard y verifica tu balance
   - Agrega más créditos si es necesario

### ❌ Webhook no funciona

**Posibles causas:**

1. **ngrok caído**
   - Verifica que ngrok sigue corriendo
   - El URL de ngrok cambia cada vez que lo reinicias

2. **Signature inválida**
   - Verifica que `TWILIO_AUTH_TOKEN` sea correcto
   - En desarrollo, puedes desactivar validación temporalmente

3. **Ruta incorrecta**
   - Verifica que la URL en Twilio sea exacta:
     `https://abc123.ngrok.io/api/webhooks/twilio/sms`

### ❌ Worker no procesa jobs

**Posibles causas:**

1. **Redis no está corriendo**

   ```bash
   docker-compose up -d redis
   ```

2. **Worker no está levantado**

   ```bash
   pnpm nx serve worker
   ```

3. **Jobs en failed state**
   - Ve a Bull Board: `http://localhost:3000/admin/queues`
   - Revisa jobs fallidos y logs

---

## Costos Estimados

### Ecuador (números móviles)

- **SMS outbound**: ~$0.04-0.06 USD
- **SMS inbound**: ~$0.0075 USD

### Ejemplo: 100 pacientes/día

- 100 SMS iniciales: $5.00
- 70 respuestas (70%): $0.53
- 70 followups: $3.50
- **Total/día**: ~$9.03 USD
- **Total/mes**: ~$270 USD

### Optimización de costos

1. **Usar WhatsApp** (más barato, mejor engagement)
2. **Filtrar pacientes** (solo enviar a quienes dieron consentimiento)
3. **Batch sending** (no enviar todos a la vez)

---

## Producción (Railway)

### 1. Configurar variables de entorno

En Railway dashboard:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
TWILIO_WEBHOOK_URL=https://your-app.railway.app/api/webhooks/twilio/sms
```

### 2. Configurar webhook en Twilio

URL: `https://your-app.railway.app/api/webhooks/twilio/sms`

### 3. Verificar en producción

1. Envía un SMS de prueba
2. Ve logs en Railway
3. Verifica en Twilio Console

---

## Próximos Pasos

- [ ] **Week 2**: Migrar a WhatsApp Business API (más barato + mejor engagement)
- [ ] **Week 3**: Agregar templates personalizables por workspace
- [ ] **Week 4**: Implementar rate limiting y retry logic
- [ ] **Week 5**: Analytics de delivery rate y engagement

---

## Referencias

- [Twilio SMS API Docs](https://www.twilio.com/docs/sms)
- [Twilio Webhooks](https://www.twilio.com/docs/usage/webhooks)
- [Twilio Error Codes](https://www.twilio.com/docs/api/errors)
- [Ecuador SMS Pricing](https://www.twilio.com/en-us/sms/pricing/ec)
