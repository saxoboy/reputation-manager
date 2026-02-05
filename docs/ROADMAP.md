# Roadmap - Reputation Manager

Plan detallado de implementación de 9 meses hasta MVP en producción con 4 beta testers.

---

## Timeline Overview

```
Phase 0: Setup           │█████│ 2 semanas (Nov 15 - Nov 30, 2025) ✅
Phase 1: Foundation      │██████████│ 4 semanas (Dic 1 - Dic 31, 2025) ✅
Phase 2: Core Features   │███████████████│ 6 semanas (Ene 1 - Feb 15, 2026) ✅
Phase 3: Integrations    │██████████│ 4 semanas (Feb 16 - Mar 15, 2026) ✅
Phase 4: Analytics       │██████████│ 4 semanas (Mar 16 - Abr 15, 2026)
Phase 5: Billing         │██████████│ 4 semanas (Abr 16 - May 15, 2026)
Phase 6: Polish          │█████████████│ 5 semanas (May 16 - Jun 20, 2026)
Phase 7: Beta Testing    │████████████████│ 6 semanas (Jun 21 - Ago 1, 2026)
Phase 8: Launch          │██████│ 2 semanas (Ago 2 - Ago 15, 2026)
```

**Total**: ~9 meses  
**Target Launch**: Agosto 15, 2026  
**Beta Testers**: 4 doctores/dentistas confirmados

---

## Phase 0: Setup (2 semanas)

**Fecha**: Nov 15 - Nov 30, 2025  
**Estado**: ✅ **COMPLETADO** (Finalizado: Ene 17, 2026)  
**Goal**: Proyecto inicializado, documentación completa, repositorio configurado

### Semana 1: Documentación y Estructura

- [x] Crear repositorio GitHub
- [x] Documentar arquitectura (ARCHITECTURE.md)
- [x] Documentar database schema (DATABASE.md)
- [x] Documentar setup (SETUP.md)
- [x] Documentar desarrollo (DEVELOPMENT.md)
- [x] Documentar roadmap (ROADMAP.md)
- [x] Configurar CodeRabbit (.coderabbit.yaml)
- [x] Setup GitHub Actions básico (CI)

### Semana 2: Monorepo y Servicios Base

- [x] Inicializar Nx workspace
  ```bash
  npx create-nx-workspace@latest reputation-manager \
    --preset=apps \
    --packageManager=pnpm
  ```
- [x] Crear apps:
  - [x] `apps/web` (Next.js 15)
  - [x] `apps/api` (NestJS)
  - [x] `apps/worker` (NestJS)
- [x] Crear libs:
  - [x] `libs/database` (Prisma)
  - [x] `libs/shared-types`
  - [x] `libs/shared-utils`
  - [x] `libs/integrations` (stubs)
- [x] Setup Docker Compose (PostgreSQL + Redis)
- [x] Crear schema base de Prisma
- [x] Primera migración (6 migraciones creadas!)
- [x] Script de seed básico

**Deliverables**:

- ✅ Repositorio con estructura completa
- ✅ Documentación exhaustiva
- ✅ `pnpm dev` levanta todo correctamente
- ✅ Database con schema inicial y 6 migraciones
- ✅ CI/CD configurado con GitHub Actions
- ✅ CodeRabbit configurado para PR reviews
- ✅ Scripts de desarrollo listos

---

## Phase 1: Foundation (4 semanas)

**Fecha**: Dic 1 - Dic 31, 2025  
**Estado**: ✅ **COMPLETADO** (Finalizado: Ene 19, 2026)  
**Goal**: Autenticación, multi-tenancy, UI base funcional

### Semana 1-2: Auth & Multi-tenancy

**Backend**:

- [x] Implementar Better Auth
  - [x] Email/password login
  - [x] Google OAuth
  - [x] Session management
  - [x] Refresh tokens
