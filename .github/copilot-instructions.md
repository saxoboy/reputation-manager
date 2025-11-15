# Reputation Manager - AI Coding Agent Instructions

## Project Overview

**Reputation Manager** es un sistema Multi-tenant SaaS de gestión de feedback para profesionales de la salud (médicos, odontólogos) en Ecuador.

### El Problema
Los profesionales de la salud viven de su reputación online. Los pacientes insatisfechos siempre dejan reseñas negativas, pero los satisfechos rara vez lo hacen.

### La Solución
Sistema automatizado que:
1. Envía SMS/WhatsApp 2 horas después de la cita
2. Solicita calificación del 1-5
3. **Pacientes felices (4-5)**: Redirige a Google Reviews
4. **Pacientes infelices (1-3)**: Formulario privado para feedback interno
5. Previene malas reseñas públicas y maximiza las positivas

**Marketing**: "Mejoramos el feedback management y la experiencia del paciente" (no "filtramos reseñas").

**Estado actual**: Fase 0 - Setup inicial del proyecto  
**Timeline**: 9 meses hasta MVP en producción  
**Beta testers**: 4 doctores/dentistas confirmados

---

## Arquitectura del Sistema

### Estructura del Monorepo (Nx)

```
reputation-manager/
├── apps/
│   ├── web/                    # Next.js 15 - Dashboard del doctor
│   │   ├── app/                # App Router
│   │   ├── components/         # React components
│   │   ├── lib/                # Client utils
│   │   └── public/
│   │
│   ├── api/                    # NestJS - REST API principal
│   │   ├── src/
│   │   │   ├── auth/           # Better Auth integration
│   │   │   ├── workspaces/     # Multi-tenancy
│   │   │   ├── campaigns/      # Campaign management
│   │   │   ├── patients/       # Patient CRUD
│   │   │   ├── messages/       # Message handling
│   │   │   ├── webhooks/       # Twilio/WhatsApp webhooks
│   │   │   ├── analytics/      # Stats & reports
│   │   │   └── billing/        # Credits & Stripe
│   │   └── test/
│   │
│   └── worker/                 # NestJS Worker - Background jobs
│       ├── src/
│       │   ├── processors/     # BullMQ job processors
│       │   │   ├── send-initial-message.processor.ts
│       │   │   ├── send-followup.processor.ts
│       │   │   └── handle-response.processor.ts
│       │   └── integrations/
│       └── test/
│
├── libs/
│   ├── database/               # Prisma ORM compartido
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Definición completa del schema
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── src/
│   │       └── client.ts       # PrismaClient singleton
│   │
│   ├── shared-types/           # TypeScript types compartidos
│   │   └── src/
│   │       ├── dtos/           # Data Transfer Objects
│   │       ├── enums/
│   │       └── interfaces/
│   │
│   ├── shared-utils/           # Utilidades comunes
│   │   └── src/
│   │       ├── validators/     # Zod schemas
│   │       ├── formatters/
│   │       └── helpers/
│   │
│   └── integrations/           # Integraciones externas
│       ├── twilio/
│       │   └── src/
│       │       ├── twilio.service.ts
│       │       └── types.ts
│       ├── whatsapp/
│       │   └── src/
│       │       └── whatsapp.service.ts
│       ├── sendgrid/
│       │   └── src/
│       │       └── email.service.ts
│       └── stripe/
│           └── src/
│               └── billing.service.ts
│
├── docker-compose.yml          # Desarrollo local
├── .env.example
├── .coderabbit.yaml
└── docs/
    ├── ARCHITECTURE.md
    ├── SETUP.md
    ├── DEVELOPMENT.md
    ├── DATABASE.md
    └── ROADMAP.md
```

### Componentes Principales

#### 1. **Web App** (Next.js 15)
- **Responsabilidad**: UI del dashboard para doctores
- **Funcionalidades clave**:
  - Login/registro con Better Auth
  - Upload CSV de pacientes
  - Gestión de campañas
  - Visualización de analytics (NPS, conversion rate)
  - Configuración de templates de mensajes
  - Gestión de usuarios y permisos
  - Billing y créditos

#### 2. **API** (NestJS)
- **Responsabilidad**: REST API principal, lógica de negocio
- **Funcionalidades clave**:
  - CRUD completo para todas las entidades
  - Multi-tenancy con guards (workspace isolation)
  - Webhooks para Twilio/WhatsApp
  - Procesamiento de CSV
  - Creación de jobs en BullMQ
  - Analytics y reporting

