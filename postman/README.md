# Postman Collection - Reputation Manager API

## 📦 Files

| File                                             | Description                             |
| ------------------------------------------------ | --------------------------------------- |
| `Reputation-Manager-API.postman_collection.json` | Complete collection — **79 endpoints**  |
| `Local.postman_environment.json`                 | Environment for local development       |
| `Production.postman_environment.json`            | Environment for production (Railway) ✨ |

## 🚀 Import into Postman

1. Open Postman
2. Click **Import** (top left)
3. Drag the **3 JSON files** or select them:
   - `Reputation-Manager-API.postman_collection.json`
   - `Local.postman_environment.json`
   - `Production.postman_environment.json`
4. Click **Import**
5. Select the environment in the dropdown (top right):
   - **"Reputation Manager - Local"** for development
   - **"Reputation Manager - Production"** for Railway

## 🔧 Environment Variables

### Local (Development)

| Variable      | Default Value           |          Auto-saved          |
| ------------- | ----------------------- | :--------------------------: |
| `baseUrl`     | `http://localhost:3333` |              —               |
| `apiUrl`      | `http://localhost:3333` |              —               |
| `workerUrl`   | `http://localhost:3001` |              —               |
| `webUrl`      | `http://localhost:4000` |              —               |
| `workspaceId` | —                       | ✅ (on create/get workspace) |
| `practiceId`  | —                       |   ✅ (on create practice)    |
| `campaignId`  | —                       |   ✅ (on create campaign)    |
| `patientId`   | —                       |    ✅ (on create patient)    |
| `messageId`   | —                       |    ✅ (on create message)    |
| `templateId`  | —                       |   ✅ (on create template)    |
| `userId`      | —                       |            Manual            |

### Production (Railway)

| Variable                          | Value                                          |          Auto-saved          |
| --------------------------------- | ---------------------------------------------- | :--------------------------: |
| `baseUrl`                         | `https://api-production-d042.up.railway.app`       |              —               |
| `apiUrl`                          | `https://api-production-d042.up.railway.app`       |              —               |
| `workerUrl`                       | N/A (private network only)                         |              —               |
| `webUrl`                          | `https://reputation-manager-six.vercel.app` ✨ |              —               |
| `workspaceId`                     | —                                              | ✅ (on create/get workspace) |
| _(other variables same as Local)_ |                                                |                              |

**Note:** Worker has no public endpoint in production (private communication with API only).

Variables are automatically saved when executing creation requests (POST).

## 🔐 Authentication

**Better Auth uses cookies** — no need to copy/paste tokens.

### Important Postman configuration:

1. Go to **Settings** (⚙️) → **General**
2. Enable **"Automatically follow redirects"**
3. Enable **"Enable cookie jar"** (crucial)

### Flow:

1. Execute **Auth → Sign In** (or Sign Up)
2. Postman saves the session cookie automatically
3. All subsequent requests send the cookie — no additional action needed

## 📝 Recommended Usage Flow

```
1. Auth → Sign Up              (create account)
2. Auth → Sign In              (or if you already have an account)
3. Workspaces → Create         (workspaceId is saved)
4. Practices → Create          (practiceId is saved)
5. Campaigns → Create          (campaignId is saved, includes patients)
6. Messages → List             (view generated messages)
7. Analytics → Workspace       (view metrics)
8. Billing → Get Info          (view plan and credits)
```

## 📋 Available Endpoints (79 total)

### Health (2)

| Method | Endpoint  | Description                                 |
| ------ | --------- | ------------------------------------------- |
| GET    | `/api`    | API status                                  |
| GET    | `/health` | Health check with DB verification (200/503) |

### Auth (4)

| Method | Endpoint                  | Description                        |
| ------ | ------------------------- | ---------------------------------- |
| POST   | `/api/auth/sign-up/email` | Register with email/password       |
| POST   | `/api/auth/sign-in/email` | Login (saves cookie automatically) |
| GET    | `/api/auth/get-session`   | Get current session                |
| POST   | `/api/auth/sign-out`      | Sign out                           |

### Workspaces (7)

| Method | Endpoint                               | Description                             |
| ------ | -------------------------------------- | --------------------------------------- |
| GET    | `/api/workspaces`                      | List my workspaces                      |
| POST   | `/api/workspaces`                      | Create workspace                        |
| GET    | `/api/workspaces/current`              | Active workspace                        |
| GET    | `/api/workspaces/:id`                  | View workspace                          |
| PUT    | `/api/workspaces/:id`                  | Update (OWNER)                          |
| DELETE | `/api/workspaces/:id`                  | Delete (OWNER)                          |
| PATCH  | `/api/workspaces/:id/channel-settings` | Configure channels (SMS/WhatsApp/Email) |

