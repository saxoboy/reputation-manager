# Development Guide - Reputation Manager

Guía completa para desarrollo diario, workflows, convenciones y mejores prácticas.

---

## Tabla de Contenidos

1. [Ambiente de Desarrollo](#ambiente-de-desarrollo)
2. [Workflows Diarios](#workflows-diarios)
3. [Estructura del Código](#estructura-del-código)
4. [Convenciones](#convenciones)
5. [Testing](#testing)
6. [Debugging](#debugging)
7. [Git Workflow](#git-workflow)
8. [Code Review](#code-review)

---

## Ambiente de Desarrollo

### Levantar el Proyecto

**Opción 1: Todo junto**

```bash
pnpm dev
```

**Opción 2: Apps individuales** (más control, logs separados)

```bash
# Terminal 1: Frontend
pnpm nx serve web

# Terminal 2: API
pnpm nx serve api

# Terminal 3: Worker
pnpm nx serve worker
```

**Opción 3: Con watch mode para libs**

```bash
pnpm nx run-many --target=serve --projects=web,api,worker --parallel=3 --with-deps
```

### Hot Reload

Todos los cambios se recargan automáticamente:

- **Frontend (Next.js)**: Fast Refresh
- **Backend (NestJS)**: Webpack HMR
- **Shared libs**: Nx watch mode

### Servicios Auxiliares

```bash
# PostgreSQL + Redis
docker-compose up -d

# Prisma Studio (UI visual)
pnpm prisma:studio

# BullMQ Dashboard (ver jobs)
# Disponible automáticamente en: http://localhost:3000/admin/queues
```

---

## Workflows Diarios

### 1. Agregar una Nueva Feature

#### Ejemplo: "Agregar campo 'specialty' a Practice"

**Paso 1: Crear branch**

```bash
git checkout develop
git pull origin develop
git checkout -b feature/add-practice-specialty
```

**Paso 2: Actualizar schema de Prisma**

```typescript
// libs/database/prisma/schema.prisma
model Practice {
  id           String   @id @default(cuid())
  workspaceId  String
  workspace    Workspace @relation(fields: [workspaceId], references: [id])
  name         String
  address      String?
  phone        String?
  googlePlaceId String?
  specialty    String?  // 👈 Nuevo campo
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  campaigns Campaign[]

  @@index([workspaceId])
}
```

**Paso 3: Crear migración**

```bash
pnpm prisma:migrate --name add_practice_specialty
```

**Paso 4: Actualizar DTOs**

```typescript
// libs/shared-types/src/dtos/practice.dto.ts
import { z } from 'zod';

export const CreatePracticeSchema = z.object({
  workspaceId: z.string().cuid(),
  name: z.string().min(3).max(100),
  address: z.string().optional(),
  phone: z
    .string()
    .regex(/^\+593\d{9}$/)
    .optional(),
  googlePlaceId: z.string().optional(),
  specialty: z.enum(['GENERAL_MEDICINE', 'DENTISTRY', 'CARDIOLOGY', 'DERMATOLOGY', 'OTHER']).optional(), // 👈 Nuevo campo
});

export type CreatePracticeDto = z.infer<typeof CreatePracticeSchema>;
```

**Paso 5: Actualizar Service**

```typescript
// apps/api/src/practices/practice.service.ts
async create(dto: CreatePracticeDto) {
  return this.prisma.practice.create({
    data: {
      workspaceId: dto.workspaceId,
      name: dto.name,
      address: dto.address,
      phone: dto.phone,
      googlePlaceId: dto.googlePlaceId,
      specialty: dto.specialty, // 👈 Incluir nuevo campo
    },
  });
}
```

**Paso 6: Actualizar Frontend**

```typescript
// apps/web/components/practices/practice-form.tsx
<FormField
  control={form.control}
  name="specialty"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Especialidad</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una especialidad" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="GENERAL_MEDICINE">Medicina General</SelectItem>
          <SelectItem value="DENTISTRY">Odontología</SelectItem>
          <SelectItem value="CARDIOLOGY">Cardiología</SelectItem>
          <SelectItem value="DERMATOLOGY">Dermatología</SelectItem>
          <SelectItem value="OTHER">Otra</SelectItem>
        </SelectContent>
      </Select>
    </FormItem>
  )}
/>
```

**Paso 7: Agregar tests**

```typescript
// apps/api/src/practices/practice.service.spec.ts
it('should create practice with specialty', async () => {
  const dto: CreatePracticeDto = {
    workspaceId: 'workspace-1',
    name: 'Clínica Cardio',
    specialty: 'CARDIOLOGY',
  };

  const result = await service.create(dto);

  expect(result.specialty).toBe('CARDIOLOGY');
});
```

**Paso 8: Ejecutar tests**

```bash
pnpm nx test api
pnpm nx test web
```

**Paso 9: Commit y push**

```bash
git add .
git commit -m "feat(practices): add specialty field"
git push origin feature/add-practice-specialty
```

**Paso 10: Crear PR en GitHub**

- CodeRabbit revisará automáticamente
- Esperar aprobación
- Merge a `develop`

---

### 2. Agregar un Nuevo Endpoint

#### Ejemplo: "GET /api/campaigns/:id/stats"

**Paso 1: Definir el DTO de respuesta**

```typescript
// libs/shared-types/src/dtos/campaign-stats.dto.ts
export interface CampaignStatsDto {
  totalPatients: number;
  totalSent: number;
  totalResponded: number;
  averageRating: number;
  nps: number;
  conversionRate: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
```

**Paso 2: Implementar en el Service**

```typescript
// apps/api/src/campaigns/campaign.service.ts
async getStats(campaignId: string, workspaceId: string): Promise<CampaignStatsDto> {
  const campaign = await this.prisma.campaign.findUnique({
    where: { id: campaignId, workspaceId },
    include: {
      patients: {
        include: { messages: true },
      },
    },
  });

  if (!campaign) {
    throw new NotFoundException('Campaign not found');
  }

  const patients = campaign.patients;
  const messages = patients.flatMap(p => p.messages);
  const responded = messages.filter(m => m.rating !== null);

  const totalRating = responded.reduce((sum, m) => sum + (m.rating || 0), 0);
  const averageRating = responded.length > 0 ? totalRating / responded.length : 0;

  const promoters = responded.filter(m => m.rating >= 4).length;
  const detractors = responded.filter(m => m.rating <= 2).length;
  const nps = responded.length > 0
    ? ((promoters - detractors) / responded.length) * 100
    : 0;

  const ratingDistribution = {
    1: responded.filter(m => m.rating === 1).length,
    2: responded.filter(m => m.rating === 2).length,
    3: responded.filter(m => m.rating === 3).length,
    4: responded.filter(m => m.rating === 4).length,
    5: responded.filter(m => m.rating === 5).length,
  };

  return {
    totalPatients: patients.length,
    totalSent: messages.length,
    totalResponded: responded.length,
    averageRating: Math.round(averageRating * 10) / 10,
    nps: Math.round(nps),
    conversionRate: patients.length > 0
      ? Math.round((responded.length / patients.length) * 100)
      : 0,
    ratingDistribution,
  };
}
```

**Paso 3: Agregar ruta en el Controller**

```typescript
// apps/api/src/campaigns/campaign.controller.ts
@Get(':id/stats')
@UseGuards(WorkspaceGuard)
async getStats(
  @Param('id') id: string,
  @CurrentUser() user: User,
): Promise<CampaignStatsDto> {
  return this.campaignService.getStats(id, user.workspaceId);
}
```

**Paso 4: Agregar test**

```typescript
// apps/api/src/campaigns/campaign.controller.spec.ts
it('GET /campaigns/:id/stats should return stats', async () => {
  const response = await request(app.getHttpServer()).get('/campaigns/campaign-1/stats').set('Authorization', `Bearer ${token}`).expect(200);

  expect(response.body).toMatchObject({
    totalPatients: expect.any(Number),
    totalSent: expect.any(Number),
    totalResponded: expect.any(Number),
    averageRating: expect.any(Number),
    nps: expect.any(Number),
    conversionRate: expect.any(Number),
    ratingDistribution: {
      1: expect.any(Number),
      2: expect.any(Number),
      3: expect.any(Number),
      4: expect.any(Number),
      5: expect.any(Number),
    },
  });
});
```

**Paso 5: Consumir desde el Frontend**

```typescript
// apps/web/lib/api/campaigns.ts
export async function getCampaignStats(campaignId: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${campaignId}/stats`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch campaign stats');
  }

  return response.json() as Promise<CampaignStatsDto>;
}
```

---

### 3. Agregar un Job de BullMQ

#### Ejemplo: "Send reminder si no responde en 24h"

**Paso 1: Definir el payload del job**

```typescript
// libs/shared-types/src/interfaces/jobs.interface.ts
export interface SendReminderJobPayload {
  messageId: string;
  patientId: string;
  campaignId: string;
  workspaceId: string;
}
```

**Paso 2: Encolar el job desde el API**

```typescript
// apps/api/src/messages/message.service.ts
async scheduleReminder(messageId: string) {
  const message = await this.prisma.message.findUnique({
    where: { id: messageId },
    include: { patient: { include: { campaign: true } } },
  });

  if (!message) {
    throw new NotFoundException('Message not found');
  }

  // Encolar para 24 horas después
  await this.messageQueue.add(
    'send-reminder',
    {
      messageId: message.id,
      patientId: message.patientId,
      campaignId: message.patient.campaignId,
      workspaceId: message.patient.campaign.workspaceId,
    } as SendReminderJobPayload,
    {
      delay: 24 * 60 * 60 * 1000, // 24 horas en ms
      removeOnComplete: true,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    }
  );
}
```

**Paso 3: Crear el Processor**

```typescript
// apps/worker/src/processors/send-reminder.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SendReminderJobPayload } from '@reputation-manager/shared-types';
import { TwilioService } from '@reputation-manager/integrations/twilio';

@Processor('messages')
export class SendReminderProcessor extends WorkerHost {
  constructor(private twilioService: TwilioService) {
    super();
  }

  async process(job: Job<SendReminderJobPayload>) {
    const { messageId, patientId, workspaceId } = job.data;

    // Verificar que no haya respondido
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { patient: true },
    });

    if (!message || message.rating !== null) {
      // Ya respondió, no enviar reminder
      return { skipped: true, reason: 'Already responded' };
    }

    // Enviar SMS
    const content = `Hola ${message.patient.name}, aún esperamos tu opinión sobre tu última visita. ¿Podrías calificarla del 1 al 5? Gracias!`;

    await this.twilioService.sendSMS({
      to: message.patient.phone,
      body: content,
    });

    // Actualizar message
    await this.prisma.message.update({
      where: { id: messageId },
      data: { reminderSentAt: new Date() },
    });

    return { sent: true, to: message.patient.phone };
  }
}
```

**Paso 4: Registrar el Processor**

```typescript
// apps/worker/src/worker.module.ts
import { SendReminderProcessor } from './processors/send-reminder.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'messages' })],
  providers: [SendReminderProcessor],
})
export class WorkerModule {}
```

**Paso 5: Agregar test**

```typescript
// apps/worker/src/processors/send-reminder.processor.spec.ts
describe('SendReminderProcessor', () => {
  it('should send reminder if no response', async () => {
    const job = {
      data: {
        messageId: 'msg-1',
        patientId: 'patient-1',
        campaignId: 'campaign-1',
        workspaceId: 'workspace-1',
      },
    } as Job<SendReminderJobPayload>;

    const result = await processor.process(job);

    expect(result.sent).toBe(true);
    expect(twilioService.sendSMS).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '+593999999999',
      }),
    );
  });

  it('should skip if already responded', async () => {
    // Mock message con rating
    prisma.message.findUnique.mockResolvedValue({
      id: 'msg-1',
      rating: 5,
    });

    const result = await processor.process(job);

    expect(result.skipped).toBe(true);
    expect(twilioService.sendSMS).not.toHaveBeenCalled();
  });
});
```

---

### 4. Actualizar el Schema de Prisma

**Siempre seguir este orden**:

1. **Editar `schema.prisma`**
2. **Crear migración**: `pnpm prisma:migrate --name descriptive_name`
3. **Actualizar DTOs** en `libs/shared-types`
4. **Actualizar Services/Controllers** que usen el modelo
5. **Actualizar Frontend** si es necesario
6. **Ejecutar tests**
7. **Commit**

**Ejemplo: Agregar campo `isActive` a Template**

```bash
# 1. Editar schema
vim libs/database/prisma/schema.prisma