- [x] Guards:
  - [x] `AuthGuard` (require login)
  - [x] `WorkspaceGuard` (require workspace access)
  - [x] `RoleGuard` (OWNER, DOCTOR, RECEPTIONIST)
- [x] Decorators:
  - [x] `@CurrentUser()`
  - [x] `@CurrentWorkspace()`
- [x] Endpoints:
  - [x] `POST /auth/register`
  - [x] `POST /auth/login`
  - [x] `POST /auth/logout`
  - [x] `GET /auth/me`
  - [x] `POST /auth/google`

**Frontend**:

- [x] Setup Better Auth client
- [x] Login page
- [x] Register page
- [x] Protected layout wrapper
- [x] Auth context/hooks
- [x] Google OAuth button

**Tests**:

- [x] Auth service unit tests
- [x] Auth e2e tests
- [x] Guard tests

### Semana 3-4: Base UI & Workspace CRUD

**Frontend**:

- [x] Setup shadcn/ui
- [x] Dashboard layout:
  - [x] Sidebar navigation
  - [x] Header with user menu
  - [x] Breadcrumbs
- [x] Workspace management:
  - [x] Create workspace flow (onboarding)
  - [x] Workspace settings page
  - [x] Invite users (básico)
- [x] User management:
  - [x] User list
  - [x] Edit user role
  - [x] Remove user

**Backend**:

- [x] Workspace CRUD endpoints
- [x] User management endpoints
- [x] Email invitations (SendGrid)

**Deliverables**:

- ✅ Login/Register funcional con Google OAuth
- ✅ Dashboard base con navegación completa
- ✅ Multi-tenancy enforced en todos los endpoints
- ✅ 30+ tests pasando (unit + e2e)
- ✅ Onboarding flow para nuevos usuarios
- ✅ Settings page completa
- ✅ User management UI funcional
- ✅ SendGrid integrado para invitaciones

---

## Phase 2: Core Features (6 semanas)

**Fecha**: Ene 1 - Feb 15, 2026  
**Estado**: ✅ **COMPLETADO** (Finalizado: Ene 20, 2026)  
**Goal**: Flujo completo de campaigns, patients, messages sin integraciones reales

### Semana 1-2: Practices & Templates

**Backend**:

- [x] Practice CRUD:
  - [x] `POST /practices`
  - [x] `GET /practices`
  - [x] `GET /practices/:id`
  - [x] `PUT /practices/:id`
  - [x] `DELETE /practices/:id`
- [x] Template CRUD:
  - [x] `POST /templates`
  - [x] `GET /templates`
  - [x] Template variables: `{name}`, `{doctor}`, `{practice}`

**Frontend**:

- [x] Practices page:
  - [x] List practices
  - [x] Create practice form
  - [x] Edit practice
  - [x] Delete practice (with confirmation)
- [x] Templates page:
  - [x] List templates by type
  - [x] Create template
  - [x] Template preview con variables
  - [x] Character counter

**Tests**:

- [x] Practice service tests
- [x] Template service tests
- [x] Frontend form validation tests

### Semana 3-4: Campaigns & CSV Upload

**Backend**:

- [x] Campaign CRUD:
  - [x] `POST /campaigns`
  - [x] `GET /campaigns`
  - [x] `GET /campaigns/:id`
  - [x] `PUT /campaigns/:id`
  - [x] `DELETE /campaigns/:id`
- [x] CSV processing:
  - [x] Validate CSV structure
  - [x] Parse patient data
  - [x] Validate phones (Ecuador format)
  - [x] Create patients in bulk
  - [x] Return validation errors

**Frontend**:

- [x] Campaigns page:
  - [x] Campaign list with stats
  - [x] Create campaign modal
  - [x] CSV upload component:
    - [x] Drag & drop
    - [x] File validation
    - [x] Preview table
    - [x] Error highlighting
  - [x] Campaign detail page

**CSV Format**:

```csv
name,phone,email,appointmentTime,hasConsent
Juan Pérez,+593999999999,juan@email.com,2026-01-15T10:00:00,true
María López,+593988888888,maria@email.com,2026-01-15T11:30:00,true
```

