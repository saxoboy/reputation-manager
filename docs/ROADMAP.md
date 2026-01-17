# Roadmap - Reputation Manager

Plan detallado de implementación de 9 meses hasta MVP en producción con 4 beta testers.

---

## Timeline Overview

```
Phase 0: Setup           │█████│ 2 semanas (Nov 15 - Nov 30, 2025)
Phase 1: Foundation      │██████████│ 4 semanas (Dic 1 - Dic 31, 2025)
Phase 2: Core Features   │███████████████│ 6 semanas (Ene 1 - Feb 15, 2026)
Phase 3: Integrations    │██████████│ 4 semanas (Feb 16 - Mar 15, 2026)
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
**Goal**: Autenticación, multi-tenancy, UI base funcional

### Semana 1-2: Auth & Multi-tenancy

**Backend**:

- [ ] Implementar Better Auth
  - [ ] Email/password login
  - [ ] Google OAuth
  - [ ] Session management
  - [ ] Refresh tokens
- [ ] Guards:
  - [ ] `AuthGuard` (require login)
  - [ ] `WorkspaceGuard` (require workspace access)
  - [ ] `RoleGuard` (OWNER, DOCTOR, RECEPTIONIST)
- [ ] Decorators:
  - [ ] `@CurrentUser()`
  - [ ] `@CurrentWorkspace()`
- [ ] Endpoints:
  - [ ] `POST /auth/register`
  - [ ] `POST /auth/login`
  - [ ] `POST /auth/logout`
  - [ ] `GET /auth/me`
  - [ ] `POST /auth/google`

**Frontend**:

- [ ] Setup Better Auth client
- [ ] Login page
- [ ] Register page
- [ ] Protected layout wrapper
- [ ] Auth context/hooks
- [ ] Google OAuth button

**Tests**:

- [ ] Auth service unit tests
- [ ] Auth e2e tests
- [ ] Guard tests

### Semana 3-4: Base UI & Workspace CRUD

**Frontend**:

- [ ] Setup shadcn/ui
- [ ] Dashboard layout:
  - [ ] Sidebar navigation
  - [ ] Header with user menu
  - [ ] Breadcrumbs
- [ ] Workspace management:
  - [ ] Create workspace flow (onboarding)
  - [ ] Workspace settings page
  - [ ] Invite users (básico)
- [ ] User management:
  - [ ] User list
  - [ ] Edit user role
  - [ ] Remove user

**Backend**:

- [ ] Workspace CRUD endpoints
- [ ] User management endpoints
- [ ] Email invitations (SendGrid stub)

**Deliverables**:

- 🎯 Login/Register funcional
- 🎯 Dashboard base con navegación
- 🎯 Multi-tenancy enforced en todos los endpoints
- 🎯 Al menos 20 tests pasando

---

## Phase 2: Core Features (6 semanas)

**Fecha**: Ene 1 - Feb 15, 2026  
**Goal**: Flujo completo de campaigns, patients, messages sin integraciones reales

### Semana 1-2: Practices & Templates

**Backend**:

- [ ] Practice CRUD:
  - [ ] `POST /practices`
  - [ ] `GET /practices`
  - [ ] `GET /practices/:id`
  - [ ] `PUT /practices/:id`
  - [ ] `DELETE /practices/:id`
- [ ] Template CRUD:
  - [ ] `POST /templates`
  - [ ] `GET /templates`
  - [ ] Template variables: `{name}`, `{doctor}`, `{practice}`

**Frontend**:

- [ ] Practices page:
  - [ ] List practices
  - [ ] Create practice form
  - [ ] Edit practice
  - [ ] Delete practice (with confirmation)
- [ ] Templates page:
  - [ ] List templates by type
  - [ ] Create template
  - [ ] Template preview con variables
  - [ ] Character counter

**Tests**:

- [ ] Practice service tests
- [ ] Template service tests
- [ ] Frontend form validation tests

### Semana 3-4: Campaigns & CSV Upload

**Backend**:

- [ ] Campaign CRUD:
  - [ ] `POST /campaigns`
  - [ ] `GET /campaigns`
  - [ ] `GET /campaigns/:id`
  - [ ] `PUT /campaigns/:id`
  - [ ] `DELETE /campaigns/:id`
- [ ] CSV processing:
  - [ ] Validate CSV structure
  - [ ] Parse patient data
  - [ ] Validate phones (Ecuador format)
  - [ ] Create patients in bulk
  - [ ] Return validation errors

**Frontend**:

- [ ] Campaigns page:
  - [ ] Campaign list with stats
  - [ ] Create campaign modal
  - [ ] CSV upload component:
    - [ ] Drag & drop
    - [ ] File validation
    - [ ] Preview table
    - [ ] Error highlighting
  - [ ] Campaign detail page

**CSV Format**:

```csv
name,phone,email,appointmentTime,hasConsent
Juan Pérez,+593999999999,juan@email.com,2026-01-15T10:00:00,true
María López,+593988888888,maria@email.com,2026-01-15T11:30:00,true
```

**Tests**:

- [ ] CSV parser tests
- [ ] Campaign service tests
- [ ] CSV upload e2e test

### Semana 5-6: Patients & Messages (Mock)

**Backend**:

- [ ] Patient endpoints:
  - [ ] `GET /patients` (by workspace)
  - [ ] `GET /campaigns/:id/patients`
  - [ ] `PUT /patients/:id` (update contact info)
  - [ ] `DELETE /patients/:id` (soft delete)
- [ ] Message endpoints:
  - [ ] `GET /campaigns/:id/messages`
  - [ ] `POST /messages/:id/response` (simulate patient response)
- [ ] Mock message sending (sin Twilio aún):
  - [ ] Log to console
  - [ ] Save to DB with `sentAt` timestamp

**Frontend**:

- [ ] Patients page:
  - [ ] Patient list with filters
  - [ ] Patient detail modal
  - [ ] Edit patient
- [ ] Campaign detail:
  - [ ] Patient list in campaign
  - [ ] Message timeline
  - [ ] Simulate send button (testing)
  - [ ] Manual response input (testing)

**BullMQ Setup**:

- [ ] Configure BullMQ in worker
- [ ] Job: `send-initial-message`
  - [ ] Schedule based on `appointmentTime + scheduledHoursAfter`
  - [ ] Mock send (log)
- [ ] Job: `handle-response`
  - [ ] Parse rating (1-5)
  - [ ] Determine happy/unhappy
  - [ ] Enqueue followup
- [ ] Job: `send-followup`
  - [ ] Mock send appropriate message
- [ ] Bull Board UI: `http://localhost:3000/admin/queues`

