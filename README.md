# Reputation Manager

![CI](https://github.com/saxoboy/reputation-manager/workflows/CI/badge.svg)
![PR Checks](https://github.com/saxoboy/reputation-manager/workflows/PR%20Checks/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Sistema Multi-tenant SaaS de gestión de feedback para profesionales de la salud en Ecuador**

## 🎯 El Problema

Los profesionales de la salud viven de su reputación online. Los pacientes insatisfechos siempre dejan reseñas negativas, pero los satisfechos rara vez lo hacen.

## 💡 La Solución

Sistema automatizado que:

1. Envía SMS/WhatsApp 2 horas después de la cita
2. Solicita calificación del 1-5
3. **Pacientes felices (4-5)**: Redirige a Google Reviews
4. **Pacientes infelices (1-3)**: Formulario privado para feedback interno
5. Previene malas reseñas públicas y maximiza las positivas

## 🛠 Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4, shadcn/ui
- **Backend**: NestJS 11, Prisma 6, PostgreSQL 16, Redis 7, BullMQ
- **Auth**: Better Auth (Email + Google OAuth)
- **Integraciones**: Twilio (SMS), WhatsApp Business API, SendGrid, Stripe
- **Monitoring**: Sentry (error tracking + performance)
- **Security**: Helmet, CORS dinámico, Rate Limiting, Input validation (Zod)
- **DevOps**: Nx Monorepo, pnpm, Docker, GitHub Actions, Railway

## 📁 Estructura del Proyecto

```
reputation-manager/
├── apps/
│   ├── web/      # Next.js 16 - Dashboard del doctor
│   ├── api/      # NestJS - REST API principal
│   └── worker/   # NestJS - Background jobs (BullMQ)
├── libs/
│   ├── database/       # Prisma ORM compartido
│   ├── shared-types/   # DTOs y Types compartidos
│   ├── shared-utils/   # Utilidades comunes
│   └── integrations/   # Twilio, WhatsApp, SendGrid, Stripe
├── docs/               # Documentación del proyecto
├── scripts/            # Scripts de utilidad y testing
└── postman/            # Colección Postman para API testing
```

## 🚀 Quick Start

### Prerequisitos

- Node.js 22+
- pnpm 10+
- Docker & Docker Compose

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/saxoboy/reputation-manager.git
cd reputation-manager

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Levantar servicios (PostgreSQL + Redis)
docker-compose up -d

# Ejecutar migraciones
pnpm prisma:migrate

# Seedear datos de prueba
pnpm prisma:seed

# Levantar todas las apps
pnpm dev
```

### Apps corriendo en:

| App        | URL                          | Descripción           |
| ---------- | ---------------------------- | --------------------- |
| **Web**    | http://localhost:4000        | Dashboard del doctor  |
| **API**    | http://localhost:3000/api    | REST API              |
| **Health** | http://localhost:3000/health | Health check (DB)     |
| **Worker** | Background                   | Procesamiento de jobs |

## 📚 Documentación

- **[SETUP.md](docs/SETUP.md)** - Guía completa de instalación
- **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Workflows y convenciones
- **[DATABASE.md](docs/DATABASE.md)** - Schema y migraciones
- **[ROADMAP.md](docs/ROADMAP.md)** - Plan de 9 meses hasta MVP
- **[BACKEND_INTEGRATION.md](docs/BACKEND_INTEGRATION.md)** - Integración API ↔ Worker
- **[CHANNEL_CONFIGURATION.md](docs/CHANNEL_CONFIGURATION.md)** - Configuración SMS/WhatsApp
- **[WEEKLY_REPORTS_GUIDE.md](docs/WEEKLY_REPORTS_GUIDE.md)** - Reportes semanales automáticos

## 🎯 Estado del Proyecto

**Fecha**: Febrero 6, 2026
**Progreso**: ~85% completado (Phases 0-6 completas, Phase 7 en progreso)

| Phase                  | Estado | Fecha Completado |
| ---------------------- | ------ | ---------------- |
| Phase 0: Setup         | ✅     | Ene 17, 2026     |
| Phase 1: Foundation    | ✅     | Ene 19, 2026     |
| Phase 2: Core Features | ✅     | Ene 20, 2026     |
| Phase 3: Integrations  | ✅     | Feb 2, 2026      |
| Phase 4: Analytics     | ✅     | Feb 4, 2026      |
| Phase 5: Billing       | ✅     | Feb 5, 2026      |
| Phase 6: Polish & UX   | ✅     | Feb 5, 2026      |
| Phase 7: Beta Testing  | 🚧     | En progreso      |
| Phase 8: Launch        | ⏳     | Ago 2026         |

**Timeline total**: 9 meses hasta MVP
**Target Launch**: Agosto 15, 2026
**Beta Testers**: 4 doctores confirmados

### ✨ Funcionalidades Implementadas

#### Core

- ✅ Autenticación completa (Email + Google OAuth via Better Auth)
- ✅ Dashboard profesional con sidebar responsive y métricas
- ✅ Multi-tenancy enforced en todos los endpoints
- ✅ CRUD completo: Campaigns, Patients, Practices, Templates
- ✅ CSV upload con validación de datos ecuatorianos
- ✅ BullMQ Jobs procesando en background

#### Integraciones

- ✅ SMS via Twilio con tracking de entrega
- ✅ WhatsApp Business API integrado
- ✅ SendGrid emails (4 plantillas transaccionales)
- ✅ Google Places API (autocomplete + review URLs)
- ✅ Stripe billing (planes, suscripciones, créditos)

#### Analytics & Reportes

- ✅ Dashboard analytics (NPS, conversion rate, response rate)
- ✅ Charts interactivos (Recharts)
- ✅ Exportación CSV/PDF de reportes
- ✅ Reportes semanales automáticos por email
- ✅ Reportes por práctica/ubicación

#### Billing & Créditos

- ✅ Sistema de créditos con deducción automática
- ✅ Planes: Free, Starter, Professional, Enterprise
- ✅ Stripe Checkout + Customer Portal
- ✅ Webhooks de Stripe para sincronización

#### Production Readiness (Phase 7)

- ✅ Sentry error tracking (web + api + worker)
- ✅ Dockerfiles multi-stage optimizados
- ✅ Railway deployment config
- ✅ Helmet security headers
- ✅ CORS dinámico configurable
- ✅ Health checks con verificación de DB
- ✅ Rate limiting por endpoint
- ✅ In-app beta feedback widget

### 🚧 En Desarrollo

- 🚧 Pruebas de deployment en Railway
- 🚧 Onboarding de 4 beta testers
- ⏳ Monitoring & alertas en producción
- ⏳ Dominio custom + SSL

## 📊 Comandos Útiles

```bash
# Desarrollo
pnpm dev                  # Levantar web + api
pnpm dev:all              # Levantar web + api + worker
pnpm dev:api              # Solo API
pnpm dev:web              # Solo frontend

# Base de datos
pnpm prisma:studio        # UI visual
pnpm prisma:migrate       # Nueva migración
pnpm prisma:seed          # Seedear datos
pnpm prisma:deploy        # Aplicar migraciones en producción

# Testing
pnpm test                 # Todos los tests
pnpm nx test api          # Tests del API
pnpm nx test api --watch  # Watch mode

# Build & Deploy
pnpm build                # Build all
pnpm format               # Formatear código
pnpm lint                 # Lint all

# Nx utilities
pnpm nx graph             # Ver grafo de dependencias
pnpm nx reset             # Limpiar cache
```

## 🐳 Docker

```bash
# Servicios de desarrollo (PostgreSQL + Redis)
docker-compose up -d

# Build de imágenes de producción
docker build -f apps/api/Dockerfile -t reputation-api .
docker build -f apps/worker/Dockerfile -t reputation-worker .
docker build -f apps/web/Dockerfile -t reputation-web .
```

## 🤝 Contribuir

Este proyecto sigue **Conventional Commits**:

```bash
feat(campaigns): nueva feature
fix(worker): bug fix
docs(setup): documentación
refactor(auth): refactorización
test(api): tests
```

## 📄 Licencia

MIT

---

**Desarrollado con ❤️ para mejorar la reputación online de profesionales de la salud en Ecuador**
