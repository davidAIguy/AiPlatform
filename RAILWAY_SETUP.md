# Railway Staging Setup

This project can be deployed to Railway with two services:

- `api` (FastAPI backend)
- `web` (Vite frontend)

## 1) Create project and services

1. Create a Railway project from this GitHub repo.
2. Add a **Postgres** service in the same project.
3. Add service `api` from the repo.
4. Add service `web` from the repo.

## 2) Configure `api` service

Recommended: use Dockerfile build for API to avoid monorepo auto-detection issues.

In service settings:

1. Builder: **Dockerfile**
2. Dockerfile path: `Dockerfile.api`
3. Leave build/start commands empty when using Dockerfile builder.

Required variables:

- `DATABASE_URL` = value from Railway Postgres service
- `AUTH_ENABLED=true`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `EDITOR_EMAIL`, `EDITOR_PASSWORD`
- `VIEWER_EMAIL`, `VIEWER_PASSWORD`
- `ADMIN_API_TOKEN`, `EDITOR_API_TOKEN`, `VIEWER_API_TOKEN`
- `CORS_ALLOW_ORIGINS` = frontend public URL, e.g. `https://web-production.up.railway.app`

## 3) Configure `web` service

Use these commands in service settings:

- Build command:

```bash
npm ci && npm run build
```

- Start command:

```bash
npm run preview -- --host 0.0.0.0 --port $PORT
```

Required variable:

- `VITE_API_BASE_URL` = backend public URL, e.g. `https://api-production.up.railway.app`

## 4) Smoke test in staging

After both services are healthy:

1. Open web URL and login as admin.
2. Go to Settings, make a small change, Save.
3. Confirm history entry appears.

API checks:

```bash
curl https://<api-url>/health
curl -X POST https://<api-url>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@voicenexus.ai","password":"admin123"}'
```

## 5) Twilio inbound call flow test

In Twilio Console:

1. Open **Phone Numbers** -> your number.
2. Voice webhook URL:

```text
https://<api-url>/api/twilio/voice
```

3. Voice webhook method: **HTTP POST**.
4. Status callback URL:

```text
https://<api-url>/api/twilio/status
```

5. Status callback events: at least `completed`, `answered`, `busy`, `failed`, `no-answer`.

`/api/twilio/voice` now asks caller to leave a short message and records it. The recording URL is stored by `/api/twilio/recording` automatically via TwiML callback.

Then place a call to the Twilio number and verify on web:

- new entry appears in `/call-logs`
- completed/busy/failed status is reflected after callback
- duration updates after call ends

## 6) CI and E2E

GitHub Actions already runs:

- `npm run check`
- `npm run e2e`

on push and PR.
