# Reputation Manager - Arquitectura del Sistema

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura de Alto Nivel](#arquitectura-de-alto-nivel)
3. [Componentes del Sistema](#componentes-del-sistema)
4. [Flujos de Datos Críticos](#flujos-de-datos-críticos)
5. [Modelo de Base de Datos](#modelo-de-base-de-datos)
6. [Sistema de Mensajería](#sistema-de-mensajería)
7. [Multi-tenancy & Seguridad](#multi-tenancy--seguridad)
8. [Integraciones Externas](#integraciones-externas)
9. [Escalabilidad](#escalabilidad)
10. [Monitoreo y Observabilidad](#monitoreo-y-observabilidad)

---

## Visión General

**Reputation Manager** es un sistema Multi-tenant SaaS que automatiza la gestión de feedback de pacientes para profesionales de la salud en Ecuador. El sistema intercepta potenciales reseñas negativas antes de que lleguen a Google y maximiza las reseñas positivas mediante un flujo de mensajería inteligente.

### Principios Arquitectónicos

1. **Separation of Concerns**: API, Worker, y Web son apps independientes
2. **Type Safety**: TypeScript end-to-end con Zod para runtime validation
3. **Data Isolation**: Multi-tenancy a nivel de base de datos con `workspaceId`
4. **Event-Driven**: Jobs asíncronos con BullMQ para operaciones no bloqueantes
5. **Fail-Safe**: Retry logic, dead letter queues, y circuit breakers
6. **Audit Trail**: Cada mensaje y acción tiene tracking completo

---

## Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO FINAL                            │
│                    (Doctor/Odontólogo)                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      WEB APP (Next.js 15)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Dashboard   │  │   Campaigns  │  │   Analytics  │         │
│  │   (React)    │  │   Manager    │  │   (Charts)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  Better Auth (Session Management)                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ REST API
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API SERVER (NestJS)                        │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Controllers Layer                                     │   │
│  │  ├── AuthController                                    │   │
│  │  ├── CampaignController                                │   │
│  │  ├── PatientController                                 │   │
│  │  ├── WebhookController (Twilio/WhatsApp)              │   │
│  │  └── AnalyticsController                               │   │
│  └────────────────────────────────────────────────────────┘   │
│                         ▼                                       │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Service Layer (Business Logic)                       │   │
│  │  ├── CampaignService                                   │   │
│  │  ├── MessageService                                    │   │
│  │  ├── BillingService (Credits)                         │   │
│  │  └── AnalyticsService                                  │   │
│  └────────────────────────────────────────────────────────┘   │
│                         ▼                                       │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Repository Layer (Data Access)                       │   │
│  │  └── Prisma Client                                     │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Guards: WorkspaceGuard, RoleGuard                             │
└────────┬───────────────────────────┬────────────────────────────┘
         │                           │
         │ Enqueue Jobs              │ Query/Persist
         ▼                           ▼
┌─────────────────────┐    ┌─────────────────────┐
│   REDIS (BullMQ)    │    │   POSTGRESQL 16     │
│                     │    │                     │
│  Job Queues:        │    │  Tables:            │
│  ├── initial-msg    │    │  ├── Workspace      │
│  ├── followup-msg   │    │  ├── User           │
│  ├── handle-response│    │  ├── Campaign       │
│  └── send-reminder  │    │  ├── Patient        │
│                     │    │  ├── Message        │
│  Bull Board UI      │    │  └── Template       │
└──────────┬──────────┘    └─────────────────────┘
           │
           │ Consume Jobs
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WORKER (NestJS)                              │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Job Processors                                        │   │
│  │  ├── SendInitialMessageProcessor                      │   │
│  │  ├── SendFollowupProcessor                            │   │
│  │  ├── HandleResponseProcessor                          │   │
│  │  └── SendReminderProcessor                            │   │
│  └────────────────────────────────────────────────────────┘   │
│                         ▼                                       │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Integration Services                                  │   │
│  │  ├── TwilioService (SMS)                              │   │
│  │  ├── WhatsAppService (Meta Business API)             │   │
│  │  └── SendGridService (Email)                          │   │
│  └────────────────────────────────────────────────────────┘   │
└────────┬────────────────────────────────────────────────────────┘
         │
         │ External API Calls
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICIOS EXTERNOS                           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │    Twilio    │  │   WhatsApp   │  │   SendGrid   │         │
│  │     SMS      │  │  Business API│  │    Email     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │    Stripe    │  │    Sentry    │  │  Google Maps │         │
│  │   Payments   │  │ Error Track  │  │   Reviews    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
         │
         │ Webhooks
         ▼
    (Back to API)
```

---

## Componentes del Sistema

### 1. Web App (Next.js 15)

**Tecnologías**:

- Next.js 15 con App Router
- React 19 (Server & Client Components)
- Tailwind CSS v4
- shadcn/ui
- Better Auth

**Responsabilidades**:

```typescript
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── campaigns/
│   │   │   ├── page.tsx           // Lista de campañas
│   │   │   ├── [id]/page.tsx      // Detalle de campaña
│   │   │   └── new/page.tsx       // Upload CSV
│   │   ├── analytics/
│   │   │   └── page.tsx           // Dashboard con charts
│   │   ├── settings/
│   │   │   ├── templates/         // Mensaje templates
│   │   │   ├── users/             // User management
│   │   │   └── billing/           // Créditos y pagos
│   │   └── layout.tsx             // Dashboard layout
│   ├── api/                       // API routes para Better Auth
│   └── layout.tsx                 // Root layout
├── components/
│   ├── ui/                        // shadcn components
│   ├── campaigns/
│   │   ├── csv-uploader.tsx
│   │   ├── campaign-list.tsx
│   │   └── campaign-stats.tsx
│   └── analytics/
│       ├── nps-chart.tsx
│       └── conversion-chart.tsx
└── lib/
    ├── auth.ts                    // Better Auth config
    ├── api-client.ts              // Fetch wrapper
    └── utils.ts
```

**Estado y Fetching**:

```typescript
// Usando TanStack Query para cache y sync
import { useQuery } from '@tanstack/react-query';

function useCampaigns(workspaceId: string) {
  return useQuery({
    queryKey: ['campaigns', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/campaigns`),
    staleTime: 30000, // 30s cache
  });
}
```

**Autenticación**:

```typescript
// Better Auth setup
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  database: prisma,
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});

// Middleware para proteger rutas
export async function middleware(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}
```

---

### 2. API Server (NestJS)

**Estructura**:

```typescript
apps/api/src/
├── main.ts                        // Bootstrap
├── app.module.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── guards/
│   │   ├── workspace.guard.ts     // Multi-tenancy enforcement
│   │   └── roles.guard.ts         // RBAC
│   └── decorators/
│       └── current-user.decorator.ts
├── workspaces/
│   ├── workspaces.controller.ts
│   ├── workspaces.service.ts
│   ├── workspaces.repository.ts
│   └── dto/
│       ├── create-workspace.dto.ts
│       └── update-workspace.dto.ts
├── campaigns/
│   ├── campaigns.controller.ts
│   ├── campaigns.service.ts
│   ├── campaigns.repository.ts
│   ├── csv-parser.service.ts      // Procesa CSV uploads
│   └── dto/
├── patients/
│   ├── patients.controller.ts
│   ├── patients.service.ts
│   └── patients.repository.ts
├── messages/
│   ├── messages.controller.ts
│   ├── messages.service.ts
│   └── messages.repository.ts
├── webhooks/
│   ├── twilio-webhook.controller.ts
│   ├── whatsapp-webhook.controller.ts
│   └── stripe-webhook.controller.ts
├── analytics/
│   ├── analytics.controller.ts
│   └── analytics.service.ts       // NPS, conversion rates
├── billing/
│   ├── billing.controller.ts
│   └── billing.service.ts         // Credits management
└── shared/
    ├── filters/
    │   └── http-exception.filter.ts
    ├── interceptors/
    │   └── logging.interceptor.ts
    └── pipes/
        └── zod-validation.pipe.ts
```

**Ejemplo: Campaign Controller**:

```typescript
@Controller('workspaces/:workspaceId/campaigns')
@UseGuards(WorkspaceGuard, RolesGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService, private readonly queue: Queue) {}

  @Post()
  @Roles('owner', 'doctor')
  async create(@Param('workspaceId') workspaceId: string, @Body(new ZodValidationPipe(CreateCampaignSchema)) dto: CreateCampaignDto, @CurrentUser() user: User) {
    // 1. Validar créditos disponibles
    await this.campaignsService.validateCredits(workspaceId, dto.patients.length);

    // 2. Crear campaña y pacientes
    const campaign = await this.campaignsService.create({
      ...dto,
      workspaceId,
      createdById: user.id,
    });

    // 3. Encolar jobs para envío de mensajes
    for (const patient of campaign.patients) {
      const delay = this.calculateDelay(patient.appointmentTime, dto.scheduledHoursAfter);

      await this.queue.add(
        'send-initial-message',
        {
          patientId: patient.id,
          campaignId: campaign.id,
          workspaceId,
        },
        { delay }
      );
    }

    return campaign;
  }

  @Get()
  async findAll(@Param('workspaceId') workspaceId: string, @Query() filters: CampaignFiltersDto) {
    return this.campaignsService.findByWorkspace(workspaceId, filters);
  }
}
```

**Workspace Guard** (Multi-tenancy):

```typescript
@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const workspaceId = request.params.workspaceId;

    if (!user || !workspaceId) {
      throw new UnauthorizedException();
    }

    // Verificar que el usuario pertenece al workspace
    const membership = await this.prisma.user.findFirst({
      where: {
        id: user.id,
        workspaceId: workspaceId,
      },
    });

    if (!membership) {
      throw new ForbiddenException('No tienes acceso a este workspace');
    }

    return true;
  }
}
```

---

### 3. Worker (NestJS)

**Estructura**:

```typescript
apps/worker/src/
├── main.ts                        // Bootstrap worker
├── app.module.ts
├── processors/
│   ├── send-initial-message.processor.ts
│   ├── send-followup.processor.ts
│   ├── handle-response.processor.ts
│   └── send-reminder.processor.ts
└── services/
    └── message-template.service.ts
```

**Ejemplo: Send Initial Message Processor**:

```typescript
@Processor('send-initial-message')
export class SendInitialMessageProcessor {
  constructor(private readonly prisma: PrismaService, private readonly twilioService: TwilioService, private readonly whatsappService: WhatsAppService, private readonly billingService: BillingService, private readonly templateService: MessageTemplateService) {}

  @Process()
  async handle(job: Job<SendInitialMessageJob>) {
    const { patientId, campaignId, workspaceId } = job.data;

    try {
      // 1. Obtener datos del paciente y campaña
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        include: { campaign: { include: { practice: true } } },
      });

      // 2. Validar consentimiento y opt-out
      if (!patient.hasConsent || patient.optedOutAt) {
        return { skipped: true, reason: 'No consent or opted out' };
      }

      // 3. Obtener template personalizado
      const template = await this.templateService.getTemplate(workspaceId, 'INITIAL');

      const message = this.templateService.render(template.content, {
        name: patient.name,
        doctor: patient.campaign.practice.name,
      });

      // 4. Enviar mensaje (SMS o WhatsApp según preferencia)
      let result;
      if (patient.preferredChannel === 'whatsapp') {
        result = await this.whatsappService.sendMessage(patient.phone, message);
      } else {
        result = await this.twilioService.sendSMS(patient.phone, message);
      }

      // 5. Guardar mensaje en DB
      await this.prisma.message.create({
        data: {
          patientId: patient.id,
          campaignId: campaign.id,
          type: 'INITIAL',
          content: message,
          channel: patient.preferredChannel,
          status: 'SENT',
          externalId: result.sid,
          sentAt: new Date(),
        },
      });

      // 6. Descontar crédito
      await this.billingService.deductCredit(workspaceId);

      return { success: true, messageId: result.sid };
    } catch (error) {
      // Log error a Sentry
      Sentry.captureException(error, {
        tags: { job: 'send-initial-message', patientId, campaignId },
      });

      // Retry automático por BullMQ (3 intentos con backoff)
      throw error;
    }
  }

  @OnQueueFailed()
  async onFailed(job: Job, error: Error) {
    // Después de 3 intentos fallidos, marcar como failed
    await this.prisma.message.create({
      data: {
        patientId: job.data.patientId,
        campaignId: job.data.campaignId,
        type: 'INITIAL',
        status: 'FAILED',
        error: error.message,
      },
    });

    // Notificar al doctor
    await this.notifyFailure(job.data);
  }
}
```

**BullMQ Configuration**:

```typescript
// apps/worker/src/config/bullmq.config.ts
export const bullmqConfig = {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s, 4s, 8s
    },
    removeOnComplete: 100, // Keep last 100 completed
    removeOnFail: 500, // Keep last 500 failed
  },
};
```

---

## Flujos de Datos Críticos

### Flujo 1: Upload CSV y Creación de Campaña

```
┌─────────┐
│ Doctor  │
└────┬────┘
     │ 1. Upload CSV
     ▼
┌─────────────────┐
│ Web App         │
│ CsvUploader     │
└────┬────────────┘
     │ 2. POST /api/workspaces/:id/campaigns
     │    FormData with CSV file
     ▼
┌─────────────────────────────────────────┐
│ API Server                              │
│ CampaignsController.create()            │
├─────────────────────────────────────────┤
│ 3. Parse CSV (papaparse)                │
│    ├── Validate headers                 │
│    ├── Validate phone format (+593)     │
│    ├── Validate email format            │
│    └── Check consent column             │
│                                         │
│ 4. Check billing credits                │
│    ├── Get workspace.messageCredits     │
│    └── Require: credits >= patients.len │
│                                         │
│ 5. Create Campaign + Patients (Transaction)│
│    BEGIN TRANSACTION                    │
│    ├── INSERT INTO campaigns            │
│    ├── INSERT INTO patients (bulk)      │
│    └── COMMIT                           │
│                                         │
│ 6. Enqueue jobs                         │
│    FOR EACH patient:                    │
│      ├── Calculate delay (2hrs from appt)│
│      └── Queue.add('send-initial-message')│
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────┐
│ Redis (BullMQ)  │
│ Jobs queued     │
└─────────────────┘
```

**Validaciones CSV**:

```typescript
const CsvRowSchema = z.object({
  nombre: z.string().min(2),
  telefono: z.string().regex(/^\+593\d{9}$/, 'Formato Ecuador: +593xxxxxxxxx'),
  email: z.string().email().optional(),
  fecha_cita: z.string().datetime(),
  consentimiento: z.enum(['si', 'no']),
});

// Ejemplo CSV válido:
// nombre,telefono,email,fecha_cita,consentimiento
// Juan Pérez,+593987654321,juan@email.com,2025-11-15T14:00:00Z,si
```

---

### Flujo 2: Envío de Mensaje Inicial

```
┌─────────────────┐
│ BullMQ          │
│ (2 horas después)│
└────┬────────────┘
     │ Trigger job
     ▼
┌─────────────────────────────────────────┐
│ Worker                                  │
│ SendInitialMessageProcessor             │
├─────────────────────────────────────────┤
│ 1. Get patient + campaign data          │
│    SELECT * FROM patients               │
│    WHERE id = :patientId                │
│    INCLUDE campaign, practice           │
│                                         │
│ 2. Validate eligibility                 │
│    ├── hasConsent = true?               │
│    ├── optedOutAt IS NULL?              │
│    └── dataDeletedAt IS NULL?           │
│                                         │
│ 3. Get custom template                  │
│    SELECT * FROM templates              │
│    WHERE workspaceId = :id              │
│    AND type = 'INITIAL'                 │
│                                         │
│ 4. Render message                       │
│    "Hola {{nombre}}, ¿cómo calificarías │
│     tu visita al Dr. {{doctor}}? (1-5)" │
│                                         │
│ 5. Send via Twilio/WhatsApp             │
│    POST https://api.twilio.com/...      │
│                                         │
│ 6. Save message record                  │
│    INSERT INTO messages                 │
│    (patient, type, content, status)     │
│                                         │
│ 7. Deduct credit                        │
│    UPDATE workspaces                    │
│    SET messageCredits = credits - 1     │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────┐
│ Twilio API      │
│ SMS sent        │
└─────────────────┘
     │
     ▼
   📱 Paciente
```

---

### Flujo 3: Respuesta del Paciente

```
   📱 Paciente
     │ Responde "5"
     ▼
┌─────────────────┐
│ Twilio          │
│ Receives reply  │
└────┬────────────┘
     │ Webhook POST
     │ /webhooks/twilio/sms
     ▼
┌─────────────────────────────────────────┐
│ API Server                              │
│ TwilioWebhookController                 │
├─────────────────────────────────────────┤
│ 1. Verify signature                     │
│    twilioClient.validateRequest()       │
│                                         │
│ 2. Parse body                           │
│    { From: "+593987654321",             │
│      Body: "5",                         │
│      MessageSid: "SM..." }              │
│                                         │
│ 3. Find patient by phone                │
│    SELECT * FROM patients               │
│    WHERE phone = :from                  │
│    AND has recent INITIAL message       │
│                                         │
│ 4. Parse rating (1-5)                   │
│    rating = parseInt(body.trim())       │
│    if (rating < 1 || rating > 5) {      │
│      // Enviar mensaje de ayuda         │
│    }                                    │
│                                         │
│ 5. Update message with rating           │
│    UPDATE messages                      │
│    SET rating = :rating,                │
│        repliedAt = NOW()                │
│                                         │
│ 6. Determine follow-up type             │
│    if (rating >= 4) {                   │
│      followupType = 'HAPPY'             │
│    } else {                             │
│      followupType = 'UNHAPPY'           │
│    }                                    │
│                                         │
│ 7. Enqueue follow-up job                │
│    Queue.add('send-followup', {         │
│      patientId,                         │
│      type: followupType                 │
│    }, { delay: 1000 }) // 1 segundo     │
└────┬────────────────────────────────────┘
     │
     ▼
┌─────────────────┐
│ Redis (BullMQ)  │
│ Followup queued │
└─────────────────┘
```

---

### Flujo 4: Envío de Follow-up

```
┌─────────────────┐
│ BullMQ          │
└────┬────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│ Worker                                  │
│ SendFollowupProcessor                   │
├─────────────────────────────────────────┤
│ 1. Get patient + rating                 │
│                                         │
│ 2. Get appropriate template             │
│    type = rating >= 4 ? 'FOLLOWUP_HAPPY'│
│                       : 'FOLLOWUP_UNHAPPY'│
│                                         │
│ 3. Render message                       │
│                                         │
│    IF HAPPY (4-5):                      │
│    "¡Nos alegra! ¿Compartirías tu       │
│     experiencia en Google?              │
│     https://g.page/r/xxx/review"        │
│                                         │
│    IF UNHAPPY (1-3):                    │
│    "Lamentamos no cumplir expectativas. │
│     Cuéntanos qué salió mal:            │
│     https://app.com/feedback/yyy"       │
│                                         │
│ 4. Send message                         │
│                                         │
│ 5. Save message record                  │
│                                         │
│ 6. Deduct credit                        │
└─────────────────────────────────────────┘
     │
     ▼
   📱 Paciente
     │
     ▼
┌─────────────────┐
│ IF HAPPY:       │
│ → Google Review │
│                 │
│ IF UNHAPPY:     │
│ → Private Form  │
└─────────────────┘
```

---

## Modelo de Base de Datos

### Diagrama ER (ASCII)

```
┌─────────────────┐
│   Workspace     │
├─────────────────┤
│ id (PK)         │
│ name            │
│ plan            │ ◄──────┐
│ messageCredits  │        │
│ createdAt       │        │
└────────┬────────┘        │
         │                 │
         │ 1:N             │
         ▼                 │
┌─────────────────┐        │
│      User       │        │
├─────────────────┤        │
│ id (PK)         │        │ 1:N
│ workspaceId (FK)├────────┘
│ email           │
│ role            │ ◄──────┐
│ name            │        │
└────────┬────────┘        │
         │                 │
         │ Created By      │
         ▼                 │
┌─────────────────┐        │
│    Campaign     │        │
├─────────────────┤        │
│ id (PK)         │        │
│ workspaceId (FK)├────────┘
│ practiceId (FK) ├────┐
│ createdById (FK)├────┘
│ name            │
│ status          │
│ scheduledHours  │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│    Patient      │
├─────────────────┤
│ id (PK)         │
│ campaignId (FK) ├────┐
│ workspaceId (FK)├────┘
│ name            │
│ phone           │
│ email           │
│ appointmentTime │
│ hasConsent      │◄─── IMPORTANTE
│ optedOutAt      │◄─── NULL = active
│ dataDeletedAt   │◄─── Soft delete
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│    Message      │
├─────────────────┤
│ id (PK)         │
│ patientId (FK)  │
│ campaignId (FK) │
│ type            │ (INITIAL | FOLLOWUP_HAPPY | FOLLOWUP_UNHAPPY)
│ content         │
│ channel         │ (SMS | WHATSAPP | EMAIL)
│ status          │ (PENDING | SENT | DELIVERED | FAILED)
│ rating          │ (1-5, NULL si no ha respondido)
│ sentAt          │
│ deliveredAt     │
│ repliedAt       │
│ externalId      │ (Twilio MessageSid)
└─────────────────┘

┌─────────────────┐
│    Practice     │
├─────────────────┤
│ id (PK)         │
│ workspaceId (FK)│
│ name            │
│ googlePlaceId   │◄─── Para construir review link
│ address         │
└─────────────────┘

┌─────────────────┐
│    Template     │
├─────────────────┤
│ id (PK)         │
│ workspaceId (FK)│
│ type            │ (INITIAL | FOLLOWUP_HAPPY | FOLLOWUP_UNHAPPY)
│ content         │ "Hola {{name}}, ..."
│ variables       │ ["name", "doctor", "practice"]
└─────────────────┘
```

### Prisma Schema Completo

```prisma
// libs/database/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Plan {
  FREE
  STARTER
  PROFESSIONAL
  ENTERPRISE
}

enum Role {
  OWNER
  DOCTOR
  RECEPTIONIST
}

enum CampaignStatus {
  DRAFT
  ACTIVE
  COMPLETED
  CANCELLED
}

enum MessageType {
  INITIAL
  FOLLOWUP_HAPPY
  FOLLOWUP_UNHAPPY
  REMINDER
}

enum MessageChannel {
  SMS
  WHATSAPP
  EMAIL
}

enum MessageStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
  REPLIED
}

model Workspace {
  id             String   @id @default(cuid())
  name           String
  plan           Plan     @default(FREE)
  messageCredits Int      @default(50)

  stripeCustomerId   String?
  stripeSubscriptionId String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users      User[]
  practices  Practice[]
  campaigns  Campaign[]
  patients   Patient[]
  templates  Template[]

  @@index([plan])
}

model User {
  id    String @id @default(cuid())
  email String @unique
  name  String
  role  Role   @default(DOCTOR)

  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  campaignsCreated Campaign[]

  @@index([workspaceId])
  @@index([email])
}

model Practice {
  id            String  @id @default(cuid())
  name          String
  address       String?
  googlePlaceId String? // Para generar review link

  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  campaigns Campaign[]

  @@index([workspaceId])
}

model Campaign {
  id                 String         @id @default(cuid())
  name               String
  status             CampaignStatus @default(ACTIVE)
  scheduledHoursAfter Int           @default(2) // Horas después de cita

  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  practiceId String
  practice   Practice @relation(fields: [practiceId], references: [id])

  createdById String
  createdBy   User   @relation(fields: [createdById], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  patients Patient[]
  messages Message[]

  @@index([workspaceId])
  @@index([status])
  @@index([createdAt])
}

model Patient {
  id              String    @id @default(cuid())
  name            String
  phone           String    // Formato: +593xxxxxxxxx
  email           String?
  appointmentTime DateTime

  // Compliance fields
  hasConsent    Boolean   @default(false) // MUST be true
  optedOutAt    DateTime? // Not null = opted out
  dataDeletedAt DateTime? // Soft delete

  preferredChannel MessageChannel @default(SMS)

  campaignId String
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  messages Message[]

  @@index([workspaceId])
  @@index([campaignId])
  @@index([phone])
  @@index([hasConsent])
  @@index([optedOutAt])
}

model Message {
  id      String        @id @default(cuid())
  type    MessageType
  channel MessageChannel
  status  MessageStatus @default(PENDING)
  content String

  rating Int? // 1-5, NULL si no respondió

  sentAt      DateTime?
  deliveredAt DateTime?
  repliedAt   DateTime?

  externalId String? // Twilio MessageSid or WhatsApp WAMID
  error      String?

  patientId String
  patient   Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)

  campaignId String
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([patientId])
  @@index([campaignId])
  @@index([status])
  @@index([type])
  @@index([sentAt])
}

model Template {
  id        String      @id @default(cuid())
  name      String
  type      MessageType
  content   String      // "Hola {{name}}, ..."
  variables String[]    // ["name", "doctor", "practice"]

  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([workspaceId])
  @@index([type])
}
```

---

## Sistema de Mensajería

### BullMQ Job Queues

```typescript
// Definición de jobs
interface SendInitialMessageJob {
  patientId: string;
  campaignId: string;
  workspaceId: string;
}

interface SendFollowupJob {
  patientId: string;
  messageId: string;
  type: 'HAPPY' | 'UNHAPPY';
}

interface HandleResponseJob {
  messageId: string;
  patientId: string;
  rating: number;
}

// Queue configuration
const queues = {
  'send-initial-message': {
    concurrency: 10, // 10 mensajes simultáneos
    rateLimit: {
      max: 100, // Máximo 100 jobs
      duration: 60000, // por minuto (límite Twilio)
    },
  },
  'send-followup': {
    concurrency: 10,
    rateLimit: {
      max: 100,
      duration: 60000,
    },
  },
  'handle-response': {
    concurrency: 50, // Procesamiento rápido
    rateLimit: null, // Sin límite
  },
};
```

### Retry Strategy

```typescript
const jobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // 2s → 4s → 8s
  },
  removeOnComplete: {
    age: 86400, // 24 horas
    count: 1000, // Máximo 1000 jobs
  },
  removeOnFail: {
    age: 604800, // 7 días
  },
};

// Dead Letter Queue para failures permanentes
@OnQueueFailed()
async onFailed(job: Job, error: Error) {
  if (job.attemptsMade >= job.opts.attempts) {
    // Mover a DLQ
    await this.dlqQueue.add('failed-message', {
      originalJob: job.data,
      error: error.message,
      attempts: job.attemptsMade,
    });

    // Notificar al admin
    await this.notifyAdmin(job, error);
  }
}
```

---

## Multi-tenancy & Seguridad

### Data Isolation

**Estrategia**: Row-Level con `workspaceId` en todas las tablas

```typescript
// TODOS los queries deben incluir workspaceId
class CampaignRepository {
  async findById(id: string, workspaceId: string) {
    return this.prisma.campaign.findFirst({
      where: {
        id,
        workspaceId, // ← CRÍTICO: previene cross-tenant access
      },
    });
  }

  async findAll(workspaceId: string) {
    return this.prisma.campaign.findMany({
      where: { workspaceId },
    });
  }
}

// Prisma Middleware para enforcement automático
prisma.$use(async (params, next) => {
  // Ignorar para operaciones que no son queries
  if (!['findUnique', 'findFirst', 'findMany', 'update', 'delete'].includes(params.action)) {
    return next(params);
  }

  // Verificar que workspaceId esté presente
  if (params.model !== 'Workspace' && !params.args.where?.workspaceId) {
    throw new Error('workspaceId is required for data isolation');
  }

  return next(params);
});
```

### RBAC (Role-Based Access Control)

```typescript
enum Permission {
  // Campaigns
  CAMPAIGN_CREATE = 'campaign:create',
  CAMPAIGN_READ = 'campaign:read',
  CAMPAIGN_UPDATE = 'campaign:update',
  CAMPAIGN_DELETE = 'campaign:delete',

  // Users
  USER_INVITE = 'user:invite',
  USER_MANAGE = 'user:manage',

  // Billing
  BILLING_VIEW = 'billing:view',
  BILLING_MANAGE = 'billing:manage',

  // Settings
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_MANAGE = 'settings:manage',
}

const rolePermissions: Record<Role, Permission[]> = {
  OWNER: [
    Permission.CAMPAIGN_CREATE,
    Permission.CAMPAIGN_READ,
    Permission.CAMPAIGN_UPDATE,
    Permission.CAMPAIGN_DELETE,
    Permission.USER_INVITE,
    Permission.USER_MANAGE,
    Permission.BILLING_VIEW,
    Permission.BILLING_MANAGE,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_MANAGE,
  ],
  DOCTOR: [
    Permission.CAMPAIGN_CREATE,
    Permission.CAMPAIGN_READ,
    Permission.CAMPAIGN_UPDATE, // Solo sus propias campañas
    Permission.SETTINGS_VIEW,
  ],
  RECEPTIONIST: [
    Permission.CAMPAIGN_CREATE, // Solo upload CSV
    Permission.CAMPAIGN_READ,
  ],
};

// Guard decorator
@Permissions(Permission.CAMPAIGN_CREATE)
@UseGuards(PermissionsGuard)
async createCampaign() {
  // ...
}
```

### Rate Limiting

```typescript
// Global rate limiting
@UseGuards(ThrottlerGuard)
@Throttle(100, 60) // 100 requests por minuto
export class AppController {}

// Per-workspace rate limiting
@Injectable()
export class WorkspaceThrottlerGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const workspaceId = request.user.workspaceId;

    const requestCount = await this.redis.incr(`ratelimit:${workspaceId}`);
    if (requestCount === 1) {
      await this.redis.expire(`ratelimit:${workspaceId}`, 60);
    }

    // FREE: 100 req/min, STARTER: 300, PRO: 1000
    const limits = { FREE: 100, STARTER: 300, PROFESSIONAL: 1000 };
    const workspace = await this.getWorkspace(workspaceId);

    return requestCount <= limits[workspace.plan];
  }
}
```

---

## Integraciones Externas

### Twilio SMS

```typescript
@Injectable()
export class TwilioService {
  private client: Twilio;

  constructor() {
    this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }

  async sendSMS(to: string, body: string): Promise<TwilioMessage> {
    try {
      const message = await this.client.messages.create({
        to,
        from: process.env.TWILIO_PHONE_NUMBER,
        body,
        statusCallback: `${process.env.API_URL}/webhooks/twilio/status`,
      });

      return {
        sid: message.sid,
        status: message.status,
        sentAt: new Date(),
      };
    } catch (error) {
      if (error.code === 21211) {
        throw new BadRequestException('Invalid phone number');
      }
      throw error;
    }
  }

  verifyWebhookSignature(signature: string, url: string, params: any): boolean {
    return twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN, signature, url, params);
  }
}
```

### WhatsApp Business API

```typescript
@Injectable()
export class WhatsAppService {
  private axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      baseURL: 'https://graph.facebook.com/v18.0',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async sendTemplate(to: string, templateName: string, languageCode: string = 'es', parameters: string[]) {
    const response = await this.axios.post(`/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: [
          {
            type: 'body',
            parameters: parameters.map((text) => ({
              type: 'text',
              text,
            })),
          },
        ],
      },
    });

    return {
      wamid: response.data.messages[0].id,
      status: 'sent',
    };
  }

  // WhatsApp templates deben estar pre-aprobados por Meta
  // Ejemplo de template:
  // Name: "initial_feedback"
  // Category: UTILITY
  // Body: "Hola {{1}}, ¿cómo calificarías tu visita al Dr. {{2}}? Responde del 1 al 5."
}
```

### Stripe Billing

```typescript
@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }

  async createSubscription(workspaceId: string, priceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    // Crear customer si no existe
    if (!workspace.stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        metadata: { workspaceId },
      });

      await this.prisma.workspace.update({
        where: { id: workspaceId },
        data: { stripeCustomerId: customer.id },
      });
    }

    // Crear subscription
    const subscription = await this.stripe.subscriptions.create({
      customer: workspace.stripeCustomerId,
      items: [{ price: priceId }],
      metadata: { workspaceId },
    });

    // Actualizar plan y créditos
    const planCredits = {
      FREE: 50,
      STARTER: 500,
      PROFESSIONAL: 2000,
      ENTERPRISE: 999999,
    };

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        plan: this.getPlanFromPriceId(priceId),
        stripeSubscriptionId: subscription.id,
        messageCredits: planCredits[this.getPlanFromPriceId(priceId)],
      },
    });

    return subscription;
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancelled(event.data.object);
        break;
    }
  }

  async deductCredit(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (workspace.messageCredits <= 0) {
      throw new BadRequestException('Insufficient credits');
    }

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { messageCredits: { decrement: 1 } },
    });
  }
}
```

---

## Escalabilidad

### Horizontal Scaling Strategy

```yaml
# Railway services configuration
services:
  # Web: Escala con tráfico HTTP
  web:
    instances: 2-5 # Auto-scale
    healthcheck: /api/health
    resources:
      memory: 512MB
      cpu: 0.5

  # API: Escala con carga de requests
  api:
    instances: 2-10 # Auto-scale
    healthcheck: /health
    resources:
      memory: 1GB
      cpu: 1

  # Worker: Escala con tamaño de queue
  worker:
    instances: 2-20 # Auto-scale basado en BullMQ queue size
    resources:
      memory: 512MB
      cpu: 0.5

  # PostgreSQL: Vertical scaling initially
  postgres:
    instances: 1
    resources:
      memory: 4GB
      cpu: 2
      storage: 50GB

  # Redis: Vertical scaling
  redis:
    instances: 1
    resources:
      memory: 2GB
      cpu: 1