# 2. Migrar
pnpm prisma:migrate --name add_template_is_active

# 3. Ver cambios en DB
pnpm prisma:studio

# 4. Actualizar código dependiente
# (Services, DTOs, Frontend)

# 5. Test
pnpm nx test api

# 6. Commit
git add .
git commit -m "feat(templates): add isActive field"
```

---

## Estructura del Código

### Apps

```
apps/
├── web/                        # Next.js 15 (Frontend)
│   ├── app/
│   │   ├── (auth)/            # Auth pages (login, register)
│   │   ├── (dashboard)/       # Protected pages
│   │   │   ├── campaigns/
│   │   │   ├── patients/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── campaigns/         # Campaign-specific components
│   │   ├── patients/
│   │   └── shared/            # Reusable components
│   └── lib/
│       ├── api/               # API client functions
│       ├── hooks/             # Custom React hooks
│       └── utils/             # Frontend utils
│
├── api/                        # NestJS (Backend)
│   └── src/
│       ├── auth/              # Better Auth integration
│       ├── workspaces/        # Workspace CRUD
│       ├── campaigns/         # Campaign management
│       ├── patients/          # Patient CRUD
│       ├── messages/          # Message handling
│       ├── webhooks/          # Twilio/WhatsApp webhooks
│       ├── analytics/         # Stats endpoints
│       ├── billing/           # Credits & Stripe
│       └── common/
│           ├── guards/        # Auth, Workspace guards
│           ├── decorators/    # Custom decorators
│           └── filters/       # Exception filters
│
└── worker/                     # NestJS Worker (Background jobs)
    └── src/
        └── processors/
            ├── send-initial-message.processor.ts
            ├── send-followup.processor.ts
            ├── handle-response.processor.ts
            └── send-reminder.processor.ts