**Tests**:

- [x] CSV parser tests
- [x] Campaign service tests
- [x] CSV upload e2e test

### Semana 5-6: Patients & Messages (Mock)

**Backend**:

- [x] Patient endpoints:
  - [x] `GET /patients` (by workspace)
  - [x] `GET /campaigns/:id/patients`
  - [x] `PUT /patients/:id` (update contact info)
  - [x] `DELETE /patients/:id` (soft delete)
- [x] Message endpoints:
  - [x] `GET /campaigns/:id/messages`
  - [x] `POST /messages/:id/response` (simulate patient response)
- [x] Mock message sending (sin Twilio aún):
  - [x] Log to console
  - [x] Save to DB with `sentAt` timestamp

**Frontend**:

- [x] Patients page:
  - [x] Patient list with filters
  - [x] Patient detail modal
  - [x] Edit patient
- [x] Campaign detail:
  - [x] Patient list in campaign
  - [x] Message timeline
  - [x] Simulate send button (testing)
  - [x] Manual response input (testing)

**BullMQ Setup**:

- [x] Configure BullMQ in worker
- [x] Job: `send-initial-message`
  - [x] Schedule based on `appointmentTime + scheduledHoursAfter`
  - [x] Mock send (log)
- [x] Job: `handle-response`
  - [x] Parse rating (1-5)
  - [x] Determine happy/unhappy
  - [x] Enqueue followup
- [x] Job: `send-followup`
  - [x] Mock send appropriate message
- [x] Bull Board UI: `http://localhost:3000/admin/queues`

**Deliverables**:

- ✅ Full campaign flow sin integraciones externas
- ✅ CSV upload funcional con validación
- ✅ Jobs procesándose en background
- ✅ Multi-tenancy completamente implementado
- ✅ Auth con Google OAuth funcionando
- ✅ Dashboard completo con todas las páginas principales

---

## Phase 3: Integrations (4 semanas)

**Fecha**: Feb 16 - Mar 15, 2026  
**Estado**: ✅ **COMPLETADO** (Finalizado: Feb 2, 2026)  
**Goal**: Twilio SMS, WhatsApp, SendGrid, Google Places funcionando completamente

### Semana 1: Twilio SMS

**Backend**:

- [x] `libs/integrations/twilio`:
  - [x] `TwilioService.sendSMS()`
  - [x] Error handling
  - [x] Rate limiting
  - [x] Cost tracking
- [x] Actualizar processors:
  - [x] Reemplazar mocks con Twilio real
  - [x] Handle Twilio errors (invalid number, etc.)
- [x] Webhook: `POST /webhooks/twilio/sms`
  - [x] Verify signature
  - [x] Parse incoming message
  - [x] Match to Patient by phone
  - [x] Trigger `handle-response` job

**Testing**:

- [x] Send test SMS a tu número
- [x] Responder y verificar webhook
- [x] Test error handling

**Costo estimado**: $0.05/SMS en Ecuador

### Semana 2: WhatsApp Business API

**Backend**:

- [x] `libs/integrations/whatsapp`:
  - [x] `WhatsAppService.sendMessage()`
  - [x] Template messages (Meta requirement)
- [x] Webhook: `POST /webhooks/whatsapp`
  - [x] Verify Meta signature
  - [x] Parse incoming message
  - [x] Trigger `handle-response` job
- [x] Config:
  - [x] Channel preference per workspace (SMS vs WhatsApp)

**Frontend**:

- [x] Workspace settings:
  - [x] Toggle SMS/WhatsApp
  - [x] WhatsApp Business account linking (via API secrets)

**Meta Approval**:

- [ ] Submit app for review
- [ ] Get message templates approved

**Testing**:

- [x] Send test WhatsApp
- [x] Test conversation flow

### Semana 3: SendGrid Email

**Backend**:

- [x] `libs/integrations/sendgrid`:
  - [x] `EmailService.sendTransactional()`
  - [x] Templates:
    - [x] Welcome email
    - [x] User invitation
    - [x] Low credits alert
    - [x] Weekly report
- [x] Trigger emails:
  - [x] On user registration (welcome)
  - [x] On user invitation (ya existía)
  - [x] On low credits (< 10)
  - [x] Weekly summary (automático)

**Frontend**:

- [ ] Email preview page (dev only)

**Testing**:

- [x] Send test emails
- [x] Verify links work

### Semana 4: Google Places API

**Backend**:

- [x] `libs/integrations/google`:
  - [x] `GooglePlacesService.searchPlace()`
  - [x] `GooglePlacesService.getReviewUrl()`
  - [x] `GooglePlacesService.autocomplete()`
  - [x] `GooglePlacesService.geocodeAddress()`
- [x] Practice endpoints:
  - [x] GET /practices/search/google-places
  - [x] GET /practices/google-places/:placeId
  - [x] GET /practices/autocomplete/google-places

**Frontend**:

- [x] Practice form:
  - [x] Google Places autocomplete
  - [x] Auto-fill name, address, phone from selected place
  - [x] Display Google Place ID (read-only)
- [x] Email preview page (dev only)

**Testing**:

- [x] Search for a place in Practice form
- [x] Verify autocomplete suggestions
- [x] Select a place and verify auto-fill
- [x] Save Practice with Google Place ID
- [x] Generate review URL for the practice

**Deliverables**:

- ✅ Google Places autocomplete in Practice form
- ✅ Email templates preview page
- ✅ Complete Phase 3 integration suite
  - [ ] Display review link
  - [ ] Test review link button

**Worker**:

- [x] Usar Google Place ID para generar review URLs
- [x] handleSendFollowup() actualizado con URLs reales
- [x] Fallback a URL genérica si no hay Place ID

**Deliverables**:

- ✅ SMS/WhatsApp enviándose realmente
- ✅ Webhooks procesando respuestas de pacientes
- ✅ Emails transaccionales funcionando (4 tipos)
- ✅ Google Review links generándose con Place ID real
- ✅ Practices API extendida con búsqueda de lugares
- ✅ Worker enviando URLs específicas por consultorio

---

## Phase 4: Analytics (4 semanas)

**Fecha**: Mar 16 - Abr 15, 2026  
**Estado**: 🟡 **EN PROGRESO** (50% completado - Ver [PHASE_4_PROGRESS.md](./PHASE_4_PROGRESS.md))  
**Goal**: Dashboard con métricas, reports, exports

### Semana 1-2: Core Metrics

**Backend**:

- [x] Analytics endpoints:
  - [x] `GET /analytics/workspace` - Overview metrics
  - [x] `GET /analytics/campaigns/:id` - Campaign stats
  - [x] `GET /analytics/practices/:id` - Practice stats
  - [x] `GET /analytics/timeline` - Time series data
- [x] Queries:
  - [x] Total messages sent
  - [x] Response rate
  - [x] Average rating
  - [x] NPS score
  - [x] Conversion rate (responded → Google Review)
  - [x] Rating distribution (1-5)
  - [x] Messages per day (last 30 days)

**Frontend**:

- [x] Analytics page:
  - [x] KPI cards (total sent, response rate, NPS)
  - [x] Rating distribution chart (bar chart)
  - [x] Messages timeline (line chart)
  - [x] Top performing campaigns table
  - [x] Filter by date range
  - [x] Filter by practice

**Tests**:

- [ ] Analytics calculation tests
- [ ] Time series tests

### Semana 3: Reports & Exports

**Backend**:

- [x] Export endpoints:
  - [x] `GET /campaigns/:id/export` - CSV
  - [x] `GET /analytics/export/csv` - Analytics CSV
  - [x] `GET /analytics/export/pdf` - Analytics PDF
- [ ] Report generation:
  - [ ] Weekly summary email (via SendGrid)
  - [x] PDF report with charts

