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
- `workspaceId`: (se llena automáticamente al crear workspace)
- `userId`: (manual)

**Nota**: No necesitas `authToken` porque Better Auth usa cookies.

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

Auth → Sign In

```

Las cookies de sesión se manejan automáticamente.
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

````

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

**Better Auth usa cookies** para manejar la autenticación, no Bearer tokens.

### Configuración Importante en Postman:

1. Ve a **Settings** (⚙️) → **General**
2. Asegúrate de que **"Automatically follow redirects"** esté activado
3. Asegúrate de que **"Enable cookie jar"** esté activado (crucial)

### Cómo funciona:

1. Haces **Sign In** o **Sign Up**
2. Better Auth devuelve una cookie de sesión automáticamente
3. Postman guarda la cookie en el Cookie Jar
4. Todos los requests subsecuentes envían la cookie automáticamente

**No necesitas copiar/pegar tokens manualmente.**

## 🎯 Tests Automáticos

La colección incluye un test que:

1. **Create Workspace**: Guarda el `workspaceId` en `{{workspaceId}}`

Las cookies de sesión se manejan automáticamente por Postman.
## 🐛 Troubleshooting

### Error: "404 Not Found" en /api/auth/sign-in/email

**Solución**: El servidor NestJS debe estar corriendo. Verifica:

```bash
# En la raíz del proyecto
pnpm dev
````

Asegúrate de ver: `🚀 API is running on: http://localhost:3000`

### Error: "Unauthorized" en endpoints protegidos

**Causas posibles**:

1. **No hiciste login**: Ejecuta primero `Auth → Sign In`
2. **Cookie Jar deshabilitado**:
   - Ve a Settings (⚙️) → General
   - Activa "Enable cookie jar"
3. **Sesión expirada**: Las sesiones duran 7 días. Vuelve a hacer login.

### Verificar cookies manualmente:

1. Después de hacer login, ve a **Cookies** (debajo de Send)
2. Deberías ver cookies para `localhost:3000`
3. Si no hay cookies, el login falló

### Error: "Workspace not found"

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