#### 3. **Worker** (NestJS)
- **Responsabilidad**: Procesamiento asíncrono de jobs
- **Jobs principales**:
  - `send-initial-message`: Envía SMS/WhatsApp después de X horas
  - `handle-response`: Procesa respuesta del paciente (1-5)
  - `send-followup`: Envía link a Google o formulario según rating
  - `send-reminder`: Recordatorios si no hay respuesta (opcional)

### Flujo de Datos Principal

```
┌──────────────┐
│   Doctor     │ Sube CSV con pacientes del día
└───────┬──────┘
        │
        ▼
┌──────────────┐
│   Web App    │ POST /api/campaigns/upload
└───────┬──────┘
        │
        ▼
┌──────────────┐
│     API      │ Valida CSV, crea Campaign + Patients
└───────┬──────┘   Encola jobs en BullMQ
        │
        ▼
┌──────────────┐
│  PostgreSQL  │ Guarda: Campaign, Patient[], Message[]
└──────────────┘
        │
        ▼
┌──────────────┐
│  BullMQ      │ Job: "send-initial-message"
│  (Redis)     │ Scheduled: appointment_time + 2 hours
└───────┬──────┘
        │
        ▼ (2 horas después)
┌──────────────┐
│   Worker     │ Procesa job, llama TwilioService
└───────┬──────┘
        │
        ▼
┌──────────────┐
│   Twilio     │ Envía SMS al paciente
└──────────────┘
        │
        ▼
   📱 Paciente recibe:
   "Hola {nombre}, ¿cómo calificarías tu visita al Dr. {doctor}? (1-5)"
        │
        ▼ Responde "5"
┌──────────────┐
│   Twilio     │ POST /webhooks/twilio/sms
│   Webhook    │ Body: { From: "+593...", Body: "5" }
└───────┬──────┘
        │
        ▼
┌──────────────┐
│     API      │ Identifica paciente, actualiza Message
└───────┬──────┘   Rating ≥ 4? → Encola "send-followup-happy"
        │          Rating ≤ 3? → Encola "send-followup-unhappy"
        ▼
┌──────────────┐
│   Worker     │ Procesa followup
└───────┬──────┘
        │
        ▼
┌──────────────┐
│   Twilio     │ Envía mensaje con link
└──────────────┘
        │
        ▼
   📱 Si feliz (5):
   "¡Nos alegra! ¿Compartirías tu experiencia en Google?"
   [Link a Google Maps Review]
   
   📱 Si infeliz (1-3):
   "Lamentamos no cumplir tus expectativas. Cuéntanos qué salió mal:"
   [Link a formulario privado]
```

---

## Stack Tecnológico

### Frontend
- **Framework**: Next.js 15.x (App Router)
- **Runtime**: React 19.x
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Forms**: React Hook Form + Zod
- **State**: React Context + TanStack Query
- **Charts**: Recharts
- **Auth**: Better Auth

### Backend
- **Framework**: NestJS 10.x
- **ORM**: Prisma 5.x
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Jobs**: BullMQ
- **Validation**: class-validator + Zod
- **Testing**: Jest + Supertest

### Integraciones
- **SMS**: Twilio API
- **WhatsApp**: WhatsApp Business API (Meta)
- **Email**: SendGrid
- **Payments**: Stripe
- **Monitoring**: Sentry

### DevOps
- **Monorepo**: Nx
- **Package Manager**: pnpm
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **PR Reviews**: CodeRabbit
- **Hosting**: Railway (MVP), AWS (scale)

---

## Modelo Multi-Tenancy

### Jerarquía

```
Workspace (Tenant raíz)
  ├── Plan: FREE | STARTER | PROFESSIONAL | ENTERPRISE
  ├── messageCredits: number
  │
  ├── Users (1:N)
  │   ├── Role: OWNER | DOCTOR | RECEPTIONIST
  │   └── Permissions por role
  │
  ├── Practices (1:N) - Locations físicas
  │   ├── name: "Consultorio Norte"
  │   └── googlePlaceId: string (para reviews)
  │
  ├── Campaigns (1:N)
  │   ├── createdBy: User
  │   ├── practice: Practice
  │   └── patients: Patient[]
  │
  └── Templates (1:N)
      ├── type: INITIAL | FOLLOWUP_HAPPY | FOLLOWUP_UNHAPPY
      └── content: string (con variables: {name}, {doctor}, etc.)
```

### Planes y Pricing

