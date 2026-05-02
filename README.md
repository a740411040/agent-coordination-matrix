<p align="center">
  <h1 align="center">FutureAgent</h1>
  <p align="center"><b>Composite Visual AI Agent Coordination System</b></p>
  <p align="center">Visual orchestration for multi-agent, multi-model, multi-tool AI workflows.</p>
</p>

<p align="center">
  <img alt="Python" src="https://img.shields.io/badge/Python-3.12+-3776AB?logo=python&logoColor=white" />
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img alt="TailwindCSS" src="https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green" />
</p>

<p align="center">
  <a href="https://futureagent-c0ab4cnu.edgeone.cool/">Frontend Demo</a> &nbsp;·&nbsp;
  <a href="https://agent-coordination-matrix.onrender.com/api/health">Backend API</a> &nbsp;·&nbsp;
  <a href="docs/deployment.md">Deployment Guide</a> &nbsp;·&nbsp;
  <a href="docs/architecture.md">Architecture</a>
</p>

---

FutureAgent 是一个复合可视化 AI Agent 协调系统，可以将复杂目标拆解为任务 DAG，分配给不同 Agent、模型和工具执行，并通过网页矩阵实时展示协作过程、调用记录和最终报告。

FutureAgent is a visual orchestration console for multi-agent, multi-model, and multi-tool AI workflows. Describe a goal in natural language, and the Planner decomposes it into a task DAG. Specialized agents execute tasks through a model router and tool gateway, with every call audited in a live Agent x Task matrix. Download a structured Markdown report when everything completes.

---

## Live Demo

| | URL |
|---|---|
| **Frontend** | https://futureagent-c0ab4cnu.edgeone.cool/ |
| **Backend API** | https://agent-coordination-matrix.onrender.com/api/health |
| **Swagger UI** | https://agent-coordination-matrix.onrender.com/docs |

> The public demo uses `mock` / `rule` mode by default. No real API keys are exposed.

---

## Highlights

| | Feature | Description |
|---|---|---|
| <img src="https://img.shields.io/badge/-Matrix-blueviolet?style=flat-square" /> | **Visual Agent x Task Matrix** | Live colored grid showing every agent-task pair with status, hover details, and running animations |
| <img src="https://img.shields.io/badge/-DAG-orange?style=flat-square" /> | **Task DAG Execution** | Dependency-aware task graph with status-colored nodes and SVG dependency arrows |
| <img src="https://img.shields.io/badge/-Router-009688?style=flat-square" /> | **Multi-Model Router** | Route tasks to mock, rule-based, MiMo, or any OpenAI-compatible LLM |
| <img src="https://img.shields.io/badge/-Tools-FF6F00?style=flat-square" /> | **Tool Gateway** | File I/O, Python execution, HTTP requests, and mock API calls through a unified gateway |
| <img src="https://img.shields.io/badge/-Audit-4CAF50?style=flat-square" /> | **ToolCall / ModelCall Audit Logs** | Full input/output traces for every tool invocation and model call |
| <img src="https://img.shields.io/badge/-Settings-9C27B0?style=flat-square" /> | **Agent Settings Panel** | Configure agent type, provider, model, temperature, and tools via slide-in panel |
| <img src="https://img.shields.io/badge/-Report-2196F3?style=flat-square" /> | **Final Markdown Report** | Auto-synthesized structured report with one-click download |
| <img src="https://img.shields.io/badge/-DB-336791?style=flat-square" /> | **Supabase PostgreSQL** | Swap SQLite for managed PostgreSQL with a single `DATABASE_URL` change |
| <img src="https://img.shields.io/badge/-Deploy-FF4081?style=flat-square" /> | **EdgeOne + Render Deployment** | Frontend on Tencent EdgeOne Pages, backend on Render, database on Supabase |

---

## Architecture

