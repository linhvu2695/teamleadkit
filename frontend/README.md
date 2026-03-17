# TeamLeadKit Frontend

React-based frontend for TeamLeadKit, a work and team management dashboard.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** — build tooling
- **Chakra UI v3** — component library and theming
- **React Router v7** — routing
- **Recharts** + **@chakra-ui/charts** — data visualization
- **@dnd-kit** — drag-and-drop (Kanban)

## Project Structure

```
frontend/
├── src/
│   ├── App.tsx              # Root app, routing, layout
│   ├── main.tsx             # Entry point, providers
│   ├── vite-env.d.ts        # Vite type declarations
│   │
│   ├── components/
│   │   ├── navbar.tsx       # Top navigation (Work / Team)
│   │   ├── settings/       # Settings popover, auth token dialog
│   │   ├── ui/              # Shared UI primitives
│   │   ├── work/            # Work management views
│   │   └── team/            # Team analytics views
│   │
│   ├── context/             # React context providers
│   │   ├── work-ctx.tsx     # Monitored tasks, filters, selection
│   │   └── team-ctx.tsx     # Selected member, chart mode
│   │
│   ├── pages/
│   │   ├── work-page.tsx    # Work dashboard
│   │   └── team-page.tsx    # Team dashboard
│   │
│   ├── theme/               # Chakra UI theme config
│   └── utils/               # Helpers (e.g. date-utils)
│
├── index.html
├── vite.config.ts
└── package.json
```

## Key Areas

| Directory | Purpose |
|-----------|---------|
| **`components/work/`** | Task management: hierarchy tree, list, Kanban, Gantt, burndown, participants |
| **`components/team/`** | Team analytics: workload filters, incomplete/completed task views, member bar charts |
| **`components/ui/`** | Reusable primitives: tooltip, dropdown, donut chart, date range selector, toaster |
| **`components/settings/`** | Settings popover and auth token linking |
| **`context/`** | `WorkProvider` (tasks, filters) and `TeamProvider` (member selection, chart mode) |
| **`theme/`** | Chakra theme tokens (colors, spacing, etc.) |

## Routes

- `/work` — Work dashboard (default)
- `/team` — Team dashboard
- `*` — Redirects to `/work`

## Getting Started

```bash
npm install
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
npm run preview  # Preview production build
```

Set `VITE_API_BASE_URL` in `.env` to point at the backend API.