### Practices (8)

| Method | Endpoint                                                    | Description          |
| ------ | ----------------------------------------------------------- | -------------------- |
| GET    | `/api/workspaces/:wId/practices`                            | List practices       |
| POST   | `/api/workspaces/:wId/practices`                            | Create practice      |
| GET    | `/api/workspaces/:wId/practices/:id`                        | View practice        |
| PUT    | `/api/workspaces/:wId/practices/:id`                        | Update               |
| DELETE | `/api/workspaces/:wId/practices/:id`                        | Delete               |
| GET    | `/api/workspaces/:wId/practices/search/google-places`       | Search Google Places |
| GET    | `/api/workspaces/:wId/practices/autocomplete/google-places` | Google autocomplete  |
| GET    | `/api/workspaces/:wId/practices/google-places/:placeId`     | Place details        |

### Workspace Users (4)

| Method | Endpoint                                  | Description |
| ------ | ----------------------------------------- | ----------- |
| GET    | `/api/workspaces/:wId/users`              | List users  |
| POST   | `/api/workspaces/:wId/users/invite`       | Invite user |
| PUT    | `/api/workspaces/:wId/users/:userId/role` | Change role |
| DELETE | `/api/workspaces/:wId/users/:userId`      | Remove user |

### Campaigns (7)

| Method | Endpoint                                    | Description                     |
| ------ | ------------------------------------------- | ------------------------------- |
| GET    | `/api/workspaces/:wId/campaigns`            | List campaigns                  |
| POST   | `/api/workspaces/:wId/campaigns`            | Create campaign (with patients) |
| GET    | `/api/workspaces/:wId/campaigns/:id`        | View campaign                   |
| PUT    | `/api/workspaces/:wId/campaigns/:id`        | Update                          |
| DELETE | `/api/workspaces/:wId/campaigns/:id`        | Delete                          |
| POST   | `/api/workspaces/:wId/campaigns/:id/upload` | Upload CSV of patients          |
| GET    | `/api/workspaces/:wId/campaigns/:id/export` | Export campaign                 |

### Patients (8)

| Method | Endpoint                                       | Description                                      |
| ------ | ---------------------------------------------- | ------------------------------------------------ |
| GET    | `/api/workspaces/:wId/patients`                | List (filters: campaignId, hasConsent, optedOut) |
| GET    | `/api/workspaces/:wId/patients/stats`          | Statistics                                       |
| GET    | `/api/workspaces/:wId/patients/:id`            | View patient                                     |
| POST   | `/api/workspaces/:wId/patients`                | Create patient                                   |
| PUT    | `/api/workspaces/:wId/patients/:id`            | Update                                           |
| DELETE | `/api/workspaces/:wId/patients/:id`            | Delete                                           |
| POST   | `/api/workspaces/:wId/patients/:id/opt-out`    | Opt-out (no more messages)                       |
| GET    | `/api/workspaces/:wId/campaigns/:cId/patients` | List by campaign                                 |

### Messages (9)

| Method | Endpoint                                       | Description                                         |
| ------ | ---------------------------------------------- | --------------------------------------------------- |
| GET    | `/api/workspaces/:wId/messages`                | List (filters: campaignId, patientId, status, type) |
| GET    | `/api/workspaces/:wId/messages/stats`          | Statistics                                          |
| GET    | `/api/workspaces/:wId/messages/:id`            | View message                                        |
| POST   | `/api/workspaces/:wId/messages`                | Create message                                      |
| PUT    | `/api/workspaces/:wId/messages/:id`            | Update                                              |
| DELETE | `/api/workspaces/:wId/messages/:id`            | Delete                                              |
| POST   | `/api/workspaces/:wId/messages/:id/response`   | Simulate patient response                           |
| GET    | `/api/workspaces/:wId/campaigns/:cId/messages` | List by campaign                                    |
| GET    | `/api/workspaces/:wId/patients/:pId/messages`  | List by patient                                     |

### Templates (6)

| Method | Endpoint                                       | Description        |
| ------ | ---------------------------------------------- | ------------------ |
| GET    | `/api/workspaces/:wId/templates`               | List templates     |
| POST   | `/api/workspaces/:wId/templates`               | Create template    |
| GET    | `/api/workspaces/:wId/templates/:id`           | View template      |
| PUT    | `/api/workspaces/:wId/templates/:id`           | Update             |
| DELETE | `/api/workspaces/:wId/templates/:id`           | Delete             |
| POST   | `/api/workspaces/:wId/templates/:id/duplicate` | Duplicate template |

### Analytics (10)

