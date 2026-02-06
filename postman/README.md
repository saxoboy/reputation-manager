# Postman Collection - Reputation Manager API

## 📦 Archivos

| Archivo                                          | Descripción                           |
| ------------------------------------------------ | ------------------------------------- |
| `Reputation-Manager-API.postman_collection.json` | Colección completa — **79 endpoints** |
| `Local.postman_environment.json`                 | Environment para desarrollo local     |

## 🚀 Importar en Postman

1. Abre Postman
2. Click en **Import** (arriba izquierda)
3. Arrastra ambos archivos JSON o selecciónalos
4. Click en **Import**
5. Selecciona el environment **"Reputation Manager - Local"** en el dropdown superior derecho

## 🔧 Variables de Environment

| Variable      | Valor Default           |          Auto-guardado          |
| ------------- | ----------------------- | :-----------------------------: |
| `baseUrl`     | `http://localhost:3000` |                —                |
| `workspaceId` | —                       | ✅ (al crear/obtener workspace) |
| `practiceId`  | —                       |     ✅ (al crear practice)      |
| `campaignId`  | —                       |     ✅ (al crear campaign)      |
| `patientId`   | —                       |      ✅ (al crear patient)      |
| `messageId`   | —                       |      ✅ (al crear message)      |
| `templateId`  | —                       |     ✅ (al crear template)      |
| `userId`      | —                       |             Manual              |

Las variables se guardan automáticamente al ejecutar los requests de creación (POST).

## 🔐 Autenticación

**Better Auth usa cookies** — no necesitas copiar/pegar tokens.

### Configuración importante en Postman:

1. Ve a **Settings** (⚙️) → **General**
2. Activa **"Automatically follow redirects"**
3. Activa **"Enable cookie jar"** (crucial)

### Flujo:

1. Ejecuta **Auth → Sign In** (o Sign Up)
2. Postman guarda la cookie de sesión automáticamente
3. Todos los requests siguientes envían la cookie — no necesitas hacer nada más

## 📝 Flujo de Uso Recomendado

```
1. Auth → Sign Up              (crear cuenta)
2. Auth → Sign In              (o si ya tienes cuenta)
3. Workspaces → Create         (workspaceId se guarda)
4. Practices → Create          (practiceId se guarda)
5. Campaigns → Create          (campaignId se guarda, incluye pacientes)
6. Messages → List             (ver mensajes generados)
7. Analytics → Workspace       (ver métricas)
8. Billing → Get Info          (ver plan y créditos)
```

## 📋 Endpoints Disponibles (79 total)

### Health (2)

| Método | Endpoint  | Descripción                                   |
| ------ | --------- | --------------------------------------------- |
| GET    | `/api`    | API status                                    |
| GET    | `/health` | Health check con verificación de DB (200/503) |

### Auth (4)

| Método | Endpoint                  | Descripción                           |
| ------ | ------------------------- | ------------------------------------- |
| POST   | `/api/auth/sign-up/email` | Registro con email/password           |
| POST   | `/api/auth/sign-in/email` | Login (guarda cookie automáticamente) |
| GET    | `/api/auth/get-session`   | Obtener sesión actual                 |
| POST   | `/api/auth/sign-out`      | Cerrar sesión                         |

### Workspaces (7)

| Método | Endpoint                               | Descripción                         |
| ------ | -------------------------------------- | ----------------------------------- |
| GET    | `/api/workspaces`                      | Listar mis workspaces               |
| POST   | `/api/workspaces`                      | Crear workspace                     |
| GET    | `/api/workspaces/current`              | Workspace activo                    |
| GET    | `/api/workspaces/:id`                  | Ver workspace                       |
| PUT    | `/api/workspaces/:id`                  | Actualizar (OWNER)                  |
| DELETE | `/api/workspaces/:id`                  | Eliminar (OWNER)                    |
| PATCH  | `/api/workspaces/:id/channel-settings` | Config canales (SMS/WhatsApp/Email) |

### Practices (8)

| Método | Endpoint                                                    | Descripción             |
| ------ | ----------------------------------------------------------- | ----------------------- |
| GET    | `/api/workspaces/:wId/practices`                            | Listar practices        |
| POST   | `/api/workspaces/:wId/practices`                            | Crear practice          |
| GET    | `/api/workspaces/:wId/practices/:id`                        | Ver practice            |
| PUT    | `/api/workspaces/:wId/practices/:id`                        | Actualizar              |
| DELETE | `/api/workspaces/:wId/practices/:id`                        | Eliminar                |
| GET    | `/api/workspaces/:wId/practices/search/google-places`       | Buscar en Google Places |
| GET    | `/api/workspaces/:wId/practices/autocomplete/google-places` | Autocomplete Google     |
| GET    | `/api/workspaces/:wId/practices/google-places/:placeId`     | Detalles de lugar       |