```

### Libs

```
libs/
├── database/
│   ├── prisma/
│   │   ├── schema.prisma      # Single source of truth
│   │   ├── migrations/
│   │   └── seed.ts
│   └── src/
│       └── client.ts          # PrismaClient singleton
│
├── shared-types/              # TypeScript types compartidos
│   └── src/
│       ├── dtos/              # Zod schemas + inferred types
│       ├── enums/             # Enums comunes
│       └── interfaces/        # Interfaces
│
├── shared-utils/              # Utils sin dependencias pesadas
│   └── src/
│       ├── validators/        # Validaciones comunes
│       ├── formatters/        # Format phone, date, etc.
│       └── helpers/
│
└── integrations/              # Wrappers de APIs externas
    ├── twilio/
    ├── whatsapp/
    ├── sendgrid/
    └── stripe/
```

---

## Convenciones

### Naming

**Files**: `kebab-case.extension`

```
create-campaign.dto.ts
send-message.service.ts
workspace.guard.ts
```

**Classes**: `PascalCase`

```typescript
CreateCampaignDto;
SendMessageService;
WorkspaceGuard;
```

**Functions**: `camelCase` (start with verb)

```typescript
createCampaign();
sendMessage();
validatePhone();
```

**Constants**: `SCREAMING_SNAKE_CASE`

```typescript
const MAX_RETRIES = 3;
const DEFAULT_DELAY_HOURS = 2;
```

**Interfaces**: `PascalCase` (no "I" prefix)

```typescript
interface Campaign {
  /* ... */
}
interface User {
  /* ... */
}
```

### Imports

**Order** (eslint enforced):

```typescript
// 1. External packages
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

