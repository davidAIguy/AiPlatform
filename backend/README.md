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
- `GET /api/calls`
- `GET /api/dashboard/overview`
- `GET /api/dashboard/usage`

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
