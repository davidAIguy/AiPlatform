# Backend Scaffold

## Run locally

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --port 8000
```

Health endpoint:

```bash
curl http://localhost:8000/health
```

## Scaffolded API routes

Current API routes under `/api`:

- `GET /api/organizations`
- `POST /api/auth/login`
- `GET /api/agents`
- `POST /api/agents`
- `PATCH /api/agents/{agent_id}`
- `DELETE /api/agents/{agent_id}`
- `GET /api/calls`
- `GET /api/dashboard/overview`
- `GET /api/dashboard/usage`
- `GET /api/settings`
- `PATCH /api/settings`
- `GET /api/settings/history`
- `GET /api/settings/history/meta`
- `POST /api/twilio/voice`
- `POST /api/twilio/gather`
- `POST /api/twilio/voice-finish`
- `POST /api/twilio/recording`
- `POST /api/twilio/status`

Notes:

- Settings and settings history now persist in SQLite (`DATABASE_URL`) instead of in-memory only.
- Auth uses bearer tokens from `/api/auth/login` and role checks (viewer/editor/admin) for settings endpoints.
- Agent create/update payloads now persist both `prompt` and `promptVersion`.
- Settings keys are validated on update as non-empty values.
- Settings history is stored in SQLite with changed field names and timestamp.
- Settings updates can include `auditActor` and `changeReason`, which are stored in history.
- Twilio greeting/reply generation uses provider keys from settings and can fall back to `OPENAI_API_KEY` / `RIME_API_KEY` env vars when stored values are masked placeholders.
- Settings history supports pagination/filter query params: `limit`, `offset`, `actor`, `fromDate`, `toDate`, and `changedField`.
- Settings history metadata endpoint returns available actors/fields plus totals for richer filter UIs.
- Cross-origin access is controlled by `CORS_ALLOW_ORIGINS`.
- Railway deployment guide: `RAILWAY_SETUP.md`.
- Recommended Railway API builder: Dockerfile (`Dockerfile.api`).
- Twilio inbound webhook flow stores incoming calls in `call_sessions`, handles one speech turn via `/twilio/gather`, and updates final status via callback.

Quick check:

```bash
curl http://localhost:8000/api/dashboard/overview
```

Auth quick check:

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@voicenexus.ai","password":"admin123"}'
```

Run API smoke tests:

```bash
pip install -r backend/requirements.txt
python -m pytest backend/tests/test_smoke_api.py
```

Run all project checks from repo root:

```bash
npm run check
```

Run end-to-end browser checks (Playwright):

```bash
npx playwright install chromium
npm run e2e
```