```
                         ┌──────────────────────────┐
                         │        User Goal         │
                         └────────────┬─────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │     Planner Agent        │
                         │  (mock / LLM real)       │
                         └────────────┬─────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │       Task DAG           │
                         │  (dependency graph)      │
                         └────────────┬─────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │        Executor          │
                         │  (topological sort)      │
                         └────────────┬─────────────┘
                                      ▼
                ┌─────────────────────┼─────────────────────┐
                ▼                     ▼                     ▼
   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
   │   Data Agent     │  │   Code Agent     │  │   Writer Agent   │
   │   Critic Agent   │  │   ...            │  │   ...            │
   └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
            │                     │                     │
            ▼                     ▼                     ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                      Model Router                           │
   │    mock  ·  rule  ·  mimo  ·  openai_compatible            │
   └─────────────────────────┬───────────────────────────────────┘
                             │
   ┌─────────────────────────┼───────────────────────────────────┐
   │                   Tool Gateway                              │
   │  file.read · file.write · python.run · markdown.write       │
   │  http.request · mock_api.call                               │
   └─────────────────────────┬───────────────────────────────────┘
                             ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                    Database                                 │
   │  SQLite (local)  /  Supabase PostgreSQL (production)       │
   └─────────────────────────┬───────────────────────────────────┘
                             ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                   Frontend UI                               │
   │  Agent x Task Matrix  ·  DAG View  ·  Task Detail Panel    │
   │  ToolCall / ModelCall Logs  ·  Final Report Download       │
   └─────────────────────────────────────────────────────────────┘
```

**Run State Machine:**
```
pending → planning → executing → synthesizing → completed
                                                 ↘ failed
```

See [docs/architecture.md](docs/architecture.md) for detailed component breakdown.

---

## Screenshots

<p align="center">
  <img src="docs/screenshots/agent-matrix.png" width="800" alt="Agent x Task Matrix" />
  <br/><em>Agent x Task Matrix — live status grid with running animations</em>
</p>

<p align="center">
  <img src="docs/screenshots/agent-settings.png" width="800" alt="Agent Settings Panel" />
  <br/><em>Agent Settings — configure provider, model, temperature, and tools</em>
</p>

<p align="center">
  <img src="docs/screenshots/final-report.png" width="800" alt="Final Report" />
  <br/><em>Final Report — auto-synthesized Markdown with download</em>
</p>

---

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- (Optional) Docker & Docker Compose

### 1. Clone

```bash
git clone https://github.com/your-username/futureagent.git
cd futureagent
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # edit .env if needed
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

- UI: http://localhost:5173

### 4. Docker (all-in-one)

```bash
docker compose up --build -d
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

```bash
docker compose logs -f   # view logs
docker compose down       # stop
```

---

## Deployment

| Component | Platform | Details |
|-----------|----------|---------|
| **Frontend** | Tencent EdgeOne Pages | Vite build → `dist/`, set `VITE_API_BASE_URL` |
| **Backend** | Render | `pip install -r requirements.txt` + `uvicorn` |
| **Database** | Supabase PostgreSQL | Free tier, `DATABASE_URL` with `postgresql+asyncpg://` |

```
GitHub push → EdgeOne Pages (frontend)
           → Render (backend) → Supabase PostgreSQL
```

Full step-by-step guide: **[docs/deployment.md](docs/deployment.md)**

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | No | `sqlite+aiosqlite:///./data/futureagent.db` | Database connection string |
| `CORS_ORIGINS` | No | `["http://localhost:5173"]` | Allowed CORS origins (JSON array) |
| `DEFAULT_PROVIDER` | No | `mock` | Default model provider: `mock`, `rule`, `mimo`, `openai_compatible` |
| `DEFAULT_MODEL` | No | `default` | Default model name |
| `MIMO_API_KEY` | For MiMo | — | MiMo API key |
| `MIMO_BASE_URL` | For MiMo | — | MiMo API base URL |
| `OPENAI_API_KEY` | For OpenAI | — | OpenAI or compatible API key |
| `OPENAI_BASE_URL` | No | `https://api.openai.com/v1` | OpenAI-compatible base URL |
| `DEBUG` | No | `true` | Debug mode |
| `HOST` | No | `0.0.0.0` | Server bind address |
| `PORT` | No | `8000` | Server port |

> You can also use `OPENAI_COMPATIBLE_API_KEY` / `OPENAI_COMPATIBLE_BASE_URL` as aliases.

