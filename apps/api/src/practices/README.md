# Practices Module

## Descripción

El módulo de **Practices** gestiona las ubicaciones físicas (consultorios, clínicas) dentro de un workspace. Cada practice representa un lugar donde se atienden pacientes y puede tener su propio link de Google Reviews.

## Características

- ✅ CRUD completo de practices
- ✅ Scoped por workspace (multi-tenancy)
- ✅ Integración con Google Places para reviews
- ✅ Control de permisos por rol
- ✅ Ordenamiento por fecha de creación

## Modelo de Datos

```prisma
model Practice {
  id               String   @id @default(cuid())
  name             String
  address          String?
  phone            String?
  googlePlaceId    String?  // Para reviews de Google
  workspaceId      String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  workspace        Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  campaigns        Campaign[]
}
```

## Endpoints

### 1. Listar practices

```http
GET /api/workspaces/:workspaceId/practices
```

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros:**
- `workspaceId`: ID del workspace

**Respuesta:**
```json
[
  {
    "id": "clx456...",
    "name": "Consultorio Centro",
    "address": "Av. 10 de Agosto N45-123, Quito",
    "phone": "+593987654321",
    "googlePlaceId": "ChIJ...",
    "workspaceId": "clx123...",
    "createdAt": "2025-11-20T10:00:00Z",
    "updatedAt": "2025-11-20T10:00:00Z"
  },
  {
    "id": "clx789...",
    "name": "Consultorio Norte",
    "address": "Av. Shyris N36-456, Quito",
    "phone": "+593987654322",
    "googlePlaceId": "ChIK...",
    "workspaceId": "clx123...",
    "createdAt": "2025-11-15T10:00:00Z",
    "updatedAt": "2025-11-15T10:00:00Z"
  }
]
```

**Descripción:** Retorna todas las practices del workspace ordenadas por fecha de creación (más recientes primero).

**Permisos:** Cualquier miembro del workspace

---

### 2. Crear practice

```http
POST /api/workspaces/:workspaceId/practices
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Parámetros:**
- `workspaceId`: ID del workspace

**Body:**
```json
{
  "name": "Consultorio Sur",
  "address": "Av. Mariscal Sucre S12-345, Quito",
  "phone": "+593987654323",
  "googlePlaceId": "ChIL..."
}
```

**Validaciones:**
- `name`: Requerido, string (3-100 caracteres)
- `address`: Opcional, string
- `phone`: Opcional, string
- `googlePlaceId`: Opcional, string (ID de Google Places)

**Respuesta:**
```json
{
  "id": "clx999...",
  "name": "Consultorio Sur",
  "address": "Av. Mariscal Sucre S12-345, Quito",
  "phone": "+593987654323",
  "googlePlaceId": "ChIL...",
  "workspaceId": "clx123...",
  "createdAt": "2025-11-27T15:30:00Z",
  "updatedAt": "2025-11-27T15:30:00Z"
}
```

**Permisos:** OWNER o DOCTOR

**Errores:**
- `403 Forbidden`: Usuario es RECEPTIONIST

---

### 3. Obtener practice

```http
GET /api/practices/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros:**
- `id`: ID de la practice

**Respuesta:**
```json
{
  "id": "clx456...",
  "name": "Consultorio Centro",
  "address": "Av. 10 de Agosto N45-123, Quito",
  "phone": "+593987654321",
  "googlePlaceId": "ChIJ...",
  "workspaceId": "clx123...",
  "createdAt": "2025-11-20T10:00:00Z",
  "updatedAt": "2025-11-20T10:00:00Z"
}
```

**Permisos:** Solo usuarios del workspace al que pertenece la practice

**Errores:**
- `404 Not Found`: "Práctica no encontrada"

---

### 4. Actualizar practice