// 2. Internal libs
import { PrismaService } from '@reputation-manager/database';
import { CreateCampaignDto } from '@reputation-manager/shared-types';

// 3. Relative imports
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { CampaignRepository } from './campaign.repository';
```

### DTOs con Zod

**Siempre en `libs/shared-types`**:

```typescript
// libs/shared-types/src/dtos/campaign.dto.ts
import { z } from 'zod';

// Schema (para validación)
export const CreateCampaignSchema = z.object({
  workspaceId: z.string().cuid(),
  practiceId: z.string().cuid(),
  name: z.string().min(3).max(100),
  scheduledHoursAfter: z.number().min(1).max(48).default(2),
});

// Type (para TypeScript)
export type CreateCampaignDto = z.infer<typeof CreateCampaignSchema>;
```

**Uso en NestJS**:

```typescript
import { CreateCampaignSchema, CreateCampaignDto } from '@reputation-manager/shared-types';

@Post()
async create(@Body() dto: CreateCampaignDto) {
  // Validar con Zod
  const validated = CreateCampaignSchema.parse(dto);
  return this.service.create(validated);
}
```

### Repository Pattern

```typescript
// campaign.repository.ts
@Injectable()
export class CampaignRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string, workspaceId: string) {
    return this.prisma.campaign.findUnique({
      where: { id, workspaceId },
    });
  }

  async findByWorkspace(workspaceId: string) {
    return this.prisma.campaign.findMany({
      where: { workspaceId },
    });
  }
}

