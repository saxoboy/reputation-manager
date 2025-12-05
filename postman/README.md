# Postman Collection - Reputation Manager API

## 📦 Archivos

- **`Reputation-Manager-API.postman_collection.json`**: Colección completa de endpoints
- **`Local.postman_environment.json`**: Environment para desarrollo local

## 🚀 Importar en Postman

### Opción 1: Importar por archivo

1. Abre Postman
2. Click en **Import** (arriba izquierda)
3. Arrastra los archivos JSON o selecciónalos
4. Click en **Import**

### Opción 2: Importar por URL (si está en GitHub)

1. Click en **Import**
2. Pega la URL del archivo raw de GitHub
3. Click en **Continue** → **Import**

## 🔧 Configuración Inicial

### 1. Seleccionar Environment

En Postman, selecciona el environment **"Reputation Manager - Local"** en el dropdown superior derecho.

### 2. Variables de Environment

El environment tiene estas variables pre-configuradas:

- `baseUrl`: `http://localhost:3000` (puerto del API)
- `authToken`: (se llena automáticamente al hacer login)
- `workspaceId`: (se llena automáticamente al crear workspace)
- `userId`: (manual)

## 📝 Flujo de Uso Recomendado

### 1. Autenticación

```
Auth → Sign Up
```

Crea una cuenta nueva con:

```json
{
  "email": "doctor@ejemplo.com",
  "password": "password123",
  "name": "Dr. Juan Pérez"
}
```

**O si ya tienes cuenta:**

```
Auth → Sign In
```

El token se guarda automáticamente en `{{authToken}}`.

### 2. Crear Workspace

```
Workspaces → Create Workspace
```

El `workspaceId` se guarda automáticamente.

### 3. Crear Practice

```
Practices → Create Practice
```

Usa el `{{workspaceId}}` que se guardó anteriormente.

### 4. Invitar Usuarios

```
Workspace Users → Invite User
```

## 📋 Endpoints Disponibles

### Auth (4 endpoints)

- ✅ `POST /api/auth/sign-up/email` - Registro
- ✅ `POST /api/auth/sign-in/email` - Login
- ✅ `GET /api/auth/get-session` - Obtener sesión
- ✅ `POST /api/auth/sign-out` - Logout

### Workspaces (5 endpoints)

- ✅ `GET /workspaces` - Listar mis workspaces
- ✅ `POST /workspaces` - Crear workspace
- ✅ `GET /workspaces/:id` - Ver workspace
- ✅ `PUT /workspaces/:id` - Actualizar (OWNER)
- ✅ `DELETE /workspaces/:id` - Eliminar (OWNER)

### Practices (5 endpoints)

- ✅ `GET /workspaces/:workspaceId/practices` - Listar
- ✅ `POST /workspaces/:workspaceId/practices` - Crear (OWNER/DOCTOR)
- ✅ `GET /practices/:id` - Ver
- ✅ `PUT /practices/:id` - Actualizar (OWNER/DOCTOR)
- ✅ `DELETE /practices/:id` - Eliminar (OWNER)

### Workspace Users (4 endpoints)

- ✅ `GET /workspaces/:workspaceId/users` - Listar
- ✅ `POST /workspaces/:workspaceId/users/invite` - Invitar (OWNER/DOCTOR)
- ✅ `PUT /workspaces/:workspaceId/users/:userId/role` - Cambiar rol (OWNER)
- ✅ `DELETE /workspaces/:workspaceId/users/:userId` - Remover

**Total: 18 endpoints**

## 🔐 Autenticación

Todos los endpoints (excepto Auth) requieren autenticación mediante Bearer Token.

La colección ya tiene configurado el auth a nivel de colección, por lo que el token se envía automáticamente en todos los requests.

## 🎯 Tests Automáticos

La colección incluye tests que:

1. **Login**: Guarda el token automáticamente en `{{authToken}}`
2. **Create Workspace**: Guarda el `workspaceId` en `{{workspaceId}}`

## 🐛 Troubleshooting

### Error: "Unauthorized"

- Verifica que hiciste login (`Auth → Sign In`)
- Revisa que `{{authToken}}` tiene un valor
- El token puede expirar después de 7 días

### Error: "Workspace not found"

- Verifica que `{{workspaceId}}` tiene un valor
- Crea un workspace primero

### Error: "Cannot connect to server"

- Verifica que el API esté corriendo: `pnpm dev`
- Revisa que `{{baseUrl}}` sea `http://localhost:3000`

## 📚 Documentación de Referencia

- **Workspaces**: `apps/api/src/workspaces/README.md`
- **Practices**: `apps/api/src/practices/README.md`
- **Workspace Users**: `apps/api/src/workspace-users/README.md`

## 🔄 Roles y Permisos

| Rol              | Permisos                                     |
| ---------------- | -------------------------------------------- |
| **OWNER**        | Acceso completo                              |
| **DOCTOR**       | Crear practices, invitar DOCTOR/RECEPTIONIST |
| **RECEPTIONIST** | Solo lectura                                 |

## 💡 Tips

1. Usa **Environment Quick Look** (👁️ icon) para ver los valores actuales
2. Los requests con auto-save están marcados con scripts en la pestaña "Tests"
3. Puedes duplicar el environment para crear uno de producción