### Frontend (`.env` or build-time)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | In production | `http://localhost:8000` | Backend API base URL |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.12+, FastAPI, Uvicorn |
| ORM / DB | SQLAlchemy 2.0 (async) + aiosqlite (local) / asyncpg (Supabase PostgreSQL) |
| Validation | Pydantic v2, pydantic-settings |
| HTTP Client | httpx |
| Frontend | React 19, Vite 6, TypeScript 5 |
| Styling | TailwindCSS 3 (dark theme, glass morphism, gradients, custom animations) |
| Model Router | 4 providers: mock, rule, mimo, openai_compatible |
| Tool Gateway | 6 tools: file.read, file.write, python.run, markdown.write, http.request, mock_api.call |
| Testing | pytest + pytest-asyncio (22 tests) |
| Container | Docker, Docker Compose, Nginx reverse proxy |

---

## Features

| Feature | Status |
|---------|--------|
| POST /runs — create run + trigger planner | Done |
| Mock Planner (5 task templates + dependency chain) | Done |
| LLM Planner (real mode, JSON parsing + fallback) | Done |
| DAG dependency resolution (compute_ready_tasks) | Done |
| Executor — sequential execution by topological level | Done |
| 5 Agents (planner, data, code, critic, writer) | Done |
| Model Router + 4 Providers | Done |
| Tool Gateway + 6 built-in tools | Done |
| CriticAgent MVP review (success / needs_review / failed) | Done |
| Auto-retry (max 2) + manual retry API | Done |
| Report synthesis (template Markdown) | Done |
| Report download (GET /download-report) | Done |
| Frontend polling (1s interval) | Done |
| Agent x Task Matrix (status colors + animations) | Done |
| Task Detail Panel (ToolCall + ModelCall + retry) | Done |
| DAG dependency view (CSS topology + SVG arrows) | Done |
| Final Report display + download | Done |
| Agent Settings Panel (provider, model, tools) | Done |
| Provider status indicators | Done |
| Docker Compose one-click deploy | Done |
| pytest unit tests (22 tests) | Done |

---

## Self-Hosting

FutureAgent is designed to be self-hosted. You can clone this repository and deploy it with your own infrastructure:

1. **Clone** the repository
2. **Choose your database**: SQLite (zero config) or any PostgreSQL provider (Supabase, Neon, self-hosted)
3. **Configure API keys** in `backend/.env` — add your OpenAI, MiMo, or any OpenAI-compatible provider keys
4. **Deploy backend** on any platform that runs Python (Render, Railway, Fly.io, VPS, your own server)
5. **Deploy frontend** on any static hosting (EdgeOne Pages, Vercel, Cloudflare Pages, Netlify)
6. **Update `VITE_API_BASE_URL`** to point to your backend domain
7. **Update `CORS_ORIGINS`** on the backend to include your frontend domain

No registration, no vendor lock-in. Your data stays in your database.

---

## Project Structure