// campaign.service.ts
@Injectable()
export class CampaignService {
  constructor(private repository: CampaignRepository) {}

  async getCampaign(id: string, workspaceId: string) {
    return this.repository.findById(id, workspaceId);
  }
}
```

### Error Handling

**Backend**:

```typescript
import { NotFoundException, BadRequestException } from '@nestjs/common';

async findCampaign(id: string, workspaceId: string) {
  const campaign = await this.prisma.campaign.findUnique({
    where: { id, workspaceId },
  });

  if (!campaign) {
    throw new NotFoundException('Campaign not found');
  }

  return campaign;
}
```

**Frontend**:

```typescript
try {
  const campaign = await getCampaign(id);
  return campaign;
} catch (error) {
  if (error instanceof Error) {
    toast.error(error.message);
  }
  throw error;
}
```

---

## Testing

### Unit Tests

**Service Example**:

```typescript
// campaign.service.spec.ts
describe('CampaignService', () => {
  let service: CampaignService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CampaignService,
        {
          provide: PrismaService,
          useValue: {
            campaign: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(CampaignService);
    prisma = module.get(PrismaService);
  });

  it('should create campaign', async () => {
    const dto: CreateCampaignDto = {
      workspaceId: 'workspace-1',
      practiceId: 'practice-1',
      name: 'Campaign Test',
      scheduledHoursAfter: 2,
    };

    prisma.campaign.create.mockResolvedValue({
      id: 'campaign-1',
      ...dto,
    });

    const result = await service.create(dto);

    expect(result.id).toBe('campaign-1');
    expect(prisma.campaign.create).toHaveBeenCalledWith({
      data: dto,
    });
  });
});
```

**Ejecutar**:

```bash
pnpm nx test api                    # Todos los tests del API
pnpm nx test api --watch            # Watch mode
pnpm nx test api --coverage         # Con coverage
pnpm nx test api --testFile=campaign # Solo campaign tests
```

### Integration Tests

```typescript
// campaign.controller.e2e-spec.ts
describe('CampaignController (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    // Login to get token
    const loginRes = await request(app.getHttpServer()).post('/auth/login').send({ email: 'test@test.com', password: 'test123' });

    token = loginRes.body.accessToken;
  });

  it('POST /campaigns should create campaign', async () => {
    const dto: CreateCampaignDto = {
      workspaceId: 'workspace-1',
      practiceId: 'practice-1',
      name: 'Test Campaign',
      scheduledHoursAfter: 2,
    };

    const response = await request(app.getHttpServer()).post('/campaigns').set('Authorization', `Bearer ${token}`).send(dto).expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: dto.name,
    });
  });
});
```

### Frontend Tests

```typescript
// campaign-form.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CampaignForm } from './campaign-form';

