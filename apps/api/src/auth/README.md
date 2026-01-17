# Auth Module - Guía de Uso

## Configuración Completada ✅

El módulo de autenticación está completamente implementado con:

- ✅ Better Auth integrado
- ✅ Guards (AuthGuard, WorkspaceGuard, RoleGuard)
- ✅ Decoradores (@CurrentUser, @CurrentWorkspace, @CurrentRole)
- ✅ Endpoints de autenticación
- ✅ Tests unitarios
- ✅ Multi-tenancy funcional

## Estructura

```
apps/api/src/auth/
├── auth.config.ts              # Configuración Better Auth
├── auth.module.ts              # Módulo principal
├── auth.service.ts             # Lógica de negocio
├── auth.controller.ts          # Endpoints REST
├── auth.service.spec.ts        # Tests del servicio
├── decorators/
│   ├── current-user.decorator.ts
│   ├── current-workspace.decorator.ts
│   └── current-role.decorator.ts
├── guards/
│   ├── auth.guard.ts           # Verifica autenticación
│   ├── workspace.guard.ts      # Verifica acceso al workspace
│   ├── role.guard.ts           # Verifica roles
│   ├── workspace.guard.spec.ts
│   └── role.guard.spec.ts
└── dto/
    ├── register.dto.ts
    ├── login.dto.ts
    └── index.ts
```

## Endpoints Disponibles

### 1. Registro de Usuario

```bash
POST /auth/register
Content-Type: application/json

{
  "email": "doctor@example.com",
  "password": "password123",
  "name": "Dr. Juan Pérez"
}
```

**Respuesta:**

```json
{
  "user": {
    "id": "clx...",
    "email": "doctor@example.com",
    "name": "Dr. Juan Pérez"
  },
  "workspace": {
    "id": "clx...",
    "name": "Workspace de Dr. Juan Pérez",
    "plan": "FREE",
    "messageCredits": 50
  },
  "token": "..."
}
```

### 2. Login

Better Auth maneja el login directamente:

```bash
POST /api/auth/sign-in/email
Content-Type: application/json

{
  "email": "doctor@example.com",
  "password": "password123"
}
```

### 3. Obtener Usuario Actual

```bash
GET /auth/me
Cookie: better-auth.session_token=...

# Respuesta:
{
  "user": { ... },
  "session": { ... },
  "workspaces": [
    {
      "id": "...",
      "name": "...",
      "role": "OWNER"
    }
  ]
}
```

### 4. Logout

```bash
POST /auth/logout
Cookie: better-auth.session_token=...
```

## Uso en Controladores

### Ejemplo Básico: Solo Autenticación

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('profile')
export class ProfileController {
  @Get()
  @UseGuards(AuthGuard)
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
```

### Ejemplo Intermedio: Con Workspace

```typescript
import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';
import { User, Workspace } from '@prisma/client';

@Controller('workspaces/:workspaceId/campaigns')
@UseGuards(AuthGuard, WorkspaceGuard)
export class CampaignsController {
  @Get()
  async getCampaigns(@CurrentUser() user: User, @CurrentWorkspace() workspace: Workspace) {
    return {
      userId: user.id,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      campaigns: [], // TODO: implementar
    };
  }
}
```

### Ejemplo Avanzado: Con Roles

```typescript
import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RoleGuard, Roles } from '../auth/guards/role.guard';
import { CurrentWorkspace } from '../auth/decorators/current-workspace.decorator';
import { CurrentRole } from '../auth/decorators/current-role.decorator';
import { UserRole, Workspace } from '@prisma/client';

@Controller('workspaces/:workspaceId/settings')
@UseGuards(AuthGuard, WorkspaceGuard, RoleGuard)
export class SettingsController {
  @Post('invite')
  @Roles(UserRole.OWNER, UserRole.DOCTOR) // Solo OWNER y DOCTOR pueden invitar
  async inviteUser(@CurrentWorkspace() workspace: Workspace, @CurrentRole() role: UserRole, @Body() body: { email: string }) {
    return {
      workspaceId: workspace.id,
      inviterRole: role,
      invitedEmail: body.email,
      message: 'Usuario invitado',
    };
  }

  @Post('delete')
  @Roles(UserRole.OWNER) // Solo OWNER puede eliminar workspace
  async deleteWorkspace(@CurrentWorkspace('id') workspaceId: string) {
    return {
      workspaceId,
      message: 'Workspace eliminado',
    };
  }
}
```

## Decoradores

### @CurrentUser()

Extrae el usuario autenticado del request:

```typescript
// Usuario completo
@Get()
async getUser(@CurrentUser() user: User) { }

