# Workspaces Module

## Descripción

El módulo de **Workspaces** gestiona los espacios de trabajo (tenants) en el sistema multi-tenant. Cada workspace representa una organización (consultorio, clínica) que puede tener múltiples usuarios, prácticas y campañas.

## Características

- ✅ CRUD completo de workspaces
- ✅ Multi-tenancy con aislamiento de datos
- ✅ Control de permisos basado en roles
- ✅ Gestión automática de membresía (WorkspaceUser)
- ✅ Validaciones de negocio (no eliminar con usuarios activos)

## Modelo de Datos

```prisma
model Workspace {
  id              String   @id @default(cuid())
  name            String
  plan            WorkspacePlan @default(FREE)
  messageCredits  Int      @default(50)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  workspaceUsers  WorkspaceUser[]
  practices       Practice[]
  campaigns       Campaign[]
  templates       Template[]
}

enum WorkspacePlan {
  FREE
  STARTER
  PROFESSIONAL
  ENTERPRISE
}
```

## Endpoints

### 1. Listar mis workspaces

```http
GET /api/workspaces
```

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
[
  {
    "workspace": {
      "id": "clx123...",
      "name": "Consultorio Norte",
      "plan": "STARTER",
      "messageCredits": 450,
      "createdAt": "2025-11-15T10:00:00Z",
      "updatedAt": "2025-11-15T10:00:00Z"
    },
    "role": "OWNER",
    "joinedAt": "2025-11-15T10:00:00Z"
  }
]
```

**Descripción:** Retorna todos los workspaces en los que el usuario autenticado participa, junto con su rol y fecha de ingreso.

---

### 2. Crear workspace

```http
POST /api/workspaces
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Mi Consultorio"
}
```

**Validaciones:**
- `name`: Requerido, string (3-100 caracteres)

**Respuesta:**
```json
{
  "id": "clx123...",
  "name": "Mi Consultorio",
  "plan": "FREE",
  "messageCredits": 50,
  "createdAt": "2025-11-27T15:30:00Z",
  "updatedAt": "2025-11-27T15:30:00Z"
}
```

**Descripción:** Crea un nuevo workspace y asigna automáticamente al usuario creador como **OWNER**.

---

### 3. Obtener workspace

```http
GET /api/workspaces/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros:**
- `id`: ID del workspace

**Respuesta:**
```json
{
  "id": "clx123...",
  "name": "Consultorio Norte",
  "plan": "STARTER",
  "messageCredits": 450,
  "createdAt": "2025-11-15T10:00:00Z",
  "updatedAt": "2025-11-15T10:00:00Z"
}
```

**Permisos:** Solo usuarios miembros del workspace pueden acceder.

**Errores:**
- `404 Not Found`: Workspace no existe o usuario no tiene acceso

---

### 4. Actualizar workspace

```http
PUT /api/workspaces/:id
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Parámetros:**
- `id`: ID del workspace

**Body:**
```json
{
  "name": "Consultorio Norte - Actualizado"
}
```

**Validaciones:**
- `name`: Opcional, string (3-100 caracteres)

**Respuesta:**
```json
{
  "id": "clx123...",
  "name": "Consultorio Norte - Actualizado",
  "plan": "STARTER",
  "messageCredits": 450,
  "createdAt": "2025-11-15T10:00:00Z",
  "updatedAt": "2025-11-27T16:00:00Z"
}
```

**Permisos:** Solo **OWNER**

**Errores:**
- `403 Forbidden`: Usuario no es OWNER
- `404 Not Found`: Workspace no existe

---

### 5. Eliminar workspace

```http
DELETE /api/workspaces/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros:**
- `id`: ID del workspace

**Respuesta:**
```
204 No Content
```

**Permisos:** Solo **OWNER**

**Validaciones de negocio:**
- No se puede eliminar un workspace con otros usuarios activos
- Primero debe remover a todos los usuarios excepto el OWNER que ejecuta la eliminación

**Errores:**
- `403 Forbidden`: Usuario no es OWNER
- `404 Not Found`: Workspace no existe
- `409 Conflict`: "No puedes eliminar un workspace con otros usuarios. Remuévelos primero."

---

## Roles y Permisos

| Acción | OWNER | DOCTOR | RECEPTIONIST |
|--------|-------|--------|--------------|
| Listar workspaces | ✅ Propios | ✅ Propios | ✅ Propios |
| Ver workspace | ✅ | ✅ | ✅ |
| Crear workspace | ✅ | ✅ | ✅ |
| Actualizar workspace | ✅ | ❌ | ❌ |
| Eliminar workspace | ✅ | ❌ | ❌ |

## Flujo de Creación

1. Usuario autenticado envía `POST /api/workspaces` con nombre
2. Sistema crea el workspace con plan FREE y 50 créditos
3. Sistema crea automáticamente un `WorkspaceUser` con rol OWNER
4. Usuario recibe el workspace creado

## Ejemplos de Uso

### Crear mi primer workspace

```bash
curl -X POST http://localhost:3001/api/workspaces \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Consultorio Dental ABC"
  }'
```

### Actualizar nombre

```bash
curl -X PUT http://localhost:3001/api/workspaces/clx123... \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Consultorio Dental ABC - Sucursal Centro"
  }'
```

### Intentar eliminar con usuarios activos (fallará)

```bash
curl -X DELETE http://localhost:3001/api/workspaces/clx123... \
  -H "Authorization: Bearer eyJhbGc..."

# Respuesta: 409 Conflict
# {
#   "statusCode": 409,
#   "message": "No puedes eliminar un workspace con otros usuarios. Remuévelos primero."
# }
```

## Testing

Ejecutar tests unitarios:

```bash
pnpm nx test api --testFile=workspaces.service.spec.ts
```

**Cobertura:** 9/9 tests pasando (100%)

## Arquitectura

```
WorkspacesController
    ↓
WorkspacesService
    ↓
PrismaService
    ↓
PostgreSQL (workspace, workspaceUser tables)
```

## Guards Aplicados

- `BetterAuthGuard`: Verifica autenticación
- `WorkspaceGuard`: Valida membresía en workspace (solo en endpoints que requieren :id)
- `RoleGuard`: Valida permisos de rol (UPDATE, DELETE requieren OWNER)

## Notas Importantes

- **Multi-tenancy**: Todos los recursos están scoped por `workspaceId`
- **Plan FREE**: 50 mensajes incluidos, 1 usuario, 1 location
- **Upgrade**: Cambiar `plan` y `messageCredits` se hará en módulo de Billing
- **Soft Delete**: No implementado (eliminación permanente)
