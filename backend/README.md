# FutureAgent Backend

Composite Visual AI Agent Coordination System - Backend API

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Copy and edit environment variables
cp .env.example .env

# Run dev server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
python -m pytest tests/ -v
```

## Docker

```bash
# From project root
docker compose up --build -d
```

## Architecture

```
app/
├── main.py                     # FastAPI app (lifespan, CORS, routers)
├── config.py                   # Pydantic Settings
├── db.py                       # SQLAlchemy async engine + session
├── models.py                   # ORM: Run, Task, Agent, MatrixCell, ToolCall, ModelCall
├── schemas.py                  # Pydantic request/response models
├── agents/                     # Agent implementations
│   ├── base.py                 # BaseAgent ABC, AgentResult, ModelContext, ToolContext
│   ├── registry.py             # Agent name -> instance mapping
│   ├── data_agent.py           # Data analysis agent
│   ├── code_agent.py           # Code generation agent
│   ├── critic_agent.py         # Quality review agent (MVP rule-based)
│   ├── writer_agent.py         # Report writing agent
│   ├── mock_agents.py          # MockPlannerAgent
│   └── planner_agent.py        # LLM Planner (JSON parsing + fallback)
├── orchestration/              # Core execution engine
│   ├── planner.py              # Task planning (mock/LLM)
│   ├── executor.py             # Task execution loop
│   ├── dependency.py           # DAG dependency resolver
│   └── synthesizer.py          # Final report synthesis
├── llm/                        # Model Router
│   ├── base.py                 # BaseProvider ABC, ModelResponse
│   ├── router.py               # Unified call_model() with ModelCall recording
│   └── providers/              # Mock, Rule, MiMo, OpenAI-compatible
└── tools/                      # Tool Gateway
    ├── gateway.py              # Unified call_tool() with ToolCall recording
    └── (6 built-in tools)      # file.read/write, python.run, markdown.write, http.request, mock_api.call
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| POST | /api/runs | Create run + start execution |
| GET | /api/runs | List all runs |
| GET | /api/runs/{id} | Get run detail (tasks, cells, agents, tool/model calls) |
| POST | /api/runs/{id}/start | Start run execution |
| GET | /api/runs/{id}/tasks | Get run tasks |
| GET | /api/runs/{id}/matrix | Get agent-task matrix |
| GET | /api/tasks/{id} | Get single task detail |
| POST | /api/tasks/{id}/retry | Manual retry task |
| GET | /api/runs/{id}/tool-calls | Get tool call records |
| GET | /api/runs/{id}/model-calls | Get model call records |
| GET | /api/runs/{id}/final-report | Get final report (JSON) |
| GET | /api/runs/{id}/download-report | Download final report (Markdown) |
| GET | /api/agents | List all agents |
| GET | /api/tools | List available tools |

## Testing

```bash
# All tests (22 tests, ~1s)
python -m pytest tests/ -v

# Specific test file
python -m pytest tests/test_planner.py -v
python -m pytest tests/test_executor.py -v
python -m pytest tests/test_model_router.py -v
python -m pytest tests/test_tool_gateway.py -v
```

Tests use in-memory SQLite with `pytest-asyncio`. No external services required.
