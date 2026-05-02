# FutureAgent — System Architecture

This document provides a detailed technical overview of FutureAgent's architecture, data flow, and component design.

---

## High-Level Overview

FutureAgent follows a classic three-tier architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React 19)                      │
│  GoalInput → RunConsole → Matrix / DAG / Detail / Report       │
│  Polling: 1s interval via /api/runs/{id}                       │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP REST (fetch)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend (FastAPI)                         │
│  REST API → Orchestration → Agents → Model Router + Tool GW     │
│  BackgroundTasks for async execution                            │
└──────────────────────────────┬──────────────────────────────────┘
                               │ SQLAlchemy async
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Database                                  │
│  SQLite (local dev) / PostgreSQL via asyncpg (production)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

```
Run (1) ──┬── (N) Task
           ├── (N) MatrixCell   [agent_id × task_id]
           ├── (N) ToolCall
           └── (N) ModelCall

Task (1) ──┬── (N) ToolCall
            └── (N) ModelCall

Agent (1) ──┬── (N) MatrixCell
             └── config: agent_type, model_provider, model_name, temperature, tools[]
```

### Run State Machine

```
pending ──→ planning ──→ executing ──→ synthesizing ──→ completed
                                                       ↘ failed
```

- **pending**: Run created, waiting for start
- **planning**: Planner agent decomposing goal into tasks
- **executing**: Executor running tasks in dependency order
- **synthesizing**: Synthesizer generating final report
- **completed**: All tasks done, report ready
- **failed**: Unrecoverable error during execution

### Task Status Flow

```
pending ──→ running ──→ completed
                   ↘ needs_review ──→ running (retry)
                   ↘ failed ──→ running (retry, max 2)
```

---

## Core Components

### 1. Planner

Responsible for decomposing a user goal into a set of tasks with dependencies.

- **MockPlannerAgent**: Template-based planning. Generates 5 predefined tasks (data collection, data analysis, code generation, quality review, report writing) with a fixed dependency chain.
- **LLM Planner** (`planner_agent.py`): Sends the goal to an LLM and parses a JSON response containing task definitions. Falls back to mock templates on parse failure.

### 2. Executor

Orchestrates task execution in topological order:

```
1. compute_ready_tasks()  — find tasks whose dependencies are all completed
2. _execute_single_task() — assign to agent → agent.execute()
3. review_result()        — CriticAgent checks quality
4. update status          — success / needs_review / failed
5. auto-retry             — up to 2 retries on failure
6. synthesize             — generate final report when all tasks complete
```

### 3. Agent System

Each agent is a Python class inheriting from `BaseAgent`:

| Agent | Role | Default Provider |
|-------|------|-----------------|
| `planner` | Goal decomposition | mock |
| `data` | Data collection and analysis | rule |
| `code` | Code generation and review | rule |
| `critic` | Quality review | rule |
| `writer` | Report writing | rule |

Agents interact with the system through two contexts:

- **ModelContext**: `call_model(prompt, provider, model)` → returns text response
- **ToolContext**: `call_tool(name, args)` → returns tool execution result

### 4. Model Router

Unified interface for calling different LLM providers:

```
call_model(prompt, provider, model, temperature)
    → Provider.call(prompt) → ModelResponse
    → record ModelCall to database
```

| Provider | Description |
|----------|-------------|
| `mock` | Returns fixed "analysis complete" text |
| `rule` | Rule-based pattern matching, no LLM call |
| `mimo` | MiMo API (OpenAI-compatible) |
| `openai_compatible` | Any OpenAI-compatible API (DeepSeek, Qwen, Ollama, Azure, etc.) |

### 5. Tool Gateway

Unified interface for tool invocation:

```
call_tool(tool_name, arguments)
    → Tool.execute(args) → result
    → record ToolCall to database
```

| Tool | Description |
|------|-------------|
| `file.read` | Read file contents |
| `file.write` | Write file contents |
| `markdown.write` | Write Markdown output file |
| `python.run` | Execute Python code (timeout-limited, no sandbox) |
| `http.request` | Make HTTP requests |
| `mock_api.call` | Simulated API call with fixed response |

### 6. Synthesizer

Collects task results and generates a structured Markdown report. Template-based by default, extensible to LLM-powered synthesis.

---

## Frontend Architecture

### Component Hierarchy