// Solo una propiedad
@Get()
async getEmail(@CurrentUser('email') email: string) { }
```

### @CurrentWorkspace()

Extrae el workspace del request (requiere WorkspaceGuard):

```typescript
// Workspace completo
@Get()
async getWorkspace(@CurrentWorkspace() workspace: Workspace) { }

// Solo una propiedad
@Get()
async getCredits(@CurrentWorkspace('messageCredits') credits: number) { }
```

### @CurrentRole()

Extrae el rol del usuario en el workspace actual:

```typescript
@Get()
async getRole(@CurrentRole() role: UserRole) {
  // role puede ser: OWNER, DOCTOR, RECEPTIONIST
}
```

## Guards

### AuthGuard

- **Propósito**: Verifica que el usuario esté autenticado
- **Uso**: Siempre primero en la cadena de guards
- **Adjunta al request**: `user`, `session`

### WorkspaceGuard

- **Propósito**: Verifica acceso al workspace
- **Requiere**: AuthGuard ejecutado primero
- **Lee workspaceId de**: `params.workspaceId`, `query.workspaceId`, o `body.workspaceId`
- **Adjunta al request**: `workspace`, `workspaceRole`

### RoleGuard

- **Propósito**: Verifica roles específicos
- **Requiere**: AuthGuard y WorkspaceGuard ejecutados primero
- **Uso**: Combinar con decorator `@Roles()`

```typescript
@Roles(UserRole.OWNER, UserRole.DOCTOR)
@UseGuards(AuthGuard, WorkspaceGuard, RoleGuard)
@Post()
async create() { }
```

## Jerarquía de Roles

```
OWNER > DOCTOR > RECEPTIONIST
```

- **OWNER**: Acceso completo, puede invitar/remover usuarios, cambiar plan
- **DOCTOR**: Puede crear campañas, ver analytics, gestionar pacientes
- **RECEPTIONIST**: Puede subir CSVs, ver campañas, no puede modificar settings

## Testing

Los tests ya están creados. Para ejecutarlos:

```bash
# Todos los tests del módulo auth
pnpm nx test api --testPathPattern=auth

# Test específico
pnpm nx test api --testPathPattern=auth.service.spec

# Con coverage
pnpm nx test api --testPathPattern=auth --coverage
```

## Próximos Pasos

### Fase 1 - Semana 3-4: Base UI & Workspace CRUD

**Frontend (apps/web):**

- [ ] Setup Better Auth client
- [ ] Crear páginas de login/register
- [ ] Protected layout wrapper
- [ ] Workspace management UI
- [ ] User management UI

**Backend adicional:**

- [ ] Workspace CRUD endpoints
- [ ] User management endpoints (invite, remove)
- [ ] Email invitations con SendGrid

### Ejemplo de Próximo Endpoint

```typescript
// apps/api/src/workspaces/workspaces.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard, WorkspaceGuard, RoleGuard, Roles } from '../auth';
import { UserRole } from '@prisma/client';

@Controller('workspaces')
@UseGuards(AuthGuard)
export class WorkspacesController {
  @Get()
  async getMyWorkspaces(@CurrentUser('id') userId: string) {
    // Listar workspaces del usuario
  }

  @Post()
  async createWorkspace(@Body() dto: CreateWorkspaceDto) {
    // Crear nuevo workspace
  }

  @Get(':workspaceId')
  @UseGuards(WorkspaceGuard)
  async getWorkspace(@CurrentWorkspace() workspace: Workspace) {
    return workspace;
  }

  @Put(':workspaceId')
  @UseGuards(WorkspaceGuard, RoleGuard)
  @Roles(UserRole.OWNER)
  async updateWorkspace(@Param('workspaceId') workspaceId: string, @Body() dto: UpdateWorkspaceDto) {
    // Solo OWNER puede actualizar
  }
}
```

## Variables de Entorno Requeridas

Asegúrate de tener en tu `.env`:

```bash
# Better Auth
BETTER_AUTH_SECRET=your-random-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/reputation_manager

# Node
NODE_ENV=development
```

## Recursos

- [Better Auth Docs](https://better-auth.com)
- [NestJS Guards](https://docs.nestjs.com/guards)
- [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)