### Workspace Users (4)

| Método | Endpoint                                  | Descripción     |
| ------ | ----------------------------------------- | --------------- |
| GET    | `/api/workspaces/:wId/users`              | Listar usuarios |
| POST   | `/api/workspaces/:wId/users/invite`       | Invitar usuario |
| PUT    | `/api/workspaces/:wId/users/:userId/role` | Cambiar rol     |
| DELETE | `/api/workspaces/:wId/users/:userId`      | Remover usuario |

### Campaigns (7)

| Método | Endpoint                                    | Descripción                   |
| ------ | ------------------------------------------- | ----------------------------- |
| GET    | `/api/workspaces/:wId/campaigns`            | Listar campañas               |
| POST   | `/api/workspaces/:wId/campaigns`            | Crear campaña (con pacientes) |
| GET    | `/api/workspaces/:wId/campaigns/:id`        | Ver campaña                   |
| PUT    | `/api/workspaces/:wId/campaigns/:id`        | Actualizar                    |
| DELETE | `/api/workspaces/:wId/campaigns/:id`        | Eliminar                      |
| POST   | `/api/workspaces/:wId/campaigns/:id/upload` | Upload CSV de pacientes       |
| GET    | `/api/workspaces/:wId/campaigns/:id/export` | Exportar campaña              |

### Patients (8)

| Método | Endpoint                                       | Descripción                                        |
| ------ | ---------------------------------------------- | -------------------------------------------------- |
| GET    | `/api/workspaces/:wId/patients`                | Listar (filtros: campaignId, hasConsent, optedOut) |
| GET    | `/api/workspaces/:wId/patients/stats`          | Estadísticas                                       |
| GET    | `/api/workspaces/:wId/patients/:id`            | Ver paciente                                       |
| POST   | `/api/workspaces/:wId/patients`                | Crear paciente                                     |
| PUT    | `/api/workspaces/:wId/patients/:id`            | Actualizar                                         |
| DELETE | `/api/workspaces/:wId/patients/:id`            | Eliminar                                           |
| POST   | `/api/workspaces/:wId/patients/:id/opt-out`    | Opt-out (no más mensajes)                          |
| GET    | `/api/workspaces/:wId/campaigns/:cId/patients` | Listar por campaña                                 |

### Messages (9)

| Método | Endpoint                                       | Descripción                                           |
| ------ | ---------------------------------------------- | ----------------------------------------------------- |
| GET    | `/api/workspaces/:wId/messages`                | Listar (filtros: campaignId, patientId, status, type) |
| GET    | `/api/workspaces/:wId/messages/stats`          | Estadísticas                                          |
| GET    | `/api/workspaces/:wId/messages/:id`            | Ver mensaje                                           |
| POST   | `/api/workspaces/:wId/messages`                | Crear mensaje                                         |
| PUT    | `/api/workspaces/:wId/messages/:id`            | Actualizar                                            |
| DELETE | `/api/workspaces/:wId/messages/:id`            | Eliminar                                              |
| POST   | `/api/workspaces/:wId/messages/:id/response`   | Simular respuesta de paciente                         |
| GET    | `/api/workspaces/:wId/campaigns/:cId/messages` | Listar por campaña                                    |
| GET    | `/api/workspaces/:wId/patients/:pId/messages`  | Listar por paciente                                   |

### Templates (6)

| Método | Endpoint                                       | Descripción        |
| ------ | ---------------------------------------------- | ------------------ |
| GET    | `/api/workspaces/:wId/templates`               | Listar plantillas  |
| POST   | `/api/workspaces/:wId/templates`               | Crear plantilla    |
| GET    | `/api/workspaces/:wId/templates/:id`           | Ver plantilla      |
| PUT    | `/api/workspaces/:wId/templates/:id`           | Actualizar         |
| DELETE | `/api/workspaces/:wId/templates/:id`           | Eliminar           |
| POST   | `/api/workspaces/:wId/templates/:id/duplicate` | Duplicar plantilla |

### Analytics (10)