```
App
└── RunConsole
    ├── Hero (title, highlight badges)
    ├── MetricCards (6 KPI cards)
    ├── GoalInput (goal form, demo goals, tips)
    ├── ErrorBanner (smart diagnostics)
    ├── TaskList (task list with status badges)
    ├── DagView (DAG dependency visualization)
    ├── AgentMatrix (agent × task status grid)
    │   └── MatrixCell (individual cell with animations)
    ├── TaskDetailPanel (slide-in, triggered by cell/task click)
    │   ├── Basic Info
    │   ├── Dependencies
    │   ├── Logs
    │   ├── Result / Error
    │   ├── ToolCallList
    │   ├── ModelCallList
    │   └── Timestamps
    ├── FinalReport (document preview + download)
    └── AgentSettingsPanel (slide-in, agent configuration)
```

### State Management

- **Run data**: Fetched via `GET /api/runs/{id}` every 1 second
- **Selection state**: `useState` for selected cell, task, agent
- **Panel state**: `useState` for detail panel and settings panel visibility
- **No global state library**: Component-local state is sufficient for this single-page console

### Styling System

- **TailwindCSS 3** with dark theme
- **Glass morphism**: `backdrop-blur` + semi-transparent backgrounds
- **Custom component classes** in `index.css`: `glass`, `stat-card`, `tag`, `btn-primary`, `section-panel`, `highlight-badge`, `hero-orb`
- **Animations**: `running-pulse`, `float`, `scale-in`, `slide-up`, `fade-in`

---

## API Layer

### REST Endpoints

| Group | Endpoints |
|-------|-----------|
| Runs | `POST /api/runs`, `GET /api/runs`, `GET /api/runs/{id}`, `POST /api/runs/{id}/start` |
| Tasks | `GET /api/runs/{id}/tasks`, `GET /api/tasks/{id}`, `POST /api/tasks/{id}/retry` |
| Matrix | `GET /api/runs/{id}/matrix` |
| Calls | `GET /api/runs/{id}/tool-calls`, `GET /api/runs/{id}/model-calls` |
| Reports | `GET /api/runs/{id}/final-report`, `GET /api/runs/{id}/download-report` |
| Agents | `GET /api/agents`, `GET /api/agents/{id}`, `PATCH /api/agents/{id}` |
| Providers | `GET /api/providers`, `POST /api/providers/{id}/test` |
| Tools | `GET /api/tools` |

### Execution Trigger

When a Run is created (`POST /api/runs`), the backend:
1. Creates the Run record (status: `pending`)
2. Spawns a `BackgroundTasks` worker
3. Worker: calls Planner → creates Tasks → enters Executor loop
4. Frontend polls `GET /api/runs/{id}` to observe progress

---

## Database Schema

### Tables

- **runs**: id, goal, planner_mode, status, final_report, created_at, updated_at
- **tasks**: id, run_id, title, description, status, dependencies (JSON), assigned_agent_id, result, error, retry_count, expected_output, created_at, updated_at
- **agents**: id, name, agent_type, model_provider, model_name, temperature, tools (JSON), enabled
- **matrix_cells**: id, run_id, agent_id, task_id, status, summary, logs (JSON)
- **tool_calls**: id, task_id, run_id, agent_name, tool_name, input (JSON), output (JSON), duration_ms, created_at
- **model_calls**: id, task_id, run_id, agent_name, provider, model, prompt, response, input_tokens, output_tokens, duration_ms, created_at

---

## Deployment Architecture

```
GitHub Repository
    │
    ├── push ──→ Tencent EdgeOne Pages (Frontend static hosting)
    │              │
    │              └── Vite build → dist/
    │                   env: VITE_API_BASE_URL
    │
    └── push ──→ Render (Backend Python hosting)
                   │
                   ├── uvicorn app.main:app
                   │   env: DATABASE_URL, CORS_ORIGINS, API_KEYS
                   │
                   └── asyncpg ──→ Supabase PostgreSQL
```

### Why This Stack?

- **EdgeOne Pages**: Free static hosting with CDN, native to Tencent Cloud ecosystem
- **Render**: Free tier for Python web services, auto-deploy from GitHub
- **Supabase**: Free PostgreSQL with connection pooling, dashboard for data inspection
- **SQLite locally**: Zero-config for development, automatic migration to PostgreSQL via `DATABASE_URL`

---

## Extensibility Points

| Extension Point | How |
|----------------|-----|
| New Agent | Add file in `agents/`, register in `registry.py` |
| New Model Provider | Add class in `llm/providers/`, register in `router.py` |
| New Tool | Add function in `tools/gateway.py` |
| New Planner mode | Add branch in `orchestration/planner.py` |
| Custom report template | Modify `orchestration/synthesizer.py` |
