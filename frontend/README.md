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

## Tech Stack

- React 19
- Vite 6
- TypeScript 5
- TailwindCSS 3

## Components

| Component | Description |
|-----------|-------------|
| GoalInput | Goal input form with planner mode toggle |
| TaskList | Task list with status badges and dependency count |
| DagView | DAG dependency visualization (CSS topology + SVG arrows) |
| AgentMatrix | Agent x Task matrix with colored status cells |
| MatrixCell | Single matrix cell (clickable, status color) |
| TaskDetailPanel | Task detail panel (tool calls, model calls, retry button) |
| ToolCallList | Tool call records list |
| ModelCallList | Model call records list |
| FinalReport | Final report display with download button |
| StatusBadge | Status color badge (10 task states + 6 run states) |

## Build

```bash
npm run build
```

Output in `dist/` directory.

## API Proxy

In development mode, Vite proxies `/api` requests to `http://localhost:8000` (see `vite.config.ts`).

In production (Docker), Nginx handles the proxy via `nginx.conf`.