| Method | Endpoint                                           | Description                    |
| ------ | -------------------------------------------------- | ------------------------------ |
| GET    | `/api/workspaces/:wId/analytics`                   | General analytics (NPS, rates) |
| GET    | `/api/workspaces/:wId/analytics/campaigns/:cId`    | Campaign analytics             |
| GET    | `/api/workspaces/:wId/analytics/practices/:pId`    | Practice analytics             |
| GET    | `/api/workspaces/:wId/analytics/export/csv`        | Export CSV                     |
| GET    | `/api/workspaces/:wId/analytics/export/pdf`        | Export PDF                     |
| GET    | `/api/workspaces/:wId/analytics/compare/practices` | Compare practices              |
| GET    | `/api/workspaces/:wId/analytics/compare/campaigns` | Compare campaigns              |
| GET    | `/api/workspaces/:wId/analytics/compare/periods`   | Compare periods                |
| GET    | `/api/workspaces/:wId/analytics/cohorts`           | Cohort analysis                |
| GET    | `/api/workspaces/:wId/analytics/trends`            | Response rate trends           |

### Billing (11)

| Method | Endpoint                                       | Description                  |
| ------ | ---------------------------------------------- | ---------------------------- |
| GET    | `/api/workspaces/:wId/billing`                 | Current billing info         |
| GET    | `/api/workspaces/:wId/billing/plans`           | Available plans              |
| GET    | `/api/workspaces/:wId/billing/credit-packages` | Credit packages              |
| POST   | `/api/workspaces/:wId/billing/subscribe`       | Create subscription (Stripe) |
| POST   | `/api/workspaces/:wId/billing/credits`         | Purchase credits             |
| POST   | `/api/workspaces/:wId/billing/cancel`          | Cancel subscription          |
| POST   | `/api/workspaces/:wId/billing/resume`          | Resume subscription          |
| GET    | `/api/workspaces/:wId/billing/portal`          | Stripe Customer Portal URL   |
| GET    | `/api/workspaces/:wId/billing/transactions`    | Transaction history          |
| GET    | `/api/workspaces/:wId/billing/can-send`        | Has credits?                 |
| GET    | `/api/workspaces/:wId/billing/credits-alert`   | Low credits alert            |

### Weekly Reports (3)

| Method | Endpoint                                     | Description          |
| ------ | -------------------------------------------- | -------------------- |
| GET    | `/api/workspaces/:wId/weekly-reports/config` | Report configuration |
| PUT    | `/api/workspaces/:wId/weekly-reports/config` | Update configuration |
| POST   | `/api/workspaces/:wId/weekly-reports/test`   | Send test report     |

### Webhooks (4)

| Method | Endpoint                   | Description                             |
| ------ | -------------------------- | --------------------------------------- |
| POST   | `/api/webhooks/twilio/sms` | Incoming SMS (Twilio)                   |
| GET    | `/api/webhooks/whatsapp`   | WhatsApp verification (Meta Challenge)  |
| POST   | `/api/webhooks/whatsapp`   | Incoming WhatsApp message               |
| POST   | `/api/webhooks/stripe`     | Stripe events (subscriptions, payments) |

## 🔄 Roles & Permissions

| Role             | CRUD Workspace | CRUD Practices |       Invite Users       | View Analytics | Billing |
| ---------------- | :------------: | :------------: | :----------------------: | :------------: | :-----: |
| **OWNER**        |       ✅       |       ✅       |         ✅ (all)         |       ✅       |   ✅    |
| **DOCTOR**       |       ❌       |       ✅       | ✅ (DOCTOR/RECEPTIONIST) |       ✅       |   ❌    |
| **RECEPTIONIST** |       ❌       | 👁️ (read only) |            ❌            |       👁️       |   ❌    |

## 🐛 Troubleshooting

### "404 Not Found"

**Local:**

- Verify API is running: `pnpm dev:all`
- Should show: `🚀 API is running on: http://localhost:3333/api`

**Production:**

- Verify API service is "Online" in Railway
- Correct URL: `https://api-production-d042.up.railway.app`

### "Unauthorized"

1. Execute **Auth → Sign In** first
2. Verify Cookie Jar is enabled in Settings
3. Sessions last 7 days — log in again if expired

### "Workspace not found"

- Verify `{{workspaceId}}` has a value (use Quick Look 👁️)
- Execute **Workspaces → Get Current** to retrieve it

### "Cannot connect to server"

**Local:**

```bash
# Start services
docker-compose up -d   # PostgreSQL + Redis
pnpm dev:all           # API + Worker + Web
```

**Production:**

- Check status in Railway Dashboard
- Review API service logs in Railway

## 💡 Tips

1. Creation requests (POST) auto-save IDs to variables
2. Use **Quick Look** (👁️) to see current variable values
3. Optional query params are disabled by default — enable them as needed
4. The `Simulate Patient Response` endpoint is useful for testing without real SMS