```http
PUT /api/practices/:id
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Parámetros:**
- `id`: ID de la practice

**Body:**
```json
{
  "name": "Consultorio Centro - Actualizado",
  "phone": "+593987654399"
}
```

**Validaciones:**
- Todos los campos son opcionales
- `name`: string (3-100 caracteres)
- `address`: string
- `phone`: string
- `googlePlaceId`: string

**Respuesta:**
```json
{
  "id": "clx456...",
  "name": "Consultorio Centro - Actualizado",
  "address": "Av. 10 de Agosto N45-123, Quito",
  "phone": "+593987654399",
  "googlePlaceId": "ChIJ...",
  "workspaceId": "clx123...",
  "createdAt": "2025-11-20T10:00:00Z",
  "updatedAt": "2025-11-27T16:00:00Z"
}
```

**Permisos:** OWNER o DOCTOR

**Errores:**
- `403 Forbidden`: Usuario es RECEPTIONIST o no pertenece al workspace
- `404 Not Found`: Practice no existe

---

### 5. Eliminar practice

```http
DELETE /api/practices/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

**Parámetros:**
- `id`: ID de la practice

**Respuesta:**
```
204 No Content
```

**Permisos:** Solo OWNER

**Errores:**
- `403 Forbidden`: Usuario no es OWNER o no pertenece al workspace
- `404 Not Found`: Practice no existe

---

## Roles y Permisos

| Acción | OWNER | DOCTOR | RECEPTIONIST |
|--------|-------|--------|--------------|
| Listar practices | ✅ | ✅ | ✅ |
| Ver practice | ✅ | ✅ | ✅ |
| Crear practice | ✅ | ✅ | ❌ |
| Actualizar practice | ✅ | ✅ | ❌ |
| Eliminar practice | ✅ | ❌ | ❌ |

## Limitaciones por Plan

| Plan | Máximo de Practices |
|------|-------------------|
| FREE | 1 |
| STARTER | 1 |
| PROFESSIONAL | 5 |
| ENTERPRISE | Ilimitado |

> **Nota:** Las validaciones de límites por plan se implementarán en el módulo de Billing.

## Google Places Integration

### Obtener Google Place ID

1. Ir a [Google Maps](https://www.google.com/maps)
2. Buscar tu consultorio
3. Click derecho en el marcador → "¿Qué hay aquí?"
4. Copiar el Place ID de la URL o usar [Place ID Finder](https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder)

### Ejemplo de Place ID
```
ChIJN1t_tDeuEmsRUsoyG83frY4
```

### Uso en Google Reviews

El `googlePlaceId` se usa para generar el link directo a dejar reseña:

```
https://search.google.com/local/writereview?placeid={googlePlaceId}
```

## Ejemplos de Uso

### Crear primera practice

```bash
curl -X POST http://localhost:3000/api/workspaces/clx123.../practices \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Consultorio Principal",
    "address": "Av. Amazonas N24-155, Quito",
    "phone": "+593987654321",
    "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4"
  }'
```

### Actualizar solo teléfono

```bash
curl -X PUT http://localhost:3000/api/practices/clx456... \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+593999888777"
  }'
```

### Eliminar practice (solo OWNER)

```bash
curl -X DELETE http://localhost:3000/api/practices/clx456... \
  -H "Authorization: Bearer eyJhbGc..."
```

## Testing

Ejecutar tests unitarios:

```bash
pnpm nx test api --testFile=practices.service.spec.ts
```

**Cobertura:** 8/8 tests pasando (100%)

## Arquitectura

```
PracticesController
    ↓
PracticesService
    ↓
PrismaService
    ↓
PostgreSQL (practice table)
```

## Guards Aplicados

- `BetterAuthGuard`: Verifica autenticación
- `WorkspaceGuard`: Valida membresía en workspace
- `RoleGuard`: Valida permisos de rol
  - CREATE/UPDATE: OWNER o DOCTOR
  - DELETE: Solo OWNER

## Relaciones

### Practices → Campaigns

Una practice puede tener múltiples campañas:

```typescript
// GET /api/practices/:id?include=campaigns
{
  "id": "clx456...",
  "name": "Consultorio Centro",
  "campaigns": [
    {
      "id": "camp-1",
      "name": "Pacientes Diciembre 2025",
      "status": "ACTIVE"
    }
  ]
}
```

## Próximos Pasos

- [ ] Validar límites por plan (FREE: 1, PROFESSIONAL: 5)
- [ ] Validar formato de `googlePlaceId`
- [ ] Auto-detectar Place ID desde dirección
- [ ] Integración con Google My Business API
- [ ] Estadísticas de reviews por practice