**Frontend**:

- [x] Export buttons:
  - [x] Download campaign CSV
  - [x] Download analytics CSV
  - [x] Download PDF report
- [ ] Scheduled reports settings:
  - [ ] Enable/disable weekly email
  - [ ] Email recipients

**Tests**:

- [ ] CSV generation test
- [ ] PDF generation test

### Semana 4: Advanced Analytics

**Backend**:

- [ ] Comparison analytics:
  - [ ] Practice vs practice
  - [ ] Campaign vs campaign
  - [ ] Period vs period
- [ ] Cohort analysis:
  - [ ] Retention by month
  - [ ] Response rate trends

**Frontend**:

- [ ] Comparison view
- [ ] Cohort charts
- [ ] Insights widget (AI suggestions)

**Deliverables**:

- 🎯 Dashboard completo con métricas en tiempo real
- 🎯 Exports CSV y PDF funcionando
- 🎯 Email reports semanales automáticos

---

## Phase 5: Billing & Credits (4 semanas)

**Fecha**: Abr 16 - May 15, 2026  
**Goal**: Stripe integration, planes, credits system

### Semana 1-2: Stripe Setup

**Backend**:

- [ ] `libs/integrations/stripe`:
  - [ ] `StripeService.createCustomer()`
  - [ ] `StripeService.createSubscription()`
  - [ ] `StripeService.createPaymentIntent()` (top-up credits)
  - [ ] `StripeService.cancelSubscription()`