```

### Database Optimization

```typescript
// Indexes estratégicos
@@index([workspaceId, createdAt]) // Queries típicos
@@index([status, scheduledAt])    // Job processing
@@index([phone])                   // Webhook lookups

// Connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error'],
  pool: {
    min: 5,
    max: 20,
    idleTimeoutMillis: 60000,
  },
});

// Read replicas (futuro)
const prismaRead = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_READ_REPLICA_URL,
    },
  },
});

// Usar read replica para analytics
async getAnalytics(workspaceId: string) {
  return prismaRead.message.groupBy({
    by: ['rating'],
    where: { campaign: { workspaceId } },
    _count: true,
  });
}
```

### Caching Strategy

```typescript
@Injectable()
export class CacheService {
  constructor(@InjectRedis() private redis: Redis) {}

  // Cache templates (cambian poco)
  async getTemplate(workspaceId: string, type: string) {
    const cacheKey = `template:${workspaceId}:${type}`;

    let template = await this.redis.get(cacheKey);
    if (template) {
      return JSON.parse(template);
    }

    template = await this.prisma.template.findFirst({
      where: { workspaceId, type },
    });

    await this.redis.setex(cacheKey, 3600, JSON.stringify(template));
    return template;
  }

  // Cache workspace data (credits, plan)
  async getWorkspace(id: string) {
    const cacheKey = `workspace:${id}`;

    let workspace = await this.redis.get(cacheKey);
    if (workspace) {
      return JSON.parse(workspace);
    }

    workspace = await this.prisma.workspace.findUnique({ where: { id } });
    await this.redis.setex(cacheKey, 300, JSON.stringify(workspace)); // 5 min

    return workspace;
  }