| Método | Endpoint                                           | Descripción                      |
| ------ | -------------------------------------------------- | -------------------------------- |
| GET    | `/api/workspaces/:wId/analytics`                   | Analytics generales (NPS, rates) |
| GET    | `/api/workspaces/:wId/analytics/campaigns/:cId`    | Analytics de campaña             |
| GET    | `/api/workspaces/:wId/analytics/practices/:pId`    | Analytics de practice            |
| GET    | `/api/workspaces/:wId/analytics/export/csv`        | Exportar CSV                     |
| GET    | `/api/workspaces/:wId/analytics/export/pdf`        | Exportar PDF                     |
| GET    | `/api/workspaces/:wId/analytics/compare/practices` | Comparar practices               |
| GET    | `/api/workspaces/:wId/analytics/compare/campaigns` | Comparar campañas                |
| GET    | `/api/workspaces/:wId/analytics/compare/periods`   | Comparar períodos                |
| GET    | `/api/workspaces/:wId/analytics/cohorts`           | Análisis de cohortes             |
| GET    | `/api/workspaces/:wId/analytics/trends`            | Tendencias response rate         |

### Billing (11)

| Método | Endpoint                                       | Descripción                |
| ------ | ---------------------------------------------- | -------------------------- |
| GET    | `/api/workspaces/:wId/billing`                 | Info billing actual        |
| GET    | `/api/workspaces/:wId/billing/plans`           | Planes disponibles         |
| GET    | `/api/workspaces/:wId/billing/credit-packages` | Paquetes de créditos       |
| POST   | `/api/workspaces/:wId/billing/subscribe`       | Crear suscripción (Stripe) |
| POST   | `/api/workspaces/:wId/billing/credits`         | Comprar créditos           |
| POST   | `/api/workspaces/:wId/billing/cancel`          | Cancelar suscripción       |
| POST   | `/api/workspaces/:wId/billing/resume`          | Reactivar suscripción      |
| GET    | `/api/workspaces/:wId/billing/portal`          | URL Stripe Customer Portal |
| GET    | `/api/workspaces/:wId/billing/transactions`    | Historial de transacciones |
| GET    | `/api/workspaces/:wId/billing/can-send`        | ¿Tiene créditos?           |
| GET    | `/api/workspaces/:wId/billing/credits-alert`   | Alerta de créditos bajos   |

### Weekly Reports (3)

| Método | Endpoint                                     | Descripción              |
| ------ | -------------------------------------------- | ------------------------ |
| GET    | `/api/workspaces/:wId/weekly-reports/config` | Config de reportes       |
| PUT    | `/api/workspaces/:wId/weekly-reports/config` | Actualizar config        |
| POST   | `/api/workspaces/:wId/weekly-reports/test`   | Enviar reporte de prueba |

### Webhooks (4)

| Método | Endpoint                   | Descripción                            |
| ------ | -------------------------- | -------------------------------------- |
| POST   | `/api/webhooks/twilio/sms` | SMS entrante (Twilio)                  |
| GET    | `/api/webhooks/whatsapp`   | Verificación WhatsApp (Meta Challenge) |
| POST   | `/api/webhooks/whatsapp`   | Mensaje entrante WhatsApp              |
| POST   | `/api/webhooks/stripe`     | Eventos Stripe (suscripciones, pagos)  |

## 🔄 Roles y Permisos

| Rol              | CRUD Workspace |  CRUD Practices   |       Invite Users       | Ver Analytics | Billing |
| ---------------- | :------------: | :---------------: | :----------------------: | :-----------: | :-----: |
| **OWNER**        |       ✅       |        ✅         |        ✅ (todos)        |      ✅       |   ✅    |
| **DOCTOR**       |       ❌       |        ✅         | ✅ (DOCTOR/RECEPTIONIST) |      ✅       |   ❌    |
| **RECEPTIONIST** |       ❌       | 👁️ (solo lectura) |            ❌            |      👁️       |   ❌    |

## 🐛 Troubleshooting

### "404 Not Found"

- Verifica que el API esté corriendo: `pnpm dev`
- Debe aparecer: `🚀 API is running on: http://localhost:3000/api`

### "Unauthorized"

1. Ejecuta primero **Auth → Sign In**
2. Verifica que Cookie Jar esté habilitado en Settings
3. Las sesiones duran 7 días — vuelve a hacer login si expiró

### "Workspace not found"

- Verifica que `{{workspaceId}}` tiene valor (usa Quick Look 👁️)
- Ejecuta **Workspaces → Get Current** para obtenerlo

### "Cannot connect to server"

```bash
# Levantar servicios
docker-compose up -d   # PostgreSQL + Redis
pnpm dev               # API + Web
```

## 💡 Tips

1. Los requests de creación (POST) auto-guardan IDs en las variables
2. Usa **Quick Look** (👁️) para ver valores actuales de variables
3. Query params opcionales están deshabilitados por default — habilítalos según necesites
4. El endpoint `Simulate Patient Response` es útil para testing sin SMS reales