describe('CampaignForm', () => {
  it('should render form fields', () => {
    render(<CampaignForm />);

    expect(screen.getByLabelText('Campaign Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Practice')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<CampaignForm />);

    fireEvent.click(screen.getByText('Create Campaign'));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
  });
});
```

---

## Debugging

### Backend (NestJS)

**Opción 1: Console logs**

```typescript
console.log('Campaign:', campaign);
console.error('Error creating campaign:', error);
```

**Opción 2: VS Code Debugger**

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["nx", "serve", "api"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    }
  ]
}
```

Agregar breakpoints y presionar F5.

**Opción 3: Logs estructurados**

```typescript
import { Logger } from '@nestjs/common';

export class CampaignService {
  private logger = new Logger(CampaignService.name);

  async create(dto: CreateCampaignDto) {
    this.logger.log(`Creating campaign: ${dto.name}`);

    try {
      const campaign = await this.prisma.campaign.create({ data: dto });
      this.logger.log(`Campaign created: ${campaign.id}`);
      return campaign;
    } catch (error) {
      this.logger.error('Failed to create campaign', error.stack);
      throw error;
    }
  }
}
```

### Frontend (Next.js)

**Opción 1: React DevTools**

- Instala extensión de Chrome
- Inspecciona componentes y state

**Opción 2: Console logs**

```typescript
console.log('Campaign data:', campaign);
console.table(patients);
```

**Opción 3: Network tab**

- Abre DevTools → Network
- Filtra por XHR/Fetch
- Inspecciona requests/responses

### Worker (BullMQ)

**Ver jobs en BullMQ Dashboard**:

```
http://localhost:3000/admin/queues
```

**Logs del worker**:

```bash
docker-compose logs -f worker
```

**Debugging de un job específico**:

```typescript
// send-initial-message.processor.ts
async process(job: Job<SendInitialMessagePayload>) {
  console.log('[SendInitialMessage] Processing job:', job.id);
  console.log('[SendInitialMessage] Payload:', job.data);

  try {
    // ... proceso
    console.log('[SendInitialMessage] Success');
  } catch (error) {
    console.error('[SendInitialMessage] Error:', error);
    throw error; // Re-throw para que BullMQ lo maneje
  }
}
```

### Database

**Prisma Studio**:

```bash
pnpm prisma:studio
```

**Raw SQL en desarrollo**:

```typescript
const result = await this.prisma.$queryRaw`
  SELECT * FROM "Campaign" WHERE "workspaceId" = ${workspaceId}
`;
console.log(result);
```

**Enable query logging**:

```typescript
// libs/database/src/client.ts
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

---

## Git Workflow

### Branch Strategy

```
main           # Producción (protected)
  └── develop  # Development (protected)
       ├── feature/add-specialty
       ├── feature/analytics-dashboard
       ├── fix/sms-encoding
       └── refactor/auth-migration
```

### Conventional Commits

```bash
# Features
git commit -m "feat(campaigns): add CSV upload"
git commit -m "feat(analytics): add NPS calculation"

# Fixes
git commit -m "fix(worker): handle Twilio timeout"
git commit -m "fix(auth): correct Google OAuth redirect"

# Refactors
git commit -m "refactor(database): migrate to Prisma"
git commit -m "refactor(api): extract repository pattern"

# Docs
git commit -m "docs(setup): add Railway deployment"
git commit -m "docs(api): update endpoint documentation"

# Tests
git commit -m "test(campaigns): add e2e tests"

# Chores
git commit -m "chore(deps): update Next.js to 15.1"
```

### Pull Request Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation
- [ ] Other

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist

- [ ] Code follows project conventions
- [ ] Self-review performed
- [ ] No console.logs left
- [ ] Documentation updated
- [ ] All tests pass

## Screenshots (if applicable)

## Related Issues

Closes #123
```

---

## Code Review

### Checklist for Reviewers

