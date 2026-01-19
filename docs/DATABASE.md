# Reputation Manager - Database Documentation

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Diagrama de Entidades y Relaciones](#diagrama-de-entidades-y-relaciones)
3. [Schema de Prisma](#schema-de-prisma)
4. [Modelos Detallados](#modelos-detallados)
5. [Índices y Optimización](#índices-y-optimización)
6. [Estrategia de Migraciones](#estrategia-de-migraciones)
7. [Seeding de Datos](#seeding-de-datos)
8. [Queries Comunes](#queries-comunes)
9. [Backup y Recovery](#backup-y-recovery)

---

## Visión General

### Tecnología

- **Database**: PostgreSQL 16
- **ORM**: Prisma 5.x
- **Connection Pool**: PgBouncer (producción)
- **Backup**: Automated daily snapshots (Railway/AWS)

### Principios de Diseño

1. **Multi-tenancy**: Todas las tablas (excepto Workspace) tienen `workspaceId` para isolation
2. **Soft Deletes**: Campos `*DeletedAt` para cumplimiento GDPR
3. **Audit Trail**: Timestamps (`createdAt`, `updatedAt`) en todas las tablas
4. **Denormalización Estratégica**: Rating en `Message` para analytics rápidos
5. **Type Safety**: Enums para estados fijos (Plan, Role, Status, etc.)

---

## Diagrama de Entidades y Relaciones

```
┌────────────────────────────────────────────────────────────────────────┐
│                          WORKSPACE (Tenant)                            │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │ id: String (cuid)                                             │     │
│  │ name: String                                                  │     │
│  │ plan: Plan (FREE|STARTER|PROFESSIONAL|ENTERPRISE)            │     │
│  │ messageCredits: Int                                           │     │
│  │ stripeCustomerId: String?                                     │     │
│  │ stripeSubscriptionId: String?                                 │     │
│  │ createdAt: DateTime                                           │     │
│  │ updatedAt: DateTime                                           │     │
│  └───┬───────────────────────┬──────────────────┬────────────────┘     │
│      │                       │                  │                      │
│      │ 1:N                   │ 1:N              │ 1:N                  │
│      ▼                       ▼                  ▼                      │
│  ┌────────────┐      ┌──────────────┐    ┌──────────────┐            │
│  │   USER     │      │   PRACTICE   │    │  TEMPLATE    │            │
│  ├────────────┤      ├──────────────┤    ├──────────────┤            │
│  │ id         │      │ id           │    │ id           │            │
│  │ email      │      │ name         │    │ name         │            │
│  │ name       │      │ address      │    │ type         │            │
│  │ role       │      │ googlePlaceId│    │ content      │            │
│  │ workspaceId│◄─┐   │ workspaceId  │◄─┐ │ variables[]  │            │
│  └────┬───────┘  │   └──────┬───────┘  │ │ workspaceId  │◄─┐         │
│       │          │          │          │ └──────────────┘  │         │
│       │ Creates  │          │ Uses     │                   │         │
│       │          │          │          │                   │         │
│       ▼          │          ▼          │                   │         │
│  ┌────────────────────────────────┐    │                   │         │
│  │         CAMPAIGN               │    │                   │         │
│  ├────────────────────────────────┤    │                   │         │
│  │ id: String                     │    │                   │         │
│  │ name: String                   │    │                   │         │
│  │ status: CampaignStatus         │    │                   │         │
│  │ scheduledHoursAfter: Int       │    │                   │         │
│  │ workspaceId: String (FK) ──────┼────┘                   │         │
│  │ practiceId: String (FK) ───────┼────────────────────────┘         │
│  │ createdById: String (FK) ──────┼─────────────────────────────┐    │
│  │ createdAt: DateTime            │                             │    │
│  │ updatedAt: DateTime            │                             │    │
│  └───┬────────────────────────────┘                             │    │
│      │                                                           │    │
│      │ 1:N                                                       │    │
│      ▼                                                           │    │
│  ┌────────────────────────────────┐                             │    │
│  │          PATIENT               │                             │    │
│  ├────────────────────────────────┤                             │    │
│  │ id: String                     │                             │    │
│  │ name: String                   │                             │    │
│  │ phone: String (+593XXXXXXXXX)  │                             │    │
│  │ email: String?                 │                             │    │
│  │ appointmentTime: DateTime      │                             │    │
│  │ hasConsent: Boolean ★          │ ← CRÍTICO: must be true     │    │
│  │ optedOutAt: DateTime? ★        │ ← NULL = active             │    │
│  │ dataDeletedAt: DateTime? ★     │ ← Soft delete (GDPR)        │    │
│  │ preferredChannel: MessageChannel│                            │    │
│  │ campaignId: String (FK)        │                             │    │
│  │ workspaceId: String (FK) ──────┼─────────────────────────────┘    │
│  │ createdAt: DateTime            │                                  │
│  │ updatedAt: DateTime            │                                  │
│  └───┬────────────────────────────┘                                  │
│      │                                                                │
│      │ 1:N                                                            │
│      ▼                                                                │
│  ┌────────────────────────────────┐                                  │
│  │          MESSAGE               │                                  │
│  ├────────────────────────────────┤                                  │
│  │ id: String                     │                                  │
│  │ type: MessageType              │ ← INITIAL | FOLLOWUP_*           │
│  │ channel: MessageChannel        │ ← SMS | WHATSAPP | EMAIL         │
│  │ status: MessageStatus          │ ← PENDING | SENT | DELIVERED...  │
│  │ content: String                │                                  │
│  │ rating: Int? (1-5)             │ ← NULL if no reply yet           │
│  │ sentAt: DateTime?              │                                  │
│  │ deliveredAt: DateTime?         │                                  │
│  │ repliedAt: DateTime?           │                                  │
│  │ externalId: String?            │ ← Twilio MessageSid/WAMID        │
│  │ error: String?                 │                                  │
│  │ patientId: String (FK)         │                                  │
│  │ campaignId: String (FK)        │                                  │
│  │ createdAt: DateTime            │                                  │
│  │ updatedAt: DateTime            │                                  │
│  └────────────────────────────────┘                                  │
└────────────────────────────────────────────────────────────────────────┘

LEYENDA:
  ─── : Foreign Key Relationship
  1:N : One-to-Many Relationship
  ★   : Compliance/Legal Critical Field
  ?   : Nullable Field
```

---

## Schema de Prisma

```prisma
// libs/database/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"] // Para Docker
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// ENUMS
// ============================================================================

enum Plan {
  FREE
  STARTER
  PROFESSIONAL
  ENTERPRISE
}

enum Role {
  OWNER           // Full access, billing
  DOCTOR          // Create campaigns, view own data
  RECEPTIONIST    // Upload CSV only
}

enum CampaignStatus {
  DRAFT           // Being created
  ACTIVE          // Running
  COMPLETED       // All messages sent
  CANCELLED       // Manually stopped
}

enum MessageType {
  INITIAL             // "¿Cómo calificarías tu visita?"
  FOLLOWUP_HAPPY      // Link a Google Reviews
  FOLLOWUP_UNHAPPY    // Link a formulario privado
  REMINDER            // Si no responde en 24h (opcional)
}

enum MessageChannel {
  SMS
  WHATSAPP
  EMAIL
}

enum MessageStatus {
  PENDING     // En cola, no enviado
  SENT        // Enviado pero no confirmado
  DELIVERED   // Confirmado por proveedor
  FAILED      // Error al enviar
  REPLIED     // Paciente respondió
}

// ============================================================================
// MODELS
// ============================================================================

model Workspace {
  id   String @id @default(cuid())
  name String
  plan Plan   @default(FREE)

  // Billing & Credits
  messageCredits       Int     @default(50)
  stripeCustomerId     String? @unique
  stripeSubscriptionId String? @unique

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  users     User[]
  practices Practice[]
  campaigns Campaign[]
  patients  Patient[]
  templates Template[]

  @@index([plan])
  @@map("workspaces")
}

model User {
  id       String @id @default(cuid())
  email    String @unique
  password String // Hashed con bcrypt
  name     String
  role     Role   @default(DOCTOR)

  // Avatar & Profile
  avatarUrl String?
  phone     String?

  // Multi-tenancy
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  lastLoginAt DateTime?

  // Relations
  campaignsCreated Campaign[]

  @@index([workspaceId])
  @@index([email])
  @@index([role])
  @@map("users")
}

model Practice {
  id   String @id @default(cuid())
  name String

  // Location
  address       String?
  city          String?
  state         String?
  zipCode       String?
  country       String  @default("EC") // Ecuador

  // Google Integration
  googlePlaceId String? // Para generar review link
  // Formato: https://search.google.com/local/writereview?placeid={googlePlaceId}

  // Contact
  phone String?
  email String?

  // Multi-tenancy
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  campaigns Campaign[]

  @@index([workspaceId])
  @@index([googlePlaceId])
  @@map("practices")
}

model Campaign {
  id   String         @id @default(cuid())
  name String

  // Configuration
  status              CampaignStatus @default(ACTIVE)
  scheduledHoursAfter Int            @default(2) // Horas después de cita

  // Description (opcional)
  description String?

  // Multi-tenancy & Relations
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  practiceId String
  practice   Practice @relation(fields: [practiceId], references: [id])

  createdById String
  createdBy   User   @relation(fields: [createdById], references: [id])

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  patients Patient[]
  messages Message[]

  @@index([workspaceId])
  @@index([practiceId])
  @@index([createdById])
  @@index([status])
  @@index([createdAt(sort: Desc)]) // Para dashboard "Recent Campaigns"
  @@map("campaigns")
}

model Patient {
  id String @id @default(cuid())

  // Personal Info
  name  String
  phone String // Formato: +593XXXXXXXXX (Ecuador)
  email String?

  // Appointment
  appointmentTime DateTime
  appointmentType String? // "Consulta", "Limpieza", "Cirugía", etc.

  // Compliance & Legal (CRÍTICO)
  hasConsent    Boolean   @default(false) // MUST be true to send messages
  optedOutAt    DateTime? // If not null, NEVER send messages
  dataDeletedAt DateTime? // Soft delete for GDPR compliance

  // Preferences
  preferredChannel MessageChannel @default(SMS)
  language         String         @default("es") // Idioma preferido

  // Multi-tenancy & Relations
  campaignId String
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  messages Message[]

  // Indexes (Performance crítico para webhooks)
  @@index([workspaceId])
  @@index([campaignId])
  @@index([phone]) // Lookup rápido en webhooks
  @@index([hasConsent])
  @@index([optedOutAt])
  @@index([dataDeletedAt])
  @@index([appointmentTime])
  @@map("patients")
}

model Message {
  id String @id @default(cuid())

  // Message Details
  type    MessageType
  channel MessageChannel
  status  MessageStatus  @default(PENDING)
  content String         @db.Text // Mensaje completo enviado

  // Response Tracking
  rating Int? // 1-5, NULL si no ha respondido

  // Delivery Tracking
  sentAt      DateTime?
  deliveredAt DateTime?
  repliedAt   DateTime?

  // External Integration
  externalId String? // Twilio MessageSid (SM...) o WhatsApp WAMID
  error      String? @db.Text // Error message si falló

  // Cost Tracking (opcional, para analytics)
  cost Decimal? @db.Decimal(10, 4) // Costo real del mensaje

  // Multi-tenancy & Relations
  patientId String
  patient   Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)

  campaignId String
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Indexes
  @@index([patientId])
  @@index([campaignId])
  @@index([status])
  @@index([type])
  @@index([sentAt])
  @@index([rating]) // Para analytics NPS
  @@index([externalId]) // Lookup en webhooks
  @@map("messages")
}

model Template {
  id   String      @id @default(cuid())
  name String
  type MessageType

  // Template Content
  content   String   @db.Text // "Hola {{name}}, ¿cómo calificarías tu visita al Dr. {{doctor}}?"
  variables String[] // ["name", "doctor", "practice", "appointmentType"]

  // Metadata
  description String?
  isDefault   Boolean @default(false)

  // Multi-tenancy
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([workspaceId])
  @@index([type])
  @@index([isDefault])
  @@unique([workspaceId, type, isDefault]) // Solo un default por type
  @@map("templates")
}

// ============================================================================
// AUDIT LOG (Opcional, para compliance estricto)
// ============================================================================

model AuditLog {
  id String @id @default(cuid())

  // Who & What
  userId     String?
  workspaceId String
  action     String  // "campaign.create", "message.send", etc.
  entityType String  // "Campaign", "Patient", etc.
  entityId   String

  // Changes
  oldValue Json?
  newValue Json?

  // Context
  ipAddress String?
  userAgent String?

  createdAt DateTime @default(now())

  @@index([workspaceId])
  @@index([userId])
  @@index([action])
  @@index([createdAt(sort: Desc)])
  @@map("audit_logs")
}
```

---

## Modelos Detallados

### Workspace (Tenant)

**Propósito**: Contenedor principal para multi-tenancy. Cada consultorio/clínica es un Workspace.

**Campos Críticos**:

```prisma
plan: Plan               // Determina límites y features
messageCredits: Int      // Créditos disponibles para enviar mensajes
stripeCustomerId: String // Para facturación
```

**Reglas de Negocio**:

- Un Workspace FREE puede tener máximo 1 usuario
- Un Workspace debe tener al menos 1 Practice para crear Campaigns
- `messageCredits` se decrementa con cada mensaje enviado
- Cuando `messageCredits` llega a 0, no se pueden enviar más mensajes (hasta que compren más)

**Ejemplo**:

```typescript
const workspace = await prisma.workspace.create({
  data: {
    name: 'Consultorio Dental Sonrisas',
    plan: 'STARTER',
    messageCredits: 500,
    users: {
      create: {
        email: 'dr.perez@example.com',
        name: 'Dr. Juan Pérez',
        role: 'OWNER',
        password: await bcrypt.hash('secure-password', 10),
      },
    },
    practices: {
      create: {
        name: 'Consultorio Centro',
        googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      },
    },
  },
});
```

---

### User

**Propósito**: Usuarios con acceso al dashboard. Pueden ser dueños, doctores, o recepcionistas.

**Roles y Permisos**:

| Role             | Puede crear campañas | Puede ver todas las campañas | Puede gestionar usuarios | Puede ver billing |
| ---------------- | -------------------- | ---------------------------- | ------------------------ | ----------------- |
| **OWNER**        | ✅                   | ✅                           | ✅                       | ✅                |
| **DOCTOR**       | ✅                   | ⚠️ Solo las suyas            | ❌                       | ❌                |
| **RECEPTIONIST** | ✅ Solo subir CSV    | ❌                           | ❌                       | ❌                |

**Reglas de Negocio**:

- Email debe ser único globalmente
- Cada User pertenece a exactamente 1 Workspace
- OWNER no puede eliminarse si es el único owner del workspace
- Password debe hashearse con bcrypt (min 10 rounds)

---

### Practice (Location)

**Propósito**: Representar una ubicación física del consultorio. Usado para generar links de Google Reviews.

**googlePlaceId**:

```typescript
// Obtener Place ID de Google:
// 1. Ir a: https://developers.google.com/maps/documentation/places/web-service/place-id
// 2. Buscar el consultorio
// 3. Copiar el Place ID (ej: "ChIJN1t_tDeuEmsRUsoyG83frY4")

// Generar link de review:
const reviewLink = `https://search.google.com/local/writereview?placeid=${practice.googlePlaceId}`;

// Resultado: https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4
```

---

### Campaign

**Propósito**: Agrupa un conjunto de pacientes para una campaña de feedback específica.

**Lifecycle**:

```
DRAFT → ACTIVE → COMPLETED
   ↓        ↓
CANCELLED  CANCELLED
```

**Campos Importantes**:

- `scheduledHoursAfter`: Cuántas horas esperar después de `appointmentTime` antes de enviar mensaje inicial
- `status`:
  - `DRAFT`: Creada pero no activada
  - `ACTIVE`: Jobs encolados, enviando mensajes
  - `COMPLETED`: Todos los mensajes enviados o fallidos
  - `CANCELLED`: Detenida manualmente

**Query típico**:

```typescript
// Obtener campaigns activas con stats
const campaigns = await prisma.campaign.findMany({
  where: {
    workspaceId,
    status: 'ACTIVE',
  },
  include: {
    patients: {
      include: {
        messages: true,
      },
    },
    practice: true,
    createdBy: {
      select: { name: true, email: true },
    },
  },
});

// Calcular stats
campaigns.map((campaign) => ({
  ...campaign,
  stats: {
    totalPatients: campaign.patients.length,
    messagesSent: campaign.patients.filter((p) => p.messages.some((m) => m.status === 'DELIVERED')).length,
    repliesReceived: campaign.patients.filter((p) => p.messages.some((m) => m.rating !== null)).length,
    averageRating: calculateAverage(
      campaign.patients
        .flatMap((p) => p.messages)
        .filter((m) => m.rating !== null)
        .map((m) => m.rating),
    ),
  },
}));
```

---

### Patient

**Propósito**: Representa un paciente individual que recibirá mensajes.

**Campos de Compliance (CRÍTICOS)**:

```prisma
hasConsent: Boolean      // DEBE ser true para enviar
optedOutAt: DateTime?    // Si no es NULL, NUNCA enviar
dataDeletedAt: DateTime? // Soft delete (GDPR "Right to be Forgotten")
```

**Validación antes de enviar mensaje**:

```typescript
function canSendMessage(patient: Patient): boolean {
  return patient.hasConsent === true && patient.optedOutAt === null && patient.dataDeletedAt === null;
}
```

**Formato de teléfono**:

```typescript
// Ecuador: +593 + 9 dígitos
// Ejemplo: +593987654321

const phoneRegex = /^\+593\d{9}$/;

function validateEcuadorPhone(phone: string): boolean {
  return phoneRegex.test(phone);
}
```

**Opt-out handling**:

```typescript
// Cuando paciente responde "STOP"
async function handleOptOut(patientId: string) {
  await prisma.patient.update({
    where: { id: patientId },
    data: { optedOutAt: new Date() },
  });

  // Cancelar jobs pendientes
  const jobs = await queue.getJobs(['waiting', 'delayed']);
  for (const job of jobs) {
    if (job.data.patientId === patientId) {
      await job.remove();
    }
  }
}
```

---

### Message

**Propósito**: Representa un mensaje individual enviado a un paciente.

**Estados del Mensaje**:

```
PENDING → SENT → DELIVERED → REPLIED
   ↓        ↓         ↓
FAILED   FAILED   (timeout)
```

**Tracking de Tiempos**:

```typescript
interface MessageTimeline {
  createdAt: Date; // Job creado en BullMQ
  sentAt: Date; // Enviado a Twilio/WhatsApp
  deliveredAt: Date; // Confirmado por proveedor (webhook)
  repliedAt: Date; // Paciente respondió (webhook)
}

// Calcular métricas
const avgDeliveryTime = deliveredAt - sentAt;
const avgResponseTime = repliedAt - deliveredAt;
```

**Rating & Follow-up Logic**:

```typescript
async function handlePatientReply(messageId: string, rating: number) {
  // 1. Actualizar mensaje con rating
  await prisma.message.update({
    where: { id: messageId },
    data: {
      rating,
      status: 'REPLIED',
      repliedAt: new Date(),
    },
  });

  // 2. Determinar tipo de follow-up
  const followupType = rating >= 4 ? 'FOLLOWUP_HAPPY' : 'FOLLOWUP_UNHAPPY';

  // 3. Encolar job de follow-up
  await queue.add(
    'send-followup',
    {
      messageId,
      type: followupType,
    },
    {
      delay: 1000, // 1 segundo después
    },
  );
}
```

---

### Template

**Propósito**: Plantillas personalizables para mensajes.

**Variables disponibles**:

```typescript
const availableVariables = {
  name: 'patient.name',
  doctor: 'practice.name',
  practice: 'practice.name',
  appointmentType: 'patient.appointmentType',
  date: 'patient.appointmentTime (formatted)',
};

// Ejemplo de template:
const template = {
  type: 'INITIAL',
  content: 'Hola {{name}}, ¿cómo calificarías tu {{appointmentType}} con {{doctor}}? Responde del 1 al 5.',
  variables: ['name', 'appointmentType', 'doctor'],
};

// Render:
function renderTemplate(template: Template, data: any): string {
  let message = template.content;
  for (const variable of template.variables) {
    const value = data[variable] || '';
    message = message.replace(new RegExp(`{{${variable}}}`, 'g'), value);
  }
  return message;
}

// Output: "Hola Juan Pérez, ¿cómo calificarías tu Limpieza Dental con Dr. María López? Responde del 1 al 5."
```

**Templates por defecto** (seed data):

```typescript
const defaultTemplates = [
  {
    type: 'INITIAL',
    name: 'Solicitud de Feedback',
    content: 'Hola {{name}}, ¿cómo calificarías tu visita al {{practice}}? Responde del 1 al 5.',
    isDefault: true,
  },
  {
    type: 'FOLLOWUP_HAPPY',
    name: 'Link a Google Reviews',
    content: '¡Nos alegra mucho que hayas tenido una buena experiencia! ¿Te importaría compartir tu opinión en Google para ayudar a otros pacientes? {{reviewLink}}',
    isDefault: true,
  },
  {
    type: 'FOLLOWUP_UNHAPPY',
    name: 'Formulario de Quejas',
    content: 'Lamentamos que tu experiencia no haya sido la esperada. Tu feedback es importante para nosotros. Por favor, cuéntanos qué salió mal: {{feedbackLink}}',
    isDefault: true,
  },
];
```

---

## Índices y Optimización

### Índices Estratégicos

```prisma
// 1. Índices para Multi-tenancy (CRÍTICO)
@@index([workspaceId])

// 2. Índices para Webhooks (Performance crítico)
@@index([phone])        // Patient lookup por teléfono
@@index([externalId])   // Message lookup por Twilio MessageSid

// 3. Índices para Analytics
@@index([rating])       // NPS calculation
@@index([sentAt])       // Time-based queries
@@index([status])       // Filter by status

// 4. Índices Compuestos
@@index([workspaceId, createdAt(sort: Desc)])  // Dashboard "Recent Campaigns"
@@index([campaignId, status])                   // Campaign progress
@@index([patientId, type])                      // Patient message history
```

### Queries Optimizados

**❌ Lento** (N+1 queries):

```typescript
const campaigns = await prisma.campaign.findMany({ where: { workspaceId } });

for (const campaign of campaigns) {
  const patients = await prisma.patient.findMany({
    where: { campaignId: campaign.id },
  });
  campaign.patients = patients;
}
```

**✅ Rápido** (1 query con include):

```typescript
const campaigns = await prisma.campaign.findMany({
  where: { workspaceId },
  include: {
    patients: {
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Solo último mensaje
        },
      },
    },
  },
});
```

### Connection Pooling

```typescript
// libs/database/src/client.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Para producción con PgBouncer:
// DATABASE_URL="postgresql://user:password@host:6543/db?pgbouncer=true"
```

---

## Estrategia de Migraciones

### Workflow de Migrations

```bash
# 1. Modificar schema.prisma
# Ejemplo: Agregar campo "timezone" a Practice

# 2. Crear migration
pnpm exec prisma migrate dev --name add_timezone_to_practice

# Output:
# ✔ Generated Prisma Client
# ✔ Created migration: 20251115000000_add_timezone_to_practice

# 3. Revisar SQL generado
# libs/database/prisma/migrations/20251115000000_add_timezone_to_practice/migration.sql

# 4. Test en desarrollo
pnpm dev

# 5. Deploy a producción
pnpm exec prisma migrate deploy
```

### Migrations Complejas

**Ejemplo: Agregar campo NOT NULL con default**:

```sql
-- Migration: add_consent_field_to_patient
-- Created: 2025-11-15

-- Step 1: Add column as nullable
ALTER TABLE "patients" ADD COLUMN "hasConsent" BOOLEAN;

-- Step 2: Set default value for existing rows
UPDATE "patients" SET "hasConsent" = true WHERE "hasConsent" IS NULL;

-- Step 3: Make column NOT NULL
ALTER TABLE "patients" ALTER COLUMN "hasConsent" SET NOT NULL;

-- Step 4: Set default for new rows
ALTER TABLE "patients" ALTER COLUMN "hasConsent" SET DEFAULT false;
```

**Ejemplo: Migración de datos**:

```sql
-- Migration: normalize_phone_numbers
-- Normalizar teléfonos de Ecuador a formato +593XXXXXXXXX

-- Backup current data
CREATE TABLE patients_phone_backup AS
SELECT id, phone FROM patients;

-- Update format
UPDATE patients
SET phone = '+593' || regexp_replace(phone, '[^0-9]', '', 'g')
WHERE phone NOT LIKE '+593%';

-- Validate
SELECT COUNT(*) FROM patients WHERE phone !~ '^\+593\d{9}$';
-- Should be 0
```

### Rollback Strategy

```bash
# Ver migraciones aplicadas
pnpm exec prisma migrate status

# Rollback no es directo en Prisma, hay que hacerlo manualmente:

# 1. Identificar migration a revertir
# 2. Crear script de rollback
# 3. Ejecutar en DB:
psql $DATABASE_URL -f rollback.sql

# 4. Marcar migration como no aplicada
DELETE FROM "_prisma_migrations" WHERE migration_name = '20251115000000_add_timezone_to_practice';

# 5. Regenerar Prisma Client
pnpm exec prisma generate
```

---

## Seeding de Datos

### Seed Script

```typescript
// libs/database/prisma/seed.ts
import { PrismaClient, Plan, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: 'seed-workspace-1' },
    update: {},
    create: {
      id: 'seed-workspace-1',
      name: 'Consultorio Demo',
      plan: Plan.PROFESSIONAL,
      messageCredits: 2000,
    },
  });

  console.log('✅ Created workspace:', workspace.name);

  // 2. Create Users
  const owner = await prisma.user.upsert({
    where: { email: 'demo@reputationmanager.com' },
    update: {},
    create: {
      email: 'demo@reputationmanager.com',
      password: await bcrypt.hash('demo1234', 10),
      name: 'Dr. Demo',
      role: Role.OWNER,
      workspaceId: workspace.id,
    },
  });

  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@reputationmanager.com' },
    update: {},
    create: {
      email: 'doctor@reputationmanager.com',
      password: await bcrypt.hash('demo1234', 10),
      name: 'Dra. María López',
      role: Role.DOCTOR,
      workspaceId: workspace.id,
    },
  });

  console.log('✅ Created users:', owner.email, doctor.email);

  // 3. Create Practice
  const practice = await prisma.practice.upsert({
    where: { id: 'seed-practice-1' },
    update: {},
    create: {
      id: 'seed-practice-1',
      name: 'Consultorio Centro',
      address: 'Av. Amazonas N24-03',
      city: 'Quito',
      country: 'EC',
      googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      workspaceId: workspace.id,
    },
  });

  console.log('✅ Created practice:', practice.name);

  // 4. Create Templates
  const templates = await Promise.all([
    prisma.template.upsert({
      where: { id: 'seed-template-initial' },
      update: {},
      create: {
        id: 'seed-template-initial',
        name: 'Solicitud Inicial',
        type: 'INITIAL',
        content: 'Hola {{name}}, ¿cómo calificarías tu visita al {{practice}}? Responde del 1 al 5.',
        variables: ['name', 'practice'],
        isDefault: true,
        workspaceId: workspace.id,
      },
    }),
    prisma.template.upsert({
      where: { id: 'seed-template-happy' },
      update: {},
      create: {
        id: 'seed-template-happy',
        name: 'Seguimiento Positivo',
        type: 'FOLLOWUP_HAPPY',
        content: '¡Gracias por tu respuesta! ¿Nos ayudarías compartiendo tu experiencia en Google? {{reviewLink}}',
        variables: ['reviewLink'],
        isDefault: true,
        workspaceId: workspace.id,
      },
    }),
    prisma.template.upsert({
      where: { id: 'seed-template-unhappy' },
      update: {},
      create: {
        id: 'seed-template-unhappy',
        name: 'Seguimiento Negativo',
        type: 'FOLLOWUP_UNHAPPY',
        content: 'Lamentamos no cumplir tus expectativas. Cuéntanos qué podemos mejorar: {{feedbackLink}}',
        variables: ['feedbackLink'],
        isDefault: true,
        workspaceId: workspace.id,
      },
    }),
  ]);

  console.log('✅ Created templates:', templates.length);

  // 5. Create Sample Campaign with Patients
  const campaign = await prisma.campaign.create({
    data: {
      name: 'Pacientes Noviembre 2025',
      status: 'ACTIVE',
      scheduledHoursAfter: 2,
      workspaceId: workspace.id,
      practiceId: practice.id,
      createdById: owner.id,
      patients: {
        create: [
          {
            name: 'Juan Pérez',
            phone: '+593987654321',
            email: 'juan@example.com',
            appointmentTime: new Date('2025-11-15T10:00:00Z'),
            hasConsent: true,
            preferredChannel: 'SMS',
            workspaceId: workspace.id,
          },
          {
            name: 'María García',
            phone: '+593987654322',
            email: 'maria@example.com',
            appointmentTime: new Date('2025-11-15T11:00:00Z'),
            hasConsent: true,
            preferredChannel: 'WHATSAPP',
            workspaceId: workspace.id,
          },
          {
            name: 'Carlos Ramírez',
            phone: '+593987654323',
            appointmentTime: new Date('2025-11-15T14:00:00Z'),
            hasConsent: true,
            preferredChannel: 'SMS',
            workspaceId: workspace.id,
          },
        ],
      },
    },
    include: {
      patients: true,
    },
  });

  console.log('✅ Created campaign with patients:', campaign.patients.length);

  console.log('\n🎉 Seeding completed!');
  console.log('\n📝 Demo Credentials:');
  console.log('   Email: demo@reputationmanager.com');
  console.log('   Password: demo1234');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Ejecutar seed**:

```bash
pnpm exec prisma db seed
```

---

## Queries Comunes

### Analytics: NPS Score

```typescript
// Net Promoter Score = (Promoters - Detractors) / Total * 100
// Promoters: rating 4-5
// Passives: rating 3
// Detractors: rating 1-2

async function calculateNPS(workspaceId: string, dateRange?: { from: Date; to: Date }) {
  const messages = await prisma.message.findMany({
    where: {
      campaign: { workspaceId },
      rating: { not: null },
      ...(dateRange && {
        repliedAt: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      }),
    },
    select: { rating: true },
  });

  const total = messages.length;
  if (total === 0) return null;

  const promoters = messages.filter((m) => m.rating! >= 4).length;
  const detractors = messages.filter((m) => m.rating! <= 2).length;

  const nps = ((promoters - detractors) / total) * 100;

  return {
    nps: Math.round(nps),
    promoters,
    detractors,
    passives: total - promoters - detractors,
    total,
  };
}
```

### Analytics: Conversion Rate

```typescript
// Conversion Rate = (Replied / Sent) * 100

async function calculateConversionRate(campaignId: string) {
  const stats = await prisma.message.groupBy({
    by: ['status'],
    where: { campaignId },
    _count: true,
  });

  const sent = stats.find((s) => ['DELIVERED', 'REPLIED'].includes(s.status))?._count || 0;
  const replied = stats.find((s) => s.status === 'REPLIED')?._count || 0;

  return {
    conversionRate: sent > 0 ? (replied / sent) * 100 : 0,
    sent,
    replied,
  };
}
```

### Dashboard: Recent Activity

```typescript
async function getRecentActivity(workspaceId: string, limit: number = 10) {
  return prisma.message.findMany({
    where: {
      campaign: { workspaceId },
      status: { in: ['DELIVERED', 'REPLIED'] },
    },
    orderBy: { sentAt: 'desc' },
    take: limit,
    include: {
      patient: { select: { name: true, phone: true } },
      campaign: { select: { name: true } },
    },
  });
}
```

---

## Backup y Recovery

### Automated Backups (Railway)

```bash
# Railway hace backups automáticos diarios
# Restaurar desde Railway dashboard:
# 1. Ir a Database → Backups
# 2. Seleccionar snapshot
# 3. Click "Restore"
```

### Manual Backup

```bash
# Backup completo
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup solo schema
pg_dump $DATABASE_URL --schema-only > schema_backup.sql

# Backup solo datos
pg_dump $DATABASE_URL --data-only > data_backup.sql

# Restore
psql $DATABASE_URL < backup_20251115_120000.sql
```

### Point-in-Time Recovery

```sql
-- Ver cambios recientes (audit log)
SELECT * FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Restaurar paciente eliminado por error
UPDATE patients
SET data_deleted_at = NULL
WHERE id = 'patient-id' AND data_deleted_at IS NOT NULL;
```

---

## Mantenimiento

### Vacuum y Analyze

```sql
-- Ejecutar semanalmente para optimizar performance
VACUUM ANALYZE;

-- Vacuum específico
VACUUM ANALYZE messages;
VACUUM ANALYZE patients;
```

### Limpieza de Datos Antiguos

```sql
-- Eliminar mensajes antiguos (después de 90 días)
DELETE FROM messages
WHERE created_at < NOW() - INTERVAL '90 days'
AND status IN ('FAILED', 'DELIVERED');

-- Archivar pacientes (soft delete después de 2 años)
UPDATE patients
SET data_deleted_at = NOW()
WHERE created_at < NOW() - INTERVAL '2 years'
AND data_deleted_at IS NULL;
```

---

**Versión**: 1.0.0  
**Última actualización**: 2025-11-15  
**Mantenedor**: @saxoboy

**Ver también**:

- [`ARCHITECTURE.md`](../ARCHITECTURE.md) - Arquitectura completa
- [`SETUP.md`](SETUP.md) - Guía de instalación
- [Prisma Documentation](https://www.prisma.io/docs/)
