# Backend Integration - Paso 2 Completado ✅

## Resumen

La integración frontend-backend está completa. El sistema ahora puede comunicarse con el API de NestJS.

## Componentes Creados

### Services (Capa de API)

1. **`campaign.service.ts`** - CRUD para campañas
   - `getAll()` - Listar campañas
   - `getById()` - Obtener campaña por ID
   - `create()` - Crear nueva campaña
   - `update()` - Actualizar campaña
   - `delete()` - Eliminar campaña
   - `uploadCsv()` - Subir archivo CSV de pacientes

2. **`template.service.ts`** - CRUD para plantillas de mensajes
   - `getAll()` - Listar plantillas
   - `getById()` - Obtener plantilla por ID
   - `create()` - Crear nueva plantilla
   - `update()` - Actualizar plantilla
   - `delete()` - Eliminar plantilla
   - `duplicate()` - Duplicar plantilla existente

### React Query Hooks

1. **`use-campaigns.ts`** - Hooks para manejo de campañas
   - `useCampaigns()` - Query para listar
   - `useCampaign()` - Query para obtener una
   - `useCreateCampaign()` - Mutation para crear
   - `useUpdateCampaign()` - Mutation para actualizar
   - `useDeleteCampaign()` - Mutation para eliminar
   - `useUploadCsv()` - Mutation para subir CSV

2. **`use-templates.ts`** - Hooks para manejo de plantillas
   - `useTemplates()` - Query para listar
   - `useTemplate()` - Query para obtener una
   - `useCreateTemplate()` - Mutation para crear
   - `useUpdateTemplate()` - Mutation para actualizar
   - `useDeleteTemplate()` - Mutation para eliminar
   - `useDuplicateTemplate()` - Mutation para duplicar

### Componentes de UI

1. **`api-connection-status.tsx`** - Monitor de conexión con el API
   - Se muestra solo cuando hay problemas
   - Auto-refresh cada 30 segundos
   - Indicador visual de estado (connecting, connected, error, disconnected)

### Mejoras en el Backend

1. **Endpoint `/api/health`** agregado en `app.controller.ts`
   - Retorna status, timestamp, uptime
   - Usado para verificar que el API está vivo

## Estructura de Archivos

```
apps/web/
├── services/
│   ├── workspace.service.ts    ✅ (existía)
│   ├── user.service.ts          ✅ (existía)
│   ├── practice.service.ts      ✅ (existía)
│   ├── campaign.service.ts      🆕 (nuevo)
│   └── template.service.ts      🆕 (nuevo)
│
├── hooks/
│   ├── use-workspaces.ts        ✅ (existía)
│   ├── use-users.ts             ✅ (existía)
│   ├── use-practices.ts         ✅ (existía)
│   ├── use-campaigns.ts         🆕 (nuevo)
│   └── use-templates.ts         🆕 (nuevo)
│
├── components/
│   ├── api-connection-status.tsx 🆕 (nuevo)
│   └── ...
│
└── lib/
    ├── api-client.ts            ✅ (existía)
    └── auth-client.ts           ✅ (existía)
```

## Configuración

### Variables de Entorno

**Frontend** (`apps/web/.env.local`):

```env
PORT=4000
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Backend** (`.env`):

```env
# Debe tener configurado:
PORT=3000
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
# etc...
```

## Cómo Usar

### 1. Levantar el Backend

```bash
# Terminal 1
pnpm nx serve api
```

El API debe estar corriendo en `http://localhost:3000`

### 2. Levantar el Frontend

```bash
# Terminal 2
pnpm nx serve web
```

El frontend debe estar corriendo en `http://localhost:4000`

### 3. Verificar Conexión

Abre `http://localhost:4000` y deberías ver:

- **Sin mensaje**: El API está conectado ✅
- **Mensaje amarillo/rojo**: Hay problemas de conexión ⚠️

### 4. Ejemplo de Uso en Componentes

```tsx
'use client';

import { useCampaigns, useCreateCampaign } from '@/hooks/use-campaigns';

export function CampaignsPage() {
  const workspaceId = 'clxxxxx'; // Obtener del contexto/auth
  const { data: campaigns, isLoading } = useCampaigns(workspaceId);
  const createMutation = useCreateCampaign(workspaceId);

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      practiceId: 'clxxxxx',
      name: 'Nueva Campaña',
      patients: [
        {
          name: 'Juan Pérez',
          phone: '+593987654321',
          appointmentTime: '2025-01-15T10:00:00Z',
          hasConsent: true,
        },
      ],
    });
  };

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div>
      <button onClick={handleCreate}>Crear Campaña</button>
      {campaigns?.map((campaign) => (
        <div key={campaign.id}>{campaign.name}</div>
      ))}
    </div>
  );
}
```

## Próximos Pasos

1. **Implementar los controladores faltantes en el backend**:
   - `apps/api/src/campaigns/campaigns.controller.ts`
   - `apps/api/src/templates/templates.controller.ts`

2. **Conectar las páginas del dashboard**:
   - `apps/web/app/(dashboard)/dashboard/campaigns/page.tsx`
   - `apps/web/app/(dashboard)/dashboard/templates/page.tsx`
   - `apps/web/app/(dashboard)/dashboard/practices/page.tsx`

3. **Manejo de errores global**:
   - Implementar error boundaries
   - Mejorar mensajes de error en toasts

4. **Testing**:
   - Tests unitarios para services
   - Tests de integración para hooks

## Troubleshooting

### Error: "No se puede conectar al API"

1. Verificar que el backend esté corriendo: `pnpm nx serve api`
2. Verificar la URL en `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:3000`
3. Verificar CORS en `apps/api/src/main.ts` incluye `http://localhost:4000`

### Error: "401 Unauthorized"

1. Verificar que el usuario esté logueado
2. Verificar que el token de Better Auth sea válido
3. Revisar `lib/api-client.ts` → `getAuthHeaders()`

### Error: "404 Not Found"

1. Verificar que el endpoint existe en el backend
2. Verificar el prefijo `/api` en la URL
3. Revisar la consola del backend para ver las rutas registradas

## Checklist de Integración

- ✅ API client con autenticación (`api-client.ts`)
- ✅ Services para todas las entidades
- ✅ React Query hooks con mutations
- ✅ Toast notifications con Sonner
- ✅ Monitor de conexión (`ApiConnectionStatus`)
- ✅ Health check endpoint (`/api/health`)
- ✅ CORS configurado
- ✅ Variables de entorno
- ⏳ Controladores del backend (campaigns, templates)
- ⏳ Páginas conectadas al API
- ⏳ Error boundaries
- ⏳ Tests

---

**Última actualización**: 2025-01-15  
**Autor**: AI Assistant