  // Invalidar cache cuando se actualizan créditos
  async invalidateWorkspace(id: string) {
    await this.redis.del(`workspace:${id}`);
  }
}
```

---

## Monitoreo y Observabilidad

### Logging Strategy

```typescript
// Structured logging con Winston
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  defaultMeta: {
    service: 'reputation-manager-api',
    environment: process.env.NODE_ENV,
  },
  transports: [new transports.Console(), new transports.File({ filename: 'error.log', level: 'error' }), new transports.File({ filename: 'combined.log' })],
});

// Log con contexto
logger.info('Message sent', {
  patientId: 'xxx',
  campaignId: 'yyy',
  workspaceId: 'zzz',
  channel: 'SMS',
  externalId: 'SM123',
});
```

### Sentry Integration

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% de traces
  integrations: [new Sentry.Integrations.Http({ tracing: true }), new Sentry.Integrations.Prisma({ client: prisma })],
});

// Capturar errores con contexto
try {
  await sendMessage(patient);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      component: 'message-sender',
      workspaceId: patient.workspaceId,
    },
    extra: {
      patientId: patient.id,
      campaignId: patient.campaignId,
    },
  });
  throw error;
}
```

### Metrics & Alerts

```typescript
// Prometheus metrics
import { Counter, Histogram, Gauge } from 'prom-client';

const messagesSent = new Counter({
  name: 'messages_sent_total',
  help: 'Total messages sent',
  labelNames: ['channel', 'workspace_id'],
});

const messageDuration = new Histogram({
  name: 'message_send_duration_seconds',
  help: 'Time to send message',
  labelNames: ['channel'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const queueSize = new Gauge({
  name: 'bullmq_queue_size',
  help: 'Number of jobs in queue',
  labelNames: ['queue_name'],
});

// Update metrics
messagesSent.inc({ channel: 'SMS', workspace_id: workspaceId });

const timer = messageDuration.startTimer({ channel: 'SMS' });
await sendSMS();
timer();
```