| Plan | Precio/mes | Mensajes incluidos | Usuarios | Locations |
|------|------------|-------------------|----------|-----------|
| **FREE** | $0 | 50 | 1 | 1 |
| **STARTER** | $39 | 500 | 2 | 1 |
| **PROFESSIONAL** | $129 | 2000 | 5 | 5 |
| **ENTERPRISE** | Custom | Ilimitado | Ilimitado | Ilimitado |

**Mensajes adicionales**:
- STARTER: $0.10/mensaje
- PROFESSIONAL: $0.08/mensaje

### Isolation Strategy

Todos los queries deben filtrar por `workspaceId`:

```typescript
// ❌ NUNCA hacer esto
const campaigns = await prisma.campaign.findMany();

// ✅ SIEMPRE incluir workspaceId
const campaigns = await prisma.campaign.findMany({
  where: { workspaceId: user.workspaceId }
});
```

---

## Convenciones de Desarrollo

### Naming Conventions

**Files**: Kebab-case con sufijos claros
```
send-message.service.ts
create-campaign.dto.ts
workspace.guard.ts
```

**Classes**: PascalCase descriptivos
```typescript
SendMessageService
CreateCampaignDto
WorkspaceGuard
```

**Functions**: camelCase con verbos
```typescript
findPatientsByWorkspace()
createCampaign()
sendInitialMessage()
```

### TypeScript Patterns

**DTOs con Zod** (compartidos):
```typescript
// libs/shared-types/src/dtos/campaign.dto.ts
export const CreateCampaignSchema = z.object({
  workspaceId: z.string().cuid(),
  practiceId: z.string().cuid(),
  name: z.string().min(3).max(100),
  scheduledHoursAfter: z.number().min(1).max(48).default(2),
  patients: z.array(z.object({
    name: z.string(),
    phone: z.string().regex(/^\+593\d{9}$/), // Ecuador
    email: z.string().email().optional(),
    appointmentTime: z.string().datetime(),
    hasConsent: z.boolean()
  })).min(1)
});

export type CreateCampaignDto = z.infer<typeof CreateCampaignSchema>;
```

**Repository Pattern**:
```typescript
// apps/api/src/campaigns/campaign.repository.ts
@Injectable()
export class CampaignRepository {
  constructor(private prisma: PrismaService) {}

  async findByWorkspace(workspaceId: string) {
    return this.prisma.campaign.findMany({
      where: { workspaceId },
      include: { patients: { include: { messages: true } } }
    });
  }
}
```

### Git Workflow

**Branches**:
```
main           # Producción
develop        # Desarrollo activo
feature/*      # Nuevas features
fix/*          # Bug fixes
```

**Commits** (Conventional Commits):
```
feat(campaigns): add CSV upload validation
fix(worker): handle Twilio webhook timeout
refactor(auth): migrate to Better Auth
docs(setup): add Railway deployment guide
```

---

## Flujos de Trabajo Esenciales

### Setup Inicial

```bash
# 1. Clonar repo
git clone https://github.com/saxoboy/reputation-manager.git
cd reputation-manager

# 2. Instalar dependencias
pnpm install

# 3. Setup environment
cp .env.example .env
# Editar .env con tus credenciales

# 4. Levantar servicios con Docker
docker-compose up -d

# 5. Migrar base de datos
pnpm prisma:migrate

# 6. Seedear datos de prueba
pnpm prisma:seed

# 7. Levantar apps en desarrollo
pnpm dev
```

### Desarrollo Local

```bash
# Levantar todo
pnpm dev

# Apps individuales
pnpm nx serve web      # Frontend en :3000
pnpm nx serve api      # API en :3001
pnpm nx serve worker   # Worker (background)
```

### Testing

```bash
# Unit tests
pnpm test
pnpm nx test api --watch

# E2E tests
pnpm nx e2e web-e2e
pnpm nx e2e api-e2e

# Coverage
pnpm nx test api --coverage
```

### Database

```bash
# Crear migración
pnpm prisma:migrate

# Aplicar en producción
pnpm prisma:deploy

# Abrir Prisma Studio
pnpm prisma:studio

# Resetear DB (⚠️ BORRA TODO)
pnpm prisma:reset
```

---

## Integraciones Externas

### Better Auth (Autenticación)

**Variables de entorno**:
```env
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
BETTER_AUTH_SECRET=random-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
```

### Twilio (SMS)

**Variables de entorno**:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+593xxxxxxxxx
```

**Webhook**: `https://your-api.railway.app/webhooks/twilio/sms`

**Costos Ecuador**: ~$0.04-0.06 USD por SMS

### WhatsApp Business API

**Variables de entorno**:
```env
WHATSAPP_ACCESS_TOKEN=your-meta-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
```

