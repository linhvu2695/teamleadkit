# TeamLeadKit Backend

FastAPI-based backend for TeamLeadKit, providing work and team management APIs backed by SQLite and an external Link API.

## Tech Stack

- **FastAPI** — web framework
- **Uvicorn** — ASGI server
- **Pydantic** — validation and settings
- **aiosqlite** — async SQLite
- **httpx** — HTTP client for Link API
- **python-dotenv** — environment config

## Project Structure

```
backend/
├── main.py                 # FastAPI app, CORS, lifespan, routers
├── requirements.txt
├── Makefile                # setup, run, check-python
├── .env.example
│
└── app/
    ├── api/
    │   ├── health_api.py   # /api/health
    │   └── work_api.py     # /api/work/* endpoints
    │
    ├── core/
    │   ├── config.py       # Pydantic settings (db_path, etc.)
    │   ├── database.py     # SQLite singleton, task CRUD
    │   └── cache.py        # In-memory cache (TTL per key)
    │
    ├── classes/work/
    │   ├── work.py         # TaskDetail, DocumentDetail, request models
    │   ├── type.py         # TaskType enum
    │   ├── status.py       # TaskStatus, COMPLETE_STATUSES
    │   └── team.py         # TEAM_MEMBERS
    │
    ├── services/work/
    │   └── work_service.py # Business logic, Link API, cache, DB
    │
    └── utils/string/
        └── string_utils.py # Parsing helpers
```

## Key Areas

| Directory | Purpose |
|-----------|---------|
| **`api/`** | Route handlers: health check and work endpoints |
| **`core/`** | Config, SQLite database, in-memory cache |
| **`classes/work/`** | Domain models: `TaskDetail`, `TaskType`, `TaskStatus`, `TEAM_MEMBERS` |
| **`services/work/`** | `WorkService`: fetches from Link API, caches, stores in SQLite |
| **`utils/`** | Shared helpers (e.g. string parsing) |

## Data Flow

- **Link API** (external) — fetches task details from Link (orangelogic.com)
- **SQLite** — local cache of tasks and monitored state
- **In-memory cache** — short-lived cache for incomplete/completed workload lists

## Getting Started

```bash
make setup   # Create venv, install deps (Python 3.11+)
make run     # Start dev server (uvicorn --reload)
```

Optional `.env`:

- `DB_PATH` — override default SQLite path (`./data/teamleadkit.db`)
