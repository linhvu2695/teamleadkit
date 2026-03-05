# TeamLeadKit

Lightweight work & team management toolkit extracted from the Aiven project. Designed so any team lead can pull, install, and run locally — no Docker, no external databases.

## Tech Stack

- **Frontend:** React 19 + Vite + Chakra UI + Recharts
- **Backend:** Python FastAPI + SQLite + in-memory cache
- **External:** Orange Logic Link API (for task data)

## Prerequisites

- **Node.js** >= 18
- **Python** 3.11+ (3.11.9 recommended — enforced via `.python-version`)
- A valid **Orange Logic Link API token**

If you use [pyenv](https://github.com/pyenv/pyenv), the `.python-version` file at the repo root will automatically select the correct Python. If you don't have 3.11.9 installed:

```bash
pyenv install 3.11.9
```

## Quick Start

### 1. Backend

```bash
cd backend
make setup   # creates venv with correct Python, installs deps
make run     # starts the FastAPI server on port 8000
```

The SQLite database file is auto-created at `backend/data/teamleadkit.db` on first run.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

### 3. Set your Link API token

Click the **gear icon** in the navbar, then **Set Link Auth Token** and paste your Orange Logic token. This is stored in memory and expires after 24 hours.

## Project Structure

```
teamleadkit/
├── backend/
│   ├── main.py                          # FastAPI entry point
│   ├── requirements.txt
│   ├── data/                            # SQLite DB (auto-created)
│   └── app/
│       ├── api/work_api.py              # REST endpoints
│       ├── services/work/work_service.py # Business logic
│       ├── classes/work/                 # Pydantic models & enums
│       ├── core/
│       │   ├── database.py              # SQLite wrapper
│       │   ├── cache.py                 # In-memory TTL cache
│       │   └── config.py               # Settings
│       └── utils/string/               # Parsing utilities
├── frontend/
│   ├── src/
│   │   ├── App.tsx                      # Routes (Work, Team)
│   │   ├── pages/                       # Work & Team pages
│   │   ├── components/                  # UI components
│   │   └── context/                     # React contexts
│   └── package.json
└── README.md
```

## Key Differences from Aiven

| Concern   | Aiven                  | TeamLeadKit              |
|-----------|------------------------|--------------------------|
| Database  | MongoDB (Docker)       | SQLite (file-based)      |
| Cache     | Redis (Docker)         | In-memory dict with TTL  |
| Features  | Full suite             | Work + Team only         |
| Setup     | Docker Compose         | pip install + npm install |