### Health Checks

```typescript
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService, private redis: Redis, private twilioService: TwilioService) {}

  @Get()
  async check() {
    const checks = await Promise.allSettled([this.checkDatabase(), this.checkRedis(), this.checkTwilio()]);

    const status = checks.every((c) => c.status === 'fulfilled') ? 'healthy' : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: checks[0].status === 'fulfilled' ? 'up' : 'down',
        redis: checks[1].status === 'fulfilled' ? 'up' : 'down',
        twilio: checks[2].status === 'fulfilled' ? 'up' : 'down',
      },
    };
  }

  private async checkDatabase() {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  private async checkRedis() {
    await this.redis.ping();
  }

  private async checkTwilio() {
    // Check Twilio account balance
    const account = await this.twilioService.client.api.accounts().fetch();
    return account.status === 'active';
  }
}
```

---

## Decisiones Técnicas Documentadas

### ADR-001: Monorepo con Nx

**Contexto**: Necesitamos compartir código TypeScript entre apps.  
**Decisión**: Usar Nx monorepo.  
**Consecuencias**: Build cache compartido, pero curva de aprendizaje.

### ADR-002: Worker Separado

**Contexto**: Jobs de larga duración pueden bloquear API.  
**Decisión**: Apps separadas para API y Worker.  
**Consecuencias**: Mejor escalabilidad, pero deploy más complejo.

### ADR-003: BullMQ sobre Cron

**Contexto**: Necesitamos scheduling preciso y retry logic.  
**Decisión**: BullMQ para job queue.  
**Consecuencias**: Persistencia garantizada, pero dependencia en Redis.

### ADR-004: Multi-tenant con workspaceId

**Contexto**: Un deployment para todos los clientes.  
**Decisión**: Row-level isolation con workspaceId.  
**Consecuencias**: Más simple que schemas separados, pero require disciplina.

### ADR-005: Railway para MVP

**Contexto**: Time-to-market es crítico.  
**Decisión**: Railway para hosting inicial.  
**Consecuencias**: Deploy rápido, pero más caro a escala.

---

**Versión**: 1.0.0  
**Última actualización**: 2025-11-15  
**Mantenedor**: @saxoboy

**Ver también**:

- [`docs/DATABASE.md`](docs/DATABASE.md) - Schema completo y migrations
- [`docs/SETUP.md`](docs/SETUP.md) - Guía de instalación
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) - Workflows de desarrollo
- [`docs/ROADMAP.md`](docs/ROADMAP.md) - Plan de implementación
