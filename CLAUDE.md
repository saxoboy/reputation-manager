# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Reputation Manager** is a multi-tenant SaaS for healthcare professionals (doctors, dentists) in Ecuador. It automates patient feedback collection: sends SMS/WhatsApp 2 hours after an appointment, asks for a 1–5 rating, redirects happy patients (4–5) to Google Reviews, and routes unhappy patients (1–3) to a private feedback form.

## Commands

```bash
# Local dev (requires Docker for Postgres + Redis)
docker-compose up -d
pnpm dev              # web + api in parallel
pnpm dev:all          # web + api + worker in parallel
pnpm dev:api          # NestJS API only
pnpm dev:web          # Next.js only
pnpm dev:worker       # Background worker only

# Build & quality
pnpm build
pnpm lint
pnpm format
pnpm format:check

# Tests
pnpm test                              # All tests
pnpm nx test api                       # API tests only
pnpm nx test api --watch               # Watch mode
pnpm nx test api --coverage

# Database (Prisma — schema in libs/database/prisma/schema.prisma)
pnpm prisma:generate   # Regenerate Prisma client after schema changes
pnpm prisma:migrate    # Create + run migration
pnpm prisma:deploy     # Apply migrations (production)
pnpm prisma:seed       # Seed dev database
pnpm prisma:studio     # Visual DB browser
pnpm prisma:reset      # DESTRUCTIVE — reset database
```

## Architecture

### Monorepo Layout (Nx + pnpm workspaces)

```
apps/
  web/      → Next.js 16 (App Router) — doctor dashboard
  api/      → NestJS 11 — REST API (port 3333)
  worker/   → NestJS 11 — BullMQ background job processor

libs/
  database/       → Prisma client singleton + schema
  shared-types/   → DTOs, enums, TypeScript interfaces
  shared-utils/   → Zod validators, formatters, helpers
  integrations/   → Twilio, WhatsApp, Stripe, Resend clients
```

### Request Flow

```
Web (Next.js) → API (NestJS)
                  ├─ Better Auth (sessions + JWT)
                  ├─ AuthGuard → WorkspaceGuard → RoleGuard
                  └─ Controller → Service → Prisma → PostgreSQL
                                    ↓
                               BullMQ Queue (Redis)
                                    ↓
                               Worker (NestJS)
                                    ↓
                          Twilio / WhatsApp / Stripe / Resend
```

### Multi-Tenancy

Every resource belongs to a `Workspace`. All Prisma queries must filter by `workspaceId` — this is the primary isolation mechanism. Guards enforce this at the HTTP layer:

1. `AuthGuard` — validates JWT from Better Auth
2. `WorkspaceGuard` — verifies user is a member of the requested workspace
3. `RoleGuard` — checks role (`OWNER` / `DOCTOR` / `RECEPTIONIST`)

### Job Queue (BullMQ + Redis)

The API enqueues jobs; the Worker processes them. Key job types:

- `send-initial-message` — SMS/WhatsApp rating request
- `send-followup-happy` — Google Review link (rating 4–5)
- `send-followup-unhappy` — private feedback form (rating 1–3)
- `send-reminder` — reminder if no response
- `send-weekly-report` — automated email reports

### Authentication

**Better Auth** handles email/password and Google OAuth. Sessions are JWT-based (7-day expiry) with Prisma as the adapter. Auth routes are served at `/api/auth/*` by the NestJS API (not Next.js). The frontend uses `@better-auth/react` hooks.

### Key API Patterns

- All workspace-scoped routes follow: `/workspaces/:workspaceId/<resource>`
- Health check: `GET /health` (no auth)
- Webhook endpoints (`/webhooks/twilio`, `/webhooks/whatsapp`, `/webhooks/stripe`) bypass auth guards
- Rate limiting: 20 requests/minute per IP (ThrottlerModule)

### Database

Prisma 7 with PostgreSQL 16. Schema at `libs/database/prisma/schema.prisma`. Key models:

- `Workspace` — tenant root; holds plan and credits
- `WorkspaceUser` — user ↔ workspace membership + role
- `Campaign` — container for patient messaging batches
- `Patient` — recipient with consent tracking (`hasConsent`, `optedOutAt`, `dataDeletedAt`)
- `Message` — individual message with channel, status, rating, cost
- `Template` — reusable message templates with `{name}`, `{doctor}` variables
- `Transaction` — billing events linked to Stripe

GDPR compliance is handled via soft deletes (`dataDeletedAt`) on patients.

### Frontend

Next.js App Router. Server Components fetch data directly; Client Components use TanStack Query for caching. Forms use React Hook Form + Zod. UI is shadcn/ui + Tailwind CSS 4.

### Environment Variables

Copy `.env.example` to `.env`. Key variables:

| Variable                                           | Purpose                                        |
| -------------------------------------------------- | ---------------------------------------------- |
| `DATABASE_URL`                                     | PostgreSQL connection string                   |
| `REDIS_URL`                                        | Redis connection string                        |
| `BETTER_AUTH_SECRET`                               | 32+ char secret for auth                       |
| `BETTER_AUTH_URL`                                  | API server URL (e.g., `http://localhost:3333`) |
| `NEXT_PUBLIC_API_URL`                              | Frontend → API URL                             |
| `GOOGLE_CLIENT_ID/SECRET`                          | OAuth 2.0                                      |
| `TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER`       | SMS                                            |
| `WHATSAPP_ACCESS_TOKEN/PHONE_NUMBER_ID`            | Meta WhatsApp API                              |
| `STRIPE_SECRET_KEY/PUBLISHABLE_KEY/WEBHOOK_SECRET` | Payments                                       |
| `RESEND_API_KEY`                                   | Email delivery                                 |
| `CORS_ORIGINS`                                     | Comma-separated allowed origins                |
