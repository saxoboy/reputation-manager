# Reputation Manager

![CI](https://github.com/saxoboy/reputation-manager/workflows/CI/badge.svg)
![PR Checks](https://github.com/saxoboy/reputation-manager/workflows/PR%20Checks/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Multi-tenant SaaS feedback management system for healthcare professionals**

## 🎯 The Problem

Healthcare professionals depend on their online reputation. Unhappy patients always leave negative reviews, but satisfied patients rarely do.

## 💡 The Solution

Automated system that:

1. Sends SMS/WhatsApp 2 hours after the appointment
2. Requests a rating from 1-5
3. **Happy patients (4-5)**: Redirects to Google Reviews
4. **Unhappy patients (1-3)**: Private feedback form for internal use
5. Prevents bad public reviews and maximizes positive ones

# Reputation Manager

**Reputation Manager** is a Multi-tenant SaaS feedback management system for healthcare professionals (doctors, dentists).

## The Problem

Healthcare professionals depend on their online reputation. Unhappy patients always leave negative reviews, but satisfied patients rarely do.

## The Solution

Automated system that:

1. Sends SMS/WhatsApp 2 hours after the appointment
2. Requests a rating from 1-5
3. **Happy patients (4-5)**: Redirects to Google Reviews
4. **Unhappy patients (1-3)**: Private feedback form for internal use
5. Prevents bad public reviews and maximizes positive ones

**Marketing**: "We improve feedback management and patient experience" (not "we filter reviews").

**Current status**: Phase 0 - Initial project setup  
**Timeline**: 9 months to MVP in production  
**Beta testers**: 4 doctors/dentists confirmed

## Quick Setup

```bash
git clone https://github.com/saxoboy/reputation-manager.git
cd reputation-manager
pnpm install
cp .env.example .env
# Edit .env with your credentials
docker-compose up -d
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

## Stack

- Next.js 15 (App Router)
- NestJS 10 (API + Worker)
- Prisma 5 (ORM)
- PostgreSQL 16
- Redis 7 (BullMQ)
- Tailwind CSS v4
- shadcn/ui
- React Hook Form + Zod
- Stripe, Twilio, WhatsApp, SendGrid
- Railway (MVP hosting)

## Monorepo Structure

```
reputation-manager/
├── apps/
│   ├── web/        # Next.js Dashboard
│   ├── api/        # NestJS API
│   └── worker/     # NestJS Worker
├── libs/
│   ├── database/   # Prisma ORM
│   ├── shared-types/
│   ├── shared-utils/
│   └── integrations/
├── docker-compose.yml
├── .env.example
└── docs/
```

## Main Flow

1. Doctor uploads CSV of patients
2. API validates and creates Campaign + Patients
3. Jobs are queued in BullMQ
4. Worker sends SMS/WhatsApp
5. Patient replies (1-5)
6. If happy (4-5): link to Google Reviews
7. If unhappy (1-3): link to private feedback

## Multi-Tenancy

- Workspace (root tenant)
- Users (roles: OWNER, DOCTOR, RECEPTIONIST)
- Practices (physical locations)
- Campaigns (per practice)
- Templates (custom messages)

## Pricing

| Plan             | Price/month | Included messages | Users     | Locations |
| ---------------- | ----------- | ----------------- | --------- | --------- |
| **FREE**         | $0          | 50                | 1         | 1         |
| **STARTER**      | $39         | 500               | 2         | 1         |
| **PROFESSIONAL** | $129        | 2000              | 5         | 5         |
| **ENTERPRISE**   | Custom      | Unlimited         | Unlimited | Unlimited |

## Compliance

- Explicit patient consent
- Easy opt-out ("Reply STOP")
- Secure storage
- Right to be forgotten

## Contact

**Maintainer**: @saxoboy

**Last update**: 2026-02-12

- ✅ Full authentication (Email + Google OAuth via Better Auth)
- ✅ Professional dashboard with responsive sidebar and metrics
- ✅ Multi-tenancy enforced on all endpoints
- ✅ Complete CRUD: Campaigns, Patients, Practices, Templates
- ✅ CSV upload with Ecuadorian data validation
- ✅ BullMQ Jobs processing in background

#### Integrations

- ✅ SMS via Twilio with delivery tracking
- ✅ WhatsApp Business API integrated
- ✅ SendGrid emails (4 transactional templates)
- ✅ Google Places API (autocomplete + review URLs)
- ✅ Stripe billing (plans, subscriptions, credits)

#### Analytics & Reports

- ✅ Dashboard analytics (NPS, conversion rate, response rate)
- ✅ Interactive charts (Recharts)
- ✅ CSV/PDF export of reports
- ✅ Automatic weekly reports by email
- ✅ Reports by practice/location

#### Billing & Credits

- ✅ Credits system with automatic deduction
- ✅ Plans: Free, Starter, Professional, Enterprise
- ✅ Stripe Checkout + Customer Portal
- ✅ Stripe webhooks for synchronization

#### Production Readiness (Phase 7)

- ✅ Sentry error tracking (web + api + worker)
- ✅ Optimized multi-stage Dockerfiles
- ✅ Railway deployment config
- ✅ Helmet security headers
- ✅ Dynamic configurable CORS
- ✅ Health checks with DB verification
- ✅ Rate limiting per endpoint
- ✅ In-app beta feedback widget

### 🚧 In Development

- 🚧 Deployment tests on Railway
- 🚧 Onboarding of 4 beta testers
- ⏳ Monitoring & alerts in production
- ⏳ Custom domain + SSL

## 📊 Useful Commands

```bash
# Development
pnpm dev                  # Start web + api
pnpm dev:all              # Start web + api + worker
pnpm dev:api              # API only
pnpm dev:web              # Frontend only

# Database
pnpm prisma:studio        # Visual UI
pnpm prisma:migrate       # New migration
pnpm prisma:seed          # Seed data
pnpm prisma:deploy        # Apply migrations in production

# Testing
pnpm test                 # All tests
pnpm nx test api          # API tests
pnpm nx test api --watch  # Watch mode

# Build & Deploy
pnpm build                # Build all
pnpm format               # Format code
pnpm lint                 # Lint all

# Nx utilities
pnpm nx graph             # View dependency graph
pnpm nx reset             # Clear cache
```

## 🐳 Docker

```bash
# Development services (PostgreSQL + Redis)
docker-compose up -d

# Production image builds
docker build -f apps/api/Dockerfile -t reputation-api .
docker build -f apps/worker/Dockerfile -t reputation-worker .
docker build -f apps/web/Dockerfile -t reputation-web .
```

## 🤝 Contributing

This project follows **Conventional Commits**:

```bash
feat(campaigns): new feature
fix(worker): bug fix
docs(setup): documentation
refactor(auth): refactor
test(api): tests
```

## 📄 License

MIT

---

**Built with ❤️ to improve the online reputation of healthcare professionals**