**Funcionalidad**:

- [ ] El código hace lo que dice hacer
- [ ] No hay edge cases sin manejar
- [ ] Errores son manejados correctamente

**Multi-tenancy**:

- [ ] Todos los queries filtran por `workspaceId`
- [ ] No hay data leaks entre workspaces

**Seguridad**:

- [ ] Input validation presente
- [ ] No hay SQL injection risks
- [ ] Secrets no están hardcoded

**Testing**:

- [ ] Tests incluidos
- [ ] Coverage adecuado
- [ ] Tests pasan

**Código**:

- [ ] Sigue convenciones del proyecto
- [ ] Nombres descriptivos
- [ ] Funciones pequeñas (< 50 líneas)
- [ ] No hay código duplicado

**Performance**:

- [ ] No hay N+1 queries
- [ ] Indexes necesarios agregados
- [ ] Paginación implementada donde corresponde

### CodeRabbit

CodeRabbit revisará automáticamente:

- Bugs potenciales
- Security issues
- Performance problems
- Code style
- Test coverage

**Responder a CodeRabbit**:

```
@coderabbit: Thanks for the review! Fixed the N+1 query issue.
```

---

## Comandos Útiles

```bash
# Desarrollo
pnpm dev                          # Todo
pnpm nx serve web                 # Frontend solo
pnpm nx serve api                 # API solo
pnpm nx serve worker              # Worker solo

# Testing
pnpm test                         # All tests
pnpm nx test api --watch          # Watch mode
pnpm nx test api --coverage       # Coverage report
pnpm nx affected:test             # Only affected by changes

# Linting
pnpm lint                         # Lint all
pnpm lint:fix                     # Auto-fix
pnpm format                       # Format with Prettier

# Database
pnpm prisma:studio                # UI
pnpm prisma:migrate --name foo    # New migration
pnpm prisma:seed                  # Seed data
pnpm prisma:reset                 # Reset (⚠️ drops all data)

# Build
pnpm build                        # Build all
pnpm nx build web                 # Build frontend
pnpm nx build api                 # Build API

# Nx utilities
pnpm nx graph                     # Dependency graph
pnpm nx affected:graph            # Affected graph
pnpm nx list                      # List projects
pnpm nx reset                     # Clear cache

# Docker
docker-compose up -d              # Start services
docker-compose down               # Stop services
docker-compose logs -f api        # View logs
docker-compose ps                 # Status
```

---

## Performance Tips

### Backend

**1. Use select/include judiciously**

```typescript
// ❌ Fetches all fields
const campaigns = await prisma.campaign.findMany();

// ✅ Only needed fields
const campaigns = await prisma.campaign.findMany({
  select: {
    id: true,
    name: true,
    createdAt: true,
  },
});
```

**2. Paginate large result sets**

```typescript
async findAll(workspaceId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  return this.prisma.campaign.findMany({
    where: { workspaceId },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}
```

**3. Use transactions for multiple operations**

```typescript
await this.prisma.$transaction(async (tx) => {
  const campaign = await tx.campaign.create({ data: campaignDto });
  await tx.patient.createMany({ data: patients });
  return campaign;
});
```

### Frontend

**1. Use React.memo for expensive components**

```typescript
export const PatientList = React.memo(({ patients }: Props) => {
  return <div>{/* ... */}</div>;
});
```

**2. Debounce search inputs**

```typescript
const debouncedSearch = useMemo(() => debounce((value: string) => setSearchTerm(value), 300), []);
```

**3. Use TanStack Query for caching**

```typescript
const { data: campaigns } = useQuery({
  queryKey: ['campaigns', workspaceId],
  queryFn: () => getCampaigns(workspaceId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

---

## Siguientes Pasos

- **Implementación**: Comienza con `docs/ROADMAP.md` para ver el plan detallado
- **Deployment**: Ve `docs/DEPLOYMENT.md` (próximamente)
- **Troubleshooting**: Ve `docs/SETUP.md#troubleshooting`

---

**Última actualización**: 2025-11-15  
**Versión**: 1.0.0
