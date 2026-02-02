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

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4, shadcn/ui
- **Backend**: NestJS, Prisma, PostgreSQL, Redis, BullMQ
- **Integraciones**: Twilio (SMS), WhatsApp Business API, SendGrid, Stripe
- **DevOps**: Nx Monorepo, Docker, GitHub Actions, Railway

## 📁 Estructura del Proyecto

```
reputation-manager/
├── apps/
│   ├── web/      # Next.js 15 - Dashboard del doctor
│   ├── api/      # NestJS - REST API principal
│   └── worker/   # NestJS - Background jobs (BullMQ)
├── libs/
│   ├── database/       # Prisma ORM
│   ├── shared-types/   # DTOs y Types compartidos
│   ├── shared-utils/   # Utilidades comunes
│   └── integrations/   # Twilio, WhatsApp, SendGrid, Stripe
└── docs/
    ├── ARCHITECTURE.md   # Arquitectura del sistema
    ├── DATABASE.md       # Schema y migraciones
    ├── SETUP.md          # Guía de instalación
    ├── DEVELOPMENT.md    # Workflows de desarrollo
    └── ROADMAP.md        # Plan de implementación 9 meses
```

## 🚀 Quick Start

### Prerequisitos

- Node.js 20+
- pnpm 8+
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

# Levantar todas las apps
pnpm dev
```

### Apps corriendo en:

- **Web**: http://localhost:4200
- **API**: http://localhost:3000
- **Worker**: Background (sin puerto)

## 📚 Documentación

- **[SETUP.md](docs/SETUP.md)** - Guía completa de instalación
- **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Workflows y convenciones
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Arquitectura del sistema
- **[DATABASE.md](docs/DATABASE.md)** - Schema y queries
- **[ROADMAP.md](docs/ROADMAP.md)** - Plan de 9 meses hasta MVP

## 🎯 Estado del Proyecto

**Fecha**: Febrero 2, 2026  
**Progreso**: ~40% completado (Phases 0, 1, 2, 3 completas)

| Phase                  | Estado | Fecha Completado |
| ---------------------- | ------ | ---------------- |
| Phase 0: Setup         | ✅     | Ene 17, 2026     |
| Phase 1: Foundation    | ✅     | Ene 19, 2026     |
| Phase 2: Core Features | ✅     | Ene 20, 2026     |
| Phase 3: Integrations  | ✅     | Feb 2, 2026      |
| Phase 4: Analytics     | 🚧     | En progreso      |
| Phase 5: Billing       | ⏳     | Pendiente        |
| Phase 6: Polish & UX   | ⏳     | Pendiente        |
| Phase 7: Beta Testing  | ⏳     | Jun 2026         |
| Phase 8: Launch        | ⏳     | Ago 2026         |

**Timeline total**: 9 meses hasta MVP  
**Target Launch**: Agosto 15, 2026  
**Beta Testers**: 4 doctores confirmados

### ✨ Funcionalidades Implementadas

- ✅ Autenticación completa (Email + Google OAuth)
- ✅ Dashboard profesional con sidebar y métricas
- ✅ Multi-tenancy enforced en todos los endpoints
- ✅ CRUD completo: Campaigns, Patients, Practices, Templates
- ✅ CSV upload con validación de datos
- ✅ BullMQ Jobs procesando en background
- ✅ SMS via Twilio funcionando
- ✅ WhatsApp Business API integrado
- ✅ SendGrid emails (4 tipos de templates)
- ✅ Google Places API para búsqueda de consultorios
- ✅ Google Review URLs específicas por consultorio
- ✅ Worker enviando mensajes reales con URLs dinámicas

### 🚧 En Desarrollo (Next)

- 🚧 Analytics dashboard (NPS, conversion rate, charts)
- ⏳ Credits system con deducción automática
- ⏳ Billing con Stripe integration
- ⏳ Mobile responsive design
- ⏳ Performance optimization

## 📊 Comandos Útiles

```bash
# Desarrollo
pnpm dev                  # Levantar todo
pnpm nx serve web         # Solo frontend
pnpm nx serve api         # Solo API

# Base de datos
pnpm prisma:studio        # UI visual
pnpm prisma:migrate       # Nueva migración
pnpm prisma:seed          # Seedear datos

# Testing
pnpm test                 # Todos los tests
pnpm nx test api          # Tests del API

# Nx utilities
pnpm nx graph             # Ver grafo de dependencias
```

## 🤝 Contribuir

Este proyecto sigue **Conventional Commits**:

```bash
feat: nueva feature
fix: bug fix
docs: documentación
refactor: refactorización
test: tests
```

## 📄 Licencia

MIT

---

**Desarrollado con ❤️ para mejorar la reputación online de profesionales de la salud en Ecuador**
