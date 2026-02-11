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

All domain endpoints are currently in-memory scaffolds under `/api`:

- `GET /api/organizations`
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

Notes:

- Agent create/update payloads now persist both `prompt` and `promptVersion`.
- Settings keys are validated on update (`sk-` OpenAI, `dg-` Deepgram, `AC` Twilio SID, `rm-` Rime).
- Settings history is tracked in-memory with changed field names and timestamp.
- Settings updates can include `auditActor` and `changeReason`, which are stored in history.
- Settings history supports filters via query params: `actor`, `fromDate`, `toDate`, and `changedField`.

Quick check:

```bash
curl http://localhost:8000/api/dashboard/overview
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