```
futureagent/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI entry (lifespan, CORS, routers)
│   │   ├── config.py                  # Pydantic Settings
│   │   ├── db.py                      # SQLAlchemy async engine + session
│   │   ├── models.py                  # ORM: Run, Task, Agent, MatrixCell, ToolCall, ModelCall
│   │   ├── schemas.py                 # Pydantic request/response schemas
│   │   ├── agents/
│   │   │   ├── base.py                # BaseAgent, AgentResult, ModelContext, ToolContext
│   │   │   ├── registry.py            # Agent registry
│   │   │   ├── data_agent.py          # Data analysis agent
│   │   │   ├── code_agent.py          # Code generation agent
│   │   │   ├── critic_agent.py        # Quality review agent
│   │   │   ├── writer_agent.py        # Report writing agent
│   │   │   ├── mock_agents.py         # MockPlannerAgent
│   │   │   └── planner_agent.py       # LLM Planner (JSON + fallback)
│   │   ├── api/
│   │   │   ├── agents.py              # GET /agents, PATCH /agents/{id}
│   │   │   ├── providers.py           # GET /providers, POST /providers/{id}/test
│   │   │   ├── runs.py                # CRUD + matrix + model-calls
│   │   │   ├── tasks.py               # GET /tasks/{id}, POST /tasks/{id}/retry
│   │   │   ├── reports.py             # Final report + download
│   │   │   └── tools.py               # Tool listing + tool calls
│   │   ├── orchestration/
│   │   │   ├── planner.py             # Task planning (mock / LLM)
│   │   │   ├── executor.py            # Task execution loop
│   │   │   ├── dependency.py          # DAG dependency resolver
│   │   │   └── synthesizer.py         # Final report synthesis
│   │   ├── llm/
│   │   │   ├── base.py                # BaseProvider, ModelResponse
│   │   │   ├── router.py              # Model Router
│   │   │   └── providers/             # mock, rule, mimo, openai_compatible
│   │   └── tools/
│   │       ├── gateway.py             # Tool Gateway
│   │       └── (6 built-in tools)
│   ├── tests/                         # 22 pytest tests
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                       # API client + TypeScript types
│   │   ├── components/
│   │   │   ├── GoalInput.tsx           # Goal input with demo goals
│   │   │   ├── TaskList.tsx            # Task list with status badges
│   │   │   ├── DagView.tsx             # DAG visualization
│   │   │   ├── AgentMatrix.tsx         # Agent x Task matrix
│   │   │   ├── MatrixCell.tsx          # Matrix cell (status + animation)
│   │   │   ├── TaskDetailPanel.tsx     # Task detail panel
│   │   │   ├── ToolCallList.tsx        # Tool call records
│   │   │   ├── ModelCallList.tsx       # Model call records
│   │   │   ├── FinalReport.tsx         # Report display + download
│   │   │   ├── StatusBadge.tsx         # Status badge component
│   │   │   ├── AgentSettingsPanel.tsx  # Slide-in agent config panel
│   │   │   ├── ProviderStatusBadge.tsx # Provider status indicator
│   │   │   └── ProviderSettingsSummary.tsx  # Provider status summary
│   │   └── pages/
│   │       └── RunConsole.tsx          # Main console page
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docs/
│   ├── deployment.md                  # Step-by-step deployment guide
│   ├── architecture.md                # System architecture details
│   └── demo.md                        # Demo walkthrough guide
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/runs` | Create run + start execution |
| GET | `/api/runs` | List all runs |
| GET | `/api/runs/{id}` | Run detail (tasks, cells, agents, calls) |
| POST | `/api/runs/{id}/start` | Start run execution |
| GET | `/api/runs/{id}/tasks` | Run tasks |
| GET | `/api/runs/{id}/matrix` | Agent-task matrix |
| GET | `/api/runs/{id}/tool-calls` | Tool call records |
| GET | `/api/runs/{id}/model-calls` | Model call records |
| GET | `/api/runs/{id}/final-report` | Final report (JSON) |
| GET | `/api/runs/{id}/download-report` | Download report (.md) |
| GET | `/api/tasks/{id}` | Task detail |
| POST | `/api/tasks/{id}/retry` | Retry failed task |
| GET | `/api/agents` | List agents |
| GET | `/api/agents/{id}` | Agent detail |
| PATCH | `/api/agents/{id}` | Update agent config |
| GET | `/api/providers` | List providers + status |
| POST | `/api/providers/{id}/test` | Test provider connectivity |
| GET | `/api/tools` | List available tools |

---

## Roadmap

| Priority | Feature | Description |
|----------|---------|-------------|
| P0 | SSE / WebSocket | Replace polling with real-time push |
| P0 | Parallel execution | Run independent tasks concurrently |
| P1 | LLM-powered Critic | Deep quality review via LLM |
| P1 | React Flow DAG | Interactive dependency graph editing |
| P2 | Multi-run dashboard | Browse and compare past runs |
| P2 | User authentication | JWT + RBAC |
| P2 | Agent sandbox | Docker-in-Docker for python.run |
| P2 | BYOK (Bring Your Own Key) | User-supplied API keys per session |
| P3 | Benchmark mode | Automated evaluation workflows |
| P3 | Scientific workflow templates | Pre-built templates for research pipelines |
| P3 | Webhook / callbacks | Notify external systems on task completion |

---

## Testing

```bash
cd backend
python -m pytest tests/ -v
```

22 tests covering: Planner (4) + Executor (5) + ModelRouter (5) + ToolGateway (8)

Tests use in-memory SQLite. No external services required.

---

## Security Notice

- **Never commit `.env` files.** The `.gitignore` is configured to exclude them.
- **API keys must only be configured on the backend.** Never expose keys in frontend code or client-side environment variables.
- **Public demos should use `mock` / `rule` mode** by default to avoid consuming real API credits.
- **CORS must be restricted** to known frontend domains in production.
- **Tool execution (`python.run`) has no sandbox.** Use with caution in untrusted environments.

---

## License

MIT

---

<p align="center">
  Built with FastAPI + React + TailwindCSS
</p>