- [ ] Webhook: `POST /webhooks/stripe`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.paid`
  - [ ] `invoice.payment_failed`
- [ ] Billing endpoints:
  - [ ] `GET /billing/plans`
  - [ ] `POST /billing/subscribe`
  - [ ] `POST /billing/top-up`
  - [ ] `GET /billing/usage`
  - [ ] `POST /billing/cancel`

**Stripe Products** (crear en dashboard):

- [ ] FREE: $0/month, 50 messages
- [ ] STARTER: $39/month, 500 messages
- [ ] PROFESSIONAL: $129/month, 2000 messages
- [ ] ENTERPRISE: Custom (contact sales)

**Frontend**:

- [ ] Pricing page (public)
- [ ] Billing settings:
  - [ ] Current plan display
  - [ ] Usage bar (credits remaining)
  - [ ] Upgrade/downgrade buttons
  - [ ] Payment method
  - [ ] Billing history
  - [ ] Invoices download

**Tests**:

- [ ] Stripe webhook tests
- [ ] Subscription flow test
- [ ] Credit deduction test

### Semana 3: Credits System

**Backend**:

- [ ] Credit deduction logic:
  - [ ] Deduct on successful SMS send
  - [ ] Deduct on successful WhatsApp send
  - [ ] Don't deduct on failure
- [ ] Guards:
  - [ ] `CreditsGuard` - Block if insufficient credits
  - [ ] Low credits alert email
- [ ] Top-up logic:
  - [ ] Add credits on payment
  - [ ] Rollover unused credits on plan change

**Frontend**:

- [ ] Low credits banner
- [ ] Top-up modal
- [ ] Usage tracking page

**Tests**:

- [ ] Credit deduction tests
- [ ] Rollover tests
- [ ] Insufficient credits handling

### Semana 4: Invoicing & History

**Backend**:

- [ ] Invoice generation:
  - [ ] Auto-generate on subscription renewal
  - [ ] Manual invoice for top-ups
- [ ] Usage tracking:
  - [ ] Daily aggregation job
  - [ ] Store in `DailyUsage` table

**Frontend**:

- [ ] Usage history table
- [ ] Invoice list
- [ ] Download invoice PDF

**Deliverables**:

- 🎯 Stripe completamente integrado
- 🎯 Usuarios pueden subscribirse y pagar
- 🎯 Credits system funcional con límites
- 🎯 Invoices auto-generadas

---

## Phase 6: Polish & UX (5 semanas)

**Fecha**: May 16 - Jun 20, 2026  
**Goal**: UI/UX refinado, optimizaciones, mobile responsive

### Semana 1: Mobile Responsive

- [ ] Audit responsive en todas las páginas
- [ ] Sidebar collapse en mobile
- [ ] Tables → Cards en mobile
- [ ] Forms responsive
- [ ] Charts responsive

### Semana 2: Performance

**Backend**:

- [ ] Add database indexes
- [ ] Implement pagination everywhere
- [ ] Cache frequent queries (Redis)
- [ ] Optimize N+1 queries

**Frontend**:

- [ ] Code splitting
- [ ] Image optimization
- [ ] Lazy loading
- [ ] TanStack Query caching

**Tests**:

- [ ] Load testing con k6
- [ ] Performance benchmarks

### Semana 3: Error Handling & Logging

**Backend**:

- [ ] Sentry integration
- [ ] Structured logging
- [ ] Error boundaries
- [ ] Retry logic for external APIs

**Frontend**:

- [ ] Error boundaries
- [ ] Toast notifications
- [ ] Loading states everywhere
- [ ] Empty states

### Semana 4: Accessibility & i18n

- [ ] a11y audit (WCAG 2.1 AA)
- [ ] Keyboard navigation
- [ ] Screen reader testing
- [ ] Spanish locale (primary)
- [ ] English locale (secondary)

### Semana 5: Onboarding & Help

**Frontend**:

- [ ] Onboarding flow:
  - [ ] Welcome wizard
  - [ ] Create first practice
  - [ ] Upload first campaign
  - [ ] Send test message
- [ ] Help system:
  - [ ] Tooltips
  - [ ] Help center (basic)
  - [ ] Video tutorials (embeds)
- [ ] Demo mode:
  - [ ] Populate with fake data
  - [ ] "Try without signing up"

**Deliverables**:

- 🎯 App completamente responsive
- 🎯 Performance optimizada (Lighthouse > 90)
- 🎯 Error handling robusto
- 🎯 Onboarding smooth para nuevos usuarios

---

## Phase 7: Beta Testing (6 semanas)

**Fecha**: Jun 21 - Ago 1, 2026  
**Goal**: 4 beta testers usando el producto, feedback loop activo

### Semana 1: Beta Prep

- [ ] Deploy a Railway (staging)
- [ ] Setup monitoring (Sentry, Uptime)
- [ ] Setup analytics (PostHog/Mixpanel)
- [ ] Create beta testing plan
- [ ] Prepare feedback form
- [ ] Create beta tester agreement

### Semana 2-5: Active Testing

**Week-by-week**:

- [ ] **Week 1**: Onboard 2 testers
  - [ ] Call de onboarding
  - [ ] Setup accounts
  - [ ] Help con first campaign
  - [ ] Daily check-ins
- [ ] **Week 2**: Onboard 2 más testers
  - [ ] Repeat onboarding
  - [ ] Group feedback session
- [ ] **Week 3-4**: Free usage
  - [ ] Monitor usage
  - [ ] Fix critical bugs
  - [ ] Collect feedback weekly
- [ ] **Week 5**: Iteration
  - [ ] Implement top feedback
  - [ ] Performance improvements
  - [ ] Bug fixes

**Beta Testers** (4 confirmados):

1. Dr. [Nombre] - Medicina General - Quito
2. Dr. [Nombre] - Odontología - Guayaquil
3. Dr. [Nombre] - Cardiología - Quito
4. Dr. [Nombre] - Dermatología - Cuenca

**Feedback Channels**:

- [ ] Weekly video calls
- [ ] WhatsApp group
- [ ] In-app feedback widget
- [ ] Survey after 4 weeks

### Semana 6: Analysis & Final Tweaks

- [ ] Aggregate feedback
- [ ] Prioritize improvements
- [ ] Fix critical issues
- [ ] Performance tuning
- [ ] Prepare launch materials

**Success Metrics**:

- [ ] 80%+ satisfaction score
- [ ] < 5 critical bugs
- [ ] All testers send at least 50 messages
- [ ] At least 2 testers willing to pay

**Deliverables**:

- 🎯 4 doctores usando el producto activamente
- 🎯 Feedback documentado y priorizado
- 🎯 Bugs críticos resueltos
- 🎯 Product-market fit validado

---

## Phase 8: Launch (2 semanas)

**Fecha**: Ago 2 - Ago 15, 2026  
**Goal**: Lanzamiento público, primeros clientes pagando

### Semana 1: Pre-Launch

- [ ] Deploy a producción (Railway → AWS?)
- [ ] Setup domain (reputationmanager.ec)
- [ ] SSL certificates
- [ ] Backups automatizados
- [ ] Monitoring completo
- [ ] Launch checklist:
  - [ ] Legal: Términos, Privacidad, GDPR/Ecuador compliance
  - [ ] Stripe en modo producción
  - [ ] Twilio/WhatsApp en producción
  - [ ] SendGrid verified domain
  - [ ] Error tracking activo
  - [ ] Uptime monitoring
  - [ ] Backup strategy

**Marketing**:

- [ ] Landing page
- [ ] Blog post (launch story)
- [ ] Social media posts
- [ ] Email a beta testers (pedir testimonials)
- [ ] Product Hunt launch

### Semana 2: Launch Week

**Launch Day** (Ago 8, 2026):

- [ ] 🚀 Abrir registros públicos
- [ ] Publicar en Product Hunt
- [ ] Publicar en redes sociales
- [ ] Email a lista de espera (si existe)
- [ ] Monitor errors/performance en vivo

**Post-Launch**:

- [ ] Daily monitoring primera semana
- [ ] Responder feedback rápido
- [ ] Fix hot bugs (< 4 horas)
- [ ] Onboard primeros clientes pagando
- [ ] Collect testimonials

**Launch Goals**:

- [ ] 10 registros primera semana
- [ ] 5 conversiones a STARTER/PROFESSIONAL
- [ ] 0 critical bugs
- [ ] < 2 segundo load time
- [ ] 99.9% uptime

**Deliverables**:

- 🎯 Producto en producción accesible públicamente
- 🎯 Primeros clientes pagando
- 🎯 Sistema estable y monitoreado
- 🎯 Proceso de onboarding documentado

---

## Post-Launch (Continuous)

### Immediate (Mes 1-2)

**Features**:

- [ ] Reminders automáticos (si no responde en 24h)
- [ ] WhatsApp templates personalizables
- [ ] Multi-language support (English)
- [ ] API pública (para integraciones)

**Growth**:

- [ ] SEO optimization
- [ ] Content marketing (blog)
- [ ] Partnerships con clínicas grandes
- [ ] Referral program

**Support**:

- [ ] Live chat (Intercom/Crisp)
- [ ] Knowledge base
- [ ] Video tutorials
- [ ] Customer success calls

### Short-term (Mes 3-6)

**Features**:

- [ ] Mobile app (React Native)
- [ ] Zapier integration
- [ ] Slack notifications
- [ ] Advanced scheduling (múltiples envíos por día)
- [ ] A/B testing de mensajes
- [ ] Sentiment analysis de feedback

**Scale**:

- [ ] Multi-region support (Latam)
- [ ] Enterprise features:
  - [ ] SSO (SAML)
  - [ ] Custom branding
  - [ ] Dedicated support
  - [ ] SLA guarantees

### Long-term (Mes 6-12)

**Features**:

- [ ] AI-powered response suggestions
- [ ] Predictive analytics (qué pacientes probablemente responderán)
- [ ] Integration con EMR systems (Electronic Medical Records)
- [ ] Video testimonials collection
- [ ] Review generation para otras plataformas (Facebook, Yelp)

**Scale**:

- [ ] Expand a otros países Latam
- [ ] Expand a otros verticales (restaurantes, hoteles, servicios)
- [ ] White-label solution

---

## Contingency Plans

### Si el desarrollo se atrasa

**Reducir scope**:

1. Lanzar solo con SMS (no WhatsApp)
2. Lanzar sin analytics avanzadas
3. Lanzar sin mobile responsive (desktop first)
4. Lanzar FREE plan solo (no billing)

### Si los beta testers no están satisfechos

**Pivot options**:

1. Cambiar a modelo "review generation only" (sin filtro)
2. Cambiar a "feedback management" (sin SMS, solo forms)
3. Cambiar target a otro vertical (restaurantes)

### Si los costos de Twilio son muy altos

**Alternatives**:

1. Negociar volumen con Twilio
2. Evaluar alternativas (Vonage, MessageBird)
3. Ajustar pricing para cubrir costos
4. Enfocarse solo en WhatsApp (más barato)

---

## Success Metrics por Phase

| Phase   | Key Metric             | Target                     |
| ------- | ---------------------- | -------------------------- |
| Phase 0 | Documentation complete | ✅ 100%                    |
| Phase 1 | Auth & UI working      | Login + Dashboard          |
| Phase 2 | Core flow functional   | CSV → Campaign → Mock Send |
| Phase 3 | Integrations live      | Real SMS/WhatsApp sent     |
| Phase 4 | Analytics accurate     | NPS calculated correctly   |
| Phase 5 | First payment          | 1 test payment successful  |
| Phase 6 | Lighthouse score       | > 90                       |
| Phase 7 | Beta satisfaction      | > 80%                      |
| Phase 8 | Launch                 | 10 signups, 5 paying       |

---

## Team & Resources

**Current Team**:

- **1 Full-stack developer** (tú)
- **4 Beta testers** (doctores confirmados)

**Needed (opcional)**:

- Designer (freelance, solo para landing page)
- QA tester (freelance, antes de launch)
- Legal advisor (para términos y compliance)

**Time Commitment**:

- Phase 0-2: 20-30 horas/semana
- Phase 3-6: 30-40 horas/semana (core development)
- Phase 7: 10-15 horas/semana (monitoring + fixes)
- Phase 8: 40+ horas/semana (launch week)

---

## Budget Estimate

**Development** (9 meses):

- Hosting (Railway): $20-50/mes = **$180-450**
- Domain: **$15/año**
- Twilio (testing): $50 = **$50**
- Stripe: Free (test mode)
- Total: **~$300**

**Launch** (primer mes):

- Hosting (production): $100/mes
- Twilio (real usage): $100/mes
- SendGrid: $15/mes
- Stripe fees: 2.9% + $0.30 por transacción
- Total: **~$220/mes**

**Total first year**: **$3,000 - $5,000**

---

## Risk Assessment

| Risk                         | Probability | Impact | Mitigation                       |
| ---------------------------- | ----------- | ------ | -------------------------------- |
| Development delays           | High        | High   | Reduce scope, extend timeline    |
| Beta testers drop out        | Medium      | High   | Have 2-3 backup testers ready    |
| Twilio costs too high        | Medium      | Medium | Negotiate volume, adjust pricing |
| Google policy violation      | Low         | High   | Legal review, clear marketing    |
| Competition launches similar | Medium      | Medium | Move fast, lock beta testers     |
| Technical issues at launch   | High        | High   | Extensive testing, staging env   |

---

## Next Steps (This Week)

1. [ ] Configurar CodeRabbit (.coderabbit.yaml)
2. [ ] Inicializar Nx workspace
3. [ ] Crear estructura de apps y libs
4. [ ] Setup Docker Compose
5. [ ] Primera migración de Prisma
6. [ ] Primer commit: "feat: initialize monorepo"

---

**Última actualización**: 2025-11-15  
**Versión**: 1.0.0  
**Owner**: @saxoboy

---

_"The best time to plant a tree was 20 years ago. The second best time is now."_

¡Vamos a construir esto! 🚀