**Deliverables**:

- 🎯 Full campaign flow sin integraciones externas
- 🎯 CSV upload funcional con validación
- 🎯 Jobs procesándose en background
- 🎯 ~50 tests pasando

---

## Phase 3: Integrations (4 semanas)

**Fecha**: Feb 16 - Mar 15, 2026  
**Goal**: Twilio SMS, WhatsApp, SendGrid funcionando en desarrollo

### Semana 1: Twilio SMS

**Backend**:

- [ ] `libs/integrations/twilio`:
  - [ ] `TwilioService.sendSMS()`
  - [ ] Error handling
  - [ ] Rate limiting
  - [ ] Cost tracking
- [ ] Actualizar processors:
  - [ ] Reemplazar mocks con Twilio real
  - [ ] Handle Twilio errors (invalid number, etc.)
- [ ] Webhook: `POST /webhooks/twilio/sms`
  - [ ] Verify signature
  - [ ] Parse incoming message
  - [ ] Match to Patient by phone
  - [ ] Trigger `handle-response` job

**Testing**:

- [ ] Send test SMS a tu número
- [ ] Responder y verificar webhook
- [ ] Test error handling

**Costo estimado**: $0.05/SMS en Ecuador

### Semana 2: WhatsApp Business API

**Backend**:

- [ ] `libs/integrations/whatsapp`:
  - [ ] `WhatsAppService.sendMessage()`
  - [ ] Template messages (Meta requirement)
