# Setup Guide - Reputation Manager

Esta guía te llevará paso a paso desde cero hasta tener el proyecto corriendo localmente.

---

## Tabla de Contenidos

1. [Prerequisitos](#prerequisitos)
2. [Instalación Inicial](#instalación-inicial)
3. [Configuración de Servicios](#configuración-de-servicios)
4. [Base de Datos](#base-de-datos)
5. [Verificación](#verificación)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisitos

### Software Requerido

| Software           | Versión Mínima | Instalación                                                  |
| ------------------ | -------------- | ------------------------------------------------------------ |
| **Node.js**        | 20.x LTS       | [nodejs.org](https://nodejs.org/)                            |
| **pnpm**           | 8.x            | `npm install -g pnpm`                                        |
| **Docker**         | 24.x           | [docker.com](https://www.docker.com/products/docker-desktop) |
| **Docker Compose** | 2.x            | Incluido con Docker Desktop                                  |
| **Git**            | 2.x            | [git-scm.com](https://git-scm.com/)                          |

### Verificar Instalaciones

```bash
node --version    # v20.x.x
pnpm --version    # 8.x.x
docker --version  # Docker version 24.x.x
git --version     # git version 2.x.x
```

### Cuentas Necesarias (para MVP completo)

- **GitHub** (control de versiones)
- **Twilio** (SMS) - [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
- **Google Cloud** (OAuth) - [console.cloud.google.com](https://console.cloud.google.com)
- **Stripe** (pagos, modo test) - [stripe.com](https://stripe.com)

> 💡 **Nota**: Puedes comenzar sin las cuentas externas y configurarlas después.

---

## Instalación Inicial

### 1. Clonar el Repositorio

```bash
cd ~/Documents/Proyectos
git clone https://github.com/saxoboy/reputation-manager.git
cd reputation-manager
```

### 2. Instalar Dependencias

```bash
pnpm install
```

Esto puede tomar 2-5 minutos dependiendo de tu conexión.

**Salida esperada**:

```
Progress: resolved 1234, reused 1234, downloaded 0, added 1234
Done in 2.3s
```

### 3. Copiar Variables de Entorno

```bash
cp .env.example .env
```

Abre `.env` con tu editor favorito:

```bash
code .env    # VS Code
vim .env     # Vim
nano .env    # Nano
```

---

## Configuración de Servicios

### Docker Compose

Levanta PostgreSQL y Redis localmente:

```bash
docker-compose up -d
```

**Verificar que estén corriendo**:

```bash
docker-compose ps
```

**Salida esperada**:

```
NAME                    STATUS    PORTS
reputation-postgres     Up        0.0.0.0:5432->5432/tcp
reputation-redis        Up        0.0.0.0:6379->6379/tcp
```

### Variables de Entorno Básicas

Edita `.env` con estos valores para desarrollo local:

```env
# === Node ===
NODE_ENV=development

# === Database ===
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/reputation_manager_dev?schema=public"

# === Redis ===
REDIS_URL="redis://localhost:6379"

# === Auth ===
BETTER_AUTH_SECRET="replace-with-random-32-char-string-minimum"
BETTER_AUTH_URL="http://localhost:3000"

# === API ===
API_PORT=3000
API_URL="http://localhost:3000"

# === Frontend ===
NEXT_PUBLIC_API_URL="http://localhost:3000"

# === Twilio (opcional por ahora) ===
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# === Google OAuth (opcional por ahora) ===
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# === Stripe (opcional por ahora) ===
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# === SendGrid (opcional por ahora) ===
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
```

### Generar Secrets

**Better Auth Secret** (requiere al menos 32 caracteres):

```bash
openssl rand -base64 32
```

Copia el resultado a `BETTER_AUTH_SECRET` en `.env`.

---

## Base de Datos

### 1. Ejecutar Migraciones

Crea las tablas en PostgreSQL:

```bash
pnpm prisma:migrate
```

**Salida esperada**:

```
Environment variables loaded from .env
Prisma schema loaded from libs/database/prisma/schema.prisma
Datasource "db": PostgreSQL database "reputation_manager_dev"

Applying migration `20250115000001_init`
Applying migration `20250115000002_add_templates`

✔ Generated Prisma Client to ./node_modules/@prisma/client

✅ Your database is now in sync with your schema.
```

### 2. Seed de Datos de Prueba

Pobla la base de datos con datos de ejemplo:

```bash
pnpm prisma:seed
```

**Datos creados**:

- 1 Workspace: "Clínica Demo"
- 2 Users:
  - `admin@clinicademo.com` (OWNER)
  - `doctor@clinicademo.com` (DOCTOR)
- 1 Practice: "Consultorio Norte"
- 1 Template inicial
- 5 Campaigns con pacientes

**Credenciales de prueba**:

```
Email: admin@clinicademo.com
Password: Demo123!
```

### 3. Verificar con Prisma Studio

Abre la interfaz visual de la base de datos:

```bash
pnpm prisma:studio
```

Se abrirá en `http://localhost:5555`. Explora las tablas creadas.

---

## Verificación

### 1. Levantar Todas las Apps

En una terminal:

```bash
pnpm dev
```

Esto levanta:

- **Web**: `http://localhost:3000` (Next.js)
- **API**: `http://localhost:3000` (NestJS)
- **Worker**: Background (sin puerto)

**Salida esperada**:

```
> nx run-many --target=serve --projects=web,api,worker --parallel=3

✔ Web server is running on http://localhost:3000
✔ API server is running on http://localhost:3000
✔ Worker is processing jobs...
```

### 2. Verificar Frontend

Abre tu navegador en `http://localhost:3000`.

**Deberías ver**:

- Página de login
- Formulario con email/password
- Opción "Sign in with Google" (sin configurar aún)

### 3. Verificar API

En otra terminal:

```bash
curl http://localhost:3000/health
```

**Respuesta esperada**:

```json
{
  "status": "ok",
  "timestamp": "2025-11-15T12:00:00.000Z",
  "database": "connected",
  "redis": "connected"
}
```

### 4. Test de Login

En el browser (`http://localhost:3000`):

1. Introduce credenciales:
   - Email: `admin@clinicademo.com`
   - Password: `Demo123!`
2. Click "Sign In"
3. Deberías ser redirigido al dashboard

**Si funciona**: ✅ Setup completado correctamente.

---

## Troubleshooting

### Error: "Cannot connect to database"

**Causa**: PostgreSQL no está corriendo.

**Solución**:

```bash
docker-compose up -d postgres
docker-compose logs postgres  # Ver logs
```

### Error: "Redis connection refused"

**Causa**: Redis no está corriendo.

**Solución**:

```bash
docker-compose up -d redis
docker-compose logs redis
```

### Error: "Port 3000 already in use"

**Causa**: Otro proceso está usando el puerto.

**Solución**:

```bash
# Encuentra el proceso
lsof -i :3000

# Mata el proceso
kill -9 <PID>

# O cambia el puerto en .env
NEXT_PUBLIC_PORT=3002
```

### Error: "Prisma Client not generated"

**Causa**: Falta generar el cliente de Prisma.

**Solución**:

```bash
pnpm prisma:generate
```

### Error: "Module not found"

**Causa**: Dependencias no instaladas correctamente.

**Solución**:

```bash
# Limpia todo
rm -rf node_modules
rm pnpm-lock.yaml

# Reinstala
pnpm install
```

### La app está lenta o crashea

**Causa**: Posible problema de memoria con Docker.

**Solución**:

1. Abre Docker Desktop
2. Settings → Resources
3. Aumenta Memory a al menos 4GB
4. Restart Docker

```bash
docker-compose down
docker-compose up -d
```

### No puedo hacer login

**Checklist**:

1. ¿Ejecutaste el seed? `pnpm prisma:seed`
2. ¿El API está corriendo? `curl http://localhost:3000/health`
3. ¿Las credenciales son correctas? `admin@clinicademo.com` / `Demo123!`
4. Revisa logs del API: `pnpm nx serve api`

### Migraciones fallan

**Error común**: "Database is not empty"

**Solución** (⚠️ BORRA TODOS LOS DATOS):

```bash
pnpm prisma:reset
```

Esto:

1. Dropea la base de datos
2. Crea una nueva
3. Aplica todas las migraciones
4. Ejecuta el seed

---

## Configuración Opcional (Integraciones)

### Twilio (SMS)

1. Crea cuenta en [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Verifica tu número de teléfono
3. Ve a Console → Account Info
4. Copia:
   - Account SID → `TWILIO_ACCOUNT_SID`
   - Auth Token → `TWILIO_AUTH_TOKEN`
5. Ve a Phone Numbers → Manage → Buy a number (Ecuador +593)
6. Copia el número → `TWILIO_PHONE_NUMBER`

**Test rápido**:

```bash
curl -X POST http://localhost:3000/api/test/sms \
  -H "Content-Type: application/json" \
  -d '{"to": "+593999999999", "message": "Test from Reputation Manager"}'
```

### Google OAuth

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un nuevo proyecto: "Reputation Manager Dev"
3. Habilita "Google+ API"
4. Ve a "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. Copia:
   - Client ID → `GOOGLE_CLIENT_ID`
   - Client Secret → `GOOGLE_CLIENT_SECRET`

**Reinicia el frontend**:

```bash
pnpm nx serve web
```

Ahora "Sign in with Google" debería funcionar.

### Stripe (Pagos)

1. Crea cuenta en [stripe.com](https://stripe.com)
2. Activa "Test mode" (switch en la esquina superior derecha)
3. Ve a Developers → API Keys
4. Copia:
   - Secret key → `STRIPE_SECRET_KEY`
   - Publishable key → `STRIPE_PUBLISHABLE_KEY`

**Para webhooks** (necesitas ngrok o similar):

```bash
# Instala Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/webhooks/stripe
```

Copia el webhook secret → `STRIPE_WEBHOOK_SECRET`

---

## Siguientes Pasos

1. **Lee la documentación**:
   - [DEVELOPMENT.md](./DEVELOPMENT.md) - Workflows diarios
   - [DATABASE.md](./DATABASE.md) - Schema y queries
   - [ARCHITECTURE.md](../ARCHITECTURE.md) - Arquitectura completa

2. **Explora el código**:

   ```bash
   pnpm nx graph  # Visualiza dependencias entre apps/libs
   ```

3. **Ejecuta tests**:

   ```bash
   pnpm test
   ```

4. **Contribuye**:
   - Crea una branch: `git checkout -b feature/mi-feature`
   - Haz commits: `git commit -m "feat: add mi feature"`
   - Push: `git push origin feature/mi-feature`
   - Abre un PR en GitHub

---

## Comandos Útiles

```bash
# Desarrollo
pnpm dev                    # Start todo
pnpm nx serve web           # Solo frontend
pnpm nx serve api           # Solo API
pnpm nx serve worker        # Solo worker

# Base de datos
pnpm prisma:studio          # UI visual
pnpm prisma:migrate         # Nueva migración
pnpm prisma:seed            # Seed data
pnpm prisma:reset           # Reset DB (⚠️ borra todo)

# Testing
pnpm test                   # Todos los tests
pnpm nx test api            # Tests del API
pnpm nx test web            # Tests del frontend

# Linting
pnpm lint                   # Lint todo
pnpm format                 # Format con Prettier

# Docker
docker-compose up -d        # Start servicios
docker-compose down         # Stop servicios
docker-compose logs -f      # Ver logs
docker-compose ps           # Status

# Nx utilities
pnpm nx graph               # Dependency graph
pnpm nx affected:test       # Test solo lo afectado
pnpm nx reset               # Clear cache
```

---

## Estructura de Archivos (Post-Setup)

```
reputation-manager/
├── .env                        # ✅ Configurado
├── docker-compose.yml          # ✅ Corriendo
├── node_modules/               # ✅ Instalado
├── apps/
│   ├── web/                    # ✅ http://localhost:3000
│   ├── api/                    # ✅ http://localhost:3000
│   └── worker/                 # ✅ Running
├── libs/
│   └── database/
│       └── prisma/
│           ├── schema.prisma   # ✅ Schema definido
│           └── migrations/     # ✅ Aplicadas
└── docs/
    ├── SETUP.md               # 📍 Estás aquí
    ├── DEVELOPMENT.md
    ├── DATABASE.md
    └── ARCHITECTURE.md
```

---

## Soporte

**Problemas no resueltos?**

1. Revisa [Troubleshooting](#troubleshooting)
2. Busca en GitHub Issues: [github.com/saxoboy/reputation-manager/issues](https://github.com/saxoboy/reputation-manager/issues)
3. Crea un nuevo issue con:
   - Qué intentaste hacer
   - Qué error obtuviste
   - Logs relevantes

---

**Setup completado! 🎉**  
Continúa con [DEVELOPMENT.md](./DEVELOPMENT.md) para workflows diarios.

---

**Última actualización**: 2025-11-15  
**Versión**: 1.0.0