**Webhook**: `https://your-api.railway.app/webhooks/whatsapp`

### Stripe (Pagos)

**Variables de entorno**:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### SendGrid (Email)

**Variables de entorno**:
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourapp.com
```

---

## Decisiones Arquitectónicas Importantes

### 1. Monorepo con Nx
**Por qué**: Compartir código TypeScript, build cache, refactoring fácil.  
**Trade-off**: Curva de aprendizaje inicial.

### 2. Worker separado del API
**Por qué**: Escala independiente, deployment independiente, failure isolation.  
**Trade-off**: Más complejidad en deployment.

### 3. BullMQ vs cron
**Por qué**: Persistencia, retry logic, concurrency control, delayed jobs exactos.  
**Trade-off**: Dependencia en Redis.

### 4. Prisma vs TypeORM
**Por qué**: Type-safety superior, DX mejor, migrations más simples.  
**Trade-off**: Menos flexible para queries muy complejas.

### 5. Better Auth vs NextAuth.js
**Por qué**: Más moderno, más ligero, diseñado para Next.js 15 App Router.  
**Trade-off**: Comunidad más pequeña.

### 6. Multi-tenant vs apps separadas
**Por qué**: Un deployment para todos, mantenimiento más fácil, costos compartidos.  
**Trade-off**: Complejidad en isolation y seguridad.

### 7. Railway vs AWS para MVP
**Por qué**: Time-to-market rápido, DX excelente, costo inicial bajo.  
**Exit strategy**: Migrar a AWS cuando llegues a 300+ clientes.

---

## Compliance y Seguridad

### Protección de Datos (Ecuador)

**Requisitos**:
1. ✅ Consentimiento explícito del paciente
2. ✅ Opt-out fácil ("Responde STOP")
3. ✅ Almacenamiento seguro
4. ✅ Derecho al olvido

**Implementación**:
```typescript
model Patient {
  hasConsent    Boolean   @default(false)  // MUST be true
  optedOutAt    DateTime? // If not null, never send
  dataDeletedAt DateTime? // Soft delete
}
```

### Google Review Policy

**Estrategia legal**:
- Marketing: "Feedback management" (no "filtrado de reseñas")
- Términos claros: Doctor responsable del uso ético
- Educar clientes sobre riesgos de Google

### Seguridad

- ✅ Helmet.js (security headers)
- ✅ Rate limiting
- ✅ Input validation (Zod)
- ✅ SQL injection prevention (Prisma)
- ✅ Webhook signature verification

---

## Comandos Rápidos

```bash
# Development
pnpm dev                    # Start all
pnpm nx serve api           # API only

# Testing
pnpm test                   # All tests
pnpm nx test api --watch    # Watch mode

# Database
pnpm prisma:migrate         # New migration
pnpm prisma:studio          # Open UI

# Build
pnpm build                  # Build all
pnpm nx affected:build      # Only affected

# Code Quality
pnpm lint                   # Lint all
pnpm format                 # Format all

# Docker
docker-compose up -d        # Start services
docker-compose logs -f api  # View logs

# Nx utilities
pnpm nx graph               # View dependency graph
pnpm nx reset               # Clear cache
```

---

## Archivos Clave

| Archivo | Descripción |
|---------|-------------|
| `nx.json` | Configuración Nx |
| `docker-compose.yml` | Servicios locales |
| `libs/database/prisma/schema.prisma` | Schema DB completo |
| `.coderabbit.yaml` | Config CodeRabbit |
| `docs/ARCHITECTURE.md` | Arquitectura detallada |
| `docs/DATABASE.md` | Schema y migrations |

---

## Notas para AI Agents

### Al agregar features:
1. Considera multi-tenancy (filtrar por `workspaceId`)
2. Valida con Zod en `libs/shared-types`
3. Features que envían mensajes deben descontar créditos
4. Tests son obligatorios

### Al debuggear:
1. Logs: `docker-compose logs -f worker`
2. Data: `pnpm prisma:studio`
3. Jobs: Bull Board en `:3001/admin/queues`
4. Errors: Sentry dashboard
5. Webhooks: Twilio Console → Debugger

### Contexto de negocio:
- **Target**: Doctores/dentistas en Ecuador
- **Pain point**: Reseñas negativas cuestan pacientes
- **USP**: Filtro pre-Google + feedback privado + analytics
- **Pricing**: Basado en mensajes, no usuarios
- **Growth**: Boca a boca entre doctores

---

**Última actualización**: 2025-11-15  
**Versión**: 1.0.0  
**Mantenedor**: @saxoboy