- [ ] Webhook: `POST /webhooks/whatsapp`
  - [ ] Verify Meta signature
  - [ ] Parse incoming message
  - [ ] Trigger `handle-response` job
- [ ] Config:
  - [ ] Channel preference per workspace (SMS vs WhatsApp)

**Frontend**:

- [ ] Workspace settings:
  - [ ] Toggle SMS/WhatsApp
  - [ ] WhatsApp Business account linking

**Meta Approval**:

- [ ] Submit app for review
- [ ] Get message templates approved

**Testing**:

- [ ] Send test WhatsApp
- [ ] Test conversation flow

### Semana 3: SendGrid Email

**Backend**:

- [ ] `libs/integrations/sendgrid`:
  - [ ] `EmailService.sendTransactional()`
  - [ ] Templates:
    - [ ] Welcome email
    - [ ] User invitation
    - [ ] Low credits alert
    - [ ] Weekly report
- [ ] Trigger emails:
  - [ ] On user registration
  - [ ] On user invitation
  - [ ] On low credits (< 10)

**Frontend**:

- [ ] Email preview page (dev only)

**Testing**:

- [ ] Send test emails
- [ ] Verify links work

### Semana 4: Google Places API

**Backend**:

- [ ] `libs/integrations/google`:
  - [ ] `GooglePlacesService.searchPlace()`
  - [ ] `GooglePlacesService.getReviewUrl()`
- [ ] Practice form:
  - [ ] Autocomplete practice address
  - [ ] Get Google Place ID
  - [ ] Generate review link

**Frontend**:

- [ ] Practice form:
  - [ ] Google Places autocomplete
  - [ ] Display review link
  - [ ] Test review link button

**Deliverables**:

- 🎯 SMS/WhatsApp enviándose realmente
- 🎯 Webhooks procesando respuestas de pacientes
- 🎯 Emails transaccionales funcionando
- 🎯 Google Review links generándose

---

## Phase 4: Analytics (4 semanas)

**Fecha**: Mar 16 - Abr 15, 2026  
**Goal**: Dashboard con métricas, reports, exports

### Semana 1-2: Core Metrics

**Backend**:

- [ ] Analytics endpoints:
  - [ ] `GET /analytics/workspace` - Overview metrics
  - [ ] `GET /analytics/campaigns/:id` - Campaign stats
  - [ ] `GET /analytics/practices/:id` - Practice stats
  - [ ] `GET /analytics/timeline` - Time series data
- [ ] Queries:
  - [ ] Total messages sent
  - [ ] Response rate
  - [ ] Average rating
  - [ ] NPS score
  - [ ] Conversion rate (responded → Google Review)
  - [ ] Rating distribution (1-5)
  - [ ] Messages per day (last 30 days)

**Frontend**:

- [ ] Analytics page:
  - [ ] KPI cards (total sent, response rate, NPS)
  - [ ] Rating distribution chart (bar chart)
  - [ ] Messages timeline (line chart)
  - [ ] Top performing campaigns table
  - [ ] Filter by date range
  - [ ] Filter by practice

**Tests**:

- [ ] Analytics calculation tests
- [ ] Time series tests

### Semana 3: Reports & Exports

**Backend**:

- [ ] Export endpoints:
  - [ ] `GET /campaigns/:id/export` - CSV
  - [ ] `GET /analytics/report` - PDF
- [ ] Report generation:
  - [ ] Weekly summary email (via SendGrid)
  - [ ] PDF report with charts

**Frontend**:

- [ ] Export buttons:
  - [ ] Download campaign CSV
  - [ ] Download PDF report
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
