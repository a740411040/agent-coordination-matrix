# FutureAgent Frontend

React + TypeScript + TailwindCSS frontend for the Composite Visual AI Agent Coordination System.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Docker

```bash
# From project root
docker compose up --build -d
```

Frontend served via Nginx at http://localhost:3000 with API proxy to backend.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | In production | `http://localhost:8000` | Backend API base URL |

In development, Vite automatically proxies `/api` requests to `http://localhost:8000` (see `vite.config.ts`).

## Tech Stack

- React 19
- Vite 6
- TypeScript 5
- TailwindCSS 3 (dark theme, glass morphism, gradients, custom animations)

## Components

### Core Components

| Component | Description |
|-----------|-------------|
| GoalInput | Goal input form with planner mode toggle, 3 demo goals, tips, and highlights |
| TaskList | Task list with status badges and dependency count |
| DagView | DAG dependency visualization (CSS topology + SVG arrows, status-colored nodes) |
| AgentMatrix | Agent x Task matrix with colored status cells, row/column highlighting |
| MatrixCell | Single matrix cell (clickable, status color, running pulse, hover scale, summary) |
| TaskDetailPanel | Slide-in task detail panel (7 sections: info, deps, logs, result, tools, models, timestamps) |
| ToolCallList | Tool call records with expandable input/output JSON |
| ModelCallList | Model call records with token counts and duration |
| FinalReport | Document preview with download button and empty state |
| StatusBadge | Status color badge (10 task states + 6 run states) |

### Settings Components

| Component | Description |
|-----------|-------------|
| AgentSettingsPanel | Right-side slide-in panel for configuring agent type, provider, model, temperature, tools |
| ProviderStatusBadge | Provider availability indicator (Available / Configured / Missing API Key) |
| ProviderSettingsSummary | Grid summary of all provider statuses with warning |

### Page Component

| Component | Description |
|-----------|-------------|
| RunConsole | Main console page: hero area, metrics dashboard, goal input, matrix, DAG, report, settings |

## Styling

Custom component classes defined in `index.css`:

| Class | Description |
|-------|-------------|
| `glass` | Glass morphism card (backdrop-blur, border, rounded) |
| `stat-card` / `stat-card-enhanced` | Dashboard metric cards with hover effects |
| `tag` | Small pill-shaped label |
| `btn-primary` / `btn-secondary` | Button styles |
| `section-panel` | Panel section with gradient top border |
| `highlight-badge` | Hero area feature badges |
| `hero-orb` | Decorative floating gradient orbs |
| `code-block` | Monospace code display |
| `panel-slide` | Slide-in panel container |

Animations from `tailwind.config.js`:
- `running-pulse`: Box-shadow pulse for running state
- `float`: Vertical bobbing for decorative elements
- `scale-in`: Appear with scale transition
- `slide-up`: Slide in from below
- `fade-in`: Fade in

## Build

```bash
npm run build
```

Output in `dist/` directory.

## API Proxy

In development mode, Vite proxies `/api` requests to `http://localhost:8000` (see `vite.config.ts`).

In production (Docker), Nginx handles the proxy via `nginx.conf`.
