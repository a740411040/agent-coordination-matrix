# FutureAgent — Composite Visual AI Agent Coordination System

复合可视化 AI Agent 协调系统：由大语言模型驱动，可定义多个具有专业角色的 Agent，自动把一个复杂目标拆解为有依赖关系的子任务，再按依赖依次执行、审查、重试，并最终汇总为结构化 Markdown 报告。

---

## 1. 系统架构

```
用户输入 Goal
    ↓
┌─────────────────────────────────────────────────┐
│  Planner (mock / LLM)                           │
│  拆解为 Task DAG（含 dependencies）               │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│  Executor                                        │
│  compute_ready_tasks() → _execute_single_task()  │
│  ↓                                               │
│  Agent.execute()                                 │
│    → Model Router (call_model → ModelCall)       │
│    → Tool Gateway  (call_tool  → ToolCall)       │
│  ↓                                               │
│  CriticAgent.verify (review_result)              │
│    → success / needs_review / failed             │
│    → auto-retry (max 2)                          │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│  Synthesizer                                     │
│  collect task summaries → template report        │
│  → Run.final_report (Markdown)                   │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│  Frontend (React 19 + Vite 6)                    │
│  GoalInput → TaskList → DagView → AgentMatrix    │
│  → TaskDetailPanel → FinalReport (download)      │
└─────────────────────────────────────────────────┘
```

**Run 状态机：**
```
pending → planning → executing → synthesizing → completed
                                                 ↘ failed
```

---

## 2. 技术栈

| 层 | 技术 |
|---|---|
| 后端框架 | Python 3.12+, FastAPI 0.115, Uvicorn |
| ORM / 数据库 | SQLAlchemy 2.0 (async) + aiosqlite (SQLite) |
| 校验 | Pydantic v2, pydantic-settings |
| HTTP 客户端 | httpx |
| 前端框架 | React 19, Vite 6, TypeScript 5 |
| 样式 | TailwindCSS 3 |
| 测试 | pytest + pytest-asyncio |
| 容器化 | Docker, Docker Compose, Nginx |

---

## 3. 功能清单

| 功能 | 状态 |
|------|------|
| POST /runs 创建 Run + 触发 Planner | ✅ |
| Mock Planner（5 个任务模板 + 依赖链） | ✅ |
| LLM Planner（real 模式，JSON 解析 + fallback） | ✅ |
| DAG 依赖解析（compute_ready_tasks） | ✅ |
| Executor 顺序执行（按拓扑层级） | ✅ |
| 4 个 Agent（data/code/critic/writer） | ✅ |
| Model Router + 4 Provider（mock/rule/mimo/openai_compatible） | ✅ |
| Tool Gateway + 6 工具（file.read/write/python.run/markdown.write/http.request/mock_api.call） | ✅ |
| CriticAgent MVP 审查（success/needs_review/failed） | ✅ |
| 自动重试（最多 2 次）+ 手动重试 API | ✅ |
| 报告合成（template Markdown → Run.final_report） | ✅ |
| 报告下载（GET /download-report） | ✅ |
| 前端轮询（1s 间隔） | ✅ |
| Agent×Task 矩阵（状态色块） | ✅ |
| TaskDetailPanel（ToolCall + ModelCall 详情） | ✅ |
| DAG 依赖视图（CSS 拓扑布局 + SVG 箭头） | ✅ |
| FinalReport 展示 + 下载 | ✅ |
| Docker Compose 一键部署 | ✅ |
| pytest 单元测试（22 tests） | ✅ |

---

## 4. 目录结构

```
futureagent/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI 入口（lifespan 建表 + seed agents）
│   │   ├── config.py                  # pydantic-settings 配置
│   │   ├── db.py                      # SQLAlchemy async engine + session
│   │   ├── models.py                  # ORM：Run, Task, Agent, MatrixCell, ToolCall, ModelCall
│   │   ├── schemas.py                 # Pydantic 请求/响应 Schema
│   │   ├── agents/
│   │   │   ├── base.py                # BaseAgent, AgentResult, ModelContext, ToolContext
│   │   │   ├── data_agent.py          # 数据 Agent
│   │   │   ├── code_agent.py          # 代码 Agent
│   │   │   ├── critic_agent.py        # 审查 Agent
│   │   │   ├── writer_agent.py        # 报告 Agent
│   │   │   ├── mock_agents.py         # MockPlannerAgent
│   │   │   ├── planner_agent.py       # LLM Planner（JSON 解析 + fallback）
│   │   │   └── registry.py            # Agent 注册表
│   │   ├── api/
│   │   │   ├── agents.py              # GET /agents
│   │   │   ├── runs.py                # POST /runs, GET /runs, GET /runs/{id}
│   │   │   ├── tasks.py               # GET /tasks/{id}, POST /tasks/{id}/retry
│   │   │   ├── reports.py             # GET /runs/{id}/final-report, GET /runs/{id}/download-report
│   │   │   └── tools.py               # GET /tools, GET /runs/{id}/tool-calls
│   │   ├── orchestration/
│   │   │   ├── planner.py             # 任务规划（mock / LLM real）
│   │   │   ├── executor.py            # 任务执行器（执行 + 审查 + 重试）
│   │   │   ├── dependency.py          # DAG 依赖解析
│   │   │   └── synthesizer.py         # 报告合成器
│   │   ├── llm/
│   │   │   ├── base.py                # BaseProvider, ModelResponse
│   │   │   ├── router.py              # Model Router（call_model）
│   │   │   └── providers/             # mock, rule, mimo, openai_compatible
│   │   └── tools/
│   │       ├── gateway.py             # Tool Gateway（call_tool）
│   │       └── (6 built-in tools)
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_planner.py
│   │   ├── test_executor.py
│   │   ├── test_model_router.py
│   │   └── test_tool_gateway.py
│   ├── Dockerfile
│   ├── pytest.ini
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts              # API Client（fetch 封装）
│   │   │   └── types.ts               # TypeScript 类型
│   │   ├── components/
│   │   │   ├── GoalInput.tsx           # 目标输入
│   │   │   ├── TaskList.tsx            # 任务列表
│   │   │   ├── DagView.tsx             # DAG 依赖视图
│   │   │   ├── AgentMatrix.tsx         # Agent×Task 矩阵
│   │   │   ├── MatrixCell.tsx          # 矩阵单元格
│   │   │   ├── TaskDetailPanel.tsx     # 任务详情面板
│   │   │   ├── ToolCallList.tsx        # 工具调用列表
│   │   │   ├── ModelCallList.tsx       # 模型调用列表
│   │   │   ├── FinalReport.tsx         # 最终报告
│   │   │   └── StatusBadge.tsx         # 状态色块
│   │   └── pages/
│   │       └── RunConsole.tsx          # 主页面
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── README.md
├── docker-compose.yml
├── .gitignore
├── README.md                          # ← 你在这里
└── project_summary.md
```

---

## 5. 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./data/futureagent.db` | 数据库连接串 |
| `DEBUG` | `true` | 调试模式 |
| `HOST` | `0.0.0.0` | 监听地址 |
| `PORT` | `8000` | 监听端口 |
| `OPENAI_API_KEY` | 空 | OpenAI API Key（real 模式用） |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | OpenAI 兼容 API 地址 |
| `MIMO_API_KEY` | 空 | MiMo API Key |
| `MIMO_BASE_URL` | 空 | MiMo API 地址 |
| `DEFAULT_PROVIDER` | `mock` | 默认 Provider |
| `DEFAULT_MODEL` | `default` | 默认模型名 |
| `CORS_ORIGINS` | `["http://localhost:5173",...]` | CORS 允许来源（JSON 数组） |

复制 `backend/.env.example` 为 `backend/.env` 后修改：

```bash
cd backend
cp .env.example .env
# 编辑 .env，填入你的 API Key
```

---

## 6. 后端启动方法

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

启动后自动：
- 创建数据库表
- Seed 5 个默认 Agent（planner/data/code/critic/writer）

访问：
- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs

---

## 7. 前端启动方法

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173

Vite 自动代理 `/api` → `http://localhost:8000`

---

## 8. Docker 启动方法

```bash
# 一键启动（前后端 + Nginx 反代）
docker compose up --build -d

# 访问前端
open http://localhost:3000

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

Docker Compose 包含两个服务：
- `backend`: Python 3.12 + FastAPI，端口 8000
- `frontend`: Nginx + React build，端口 3000，反代 `/api` 到 backend

数据库文件持久化在 `backend-data` volume。

---

## 9. Demo 使用流程

### 示例 Goal

**数据分析报告**
> 对最近一个月的销售数据进行分析，生成季度报告

**代码任务流程**
> 编写一个自动化数据清洗脚本，处理CSV文件

**科研数据处理**
> 处理实验采集的传感器数据，生成统计分析结果

### 操作步骤

1. 打开前端 http://localhost:5173（或 Docker 模式 http://localhost:3000）
2. 在 Goal 输入框中输入目标，选择 Planner 模式（mock 或 real）
3. 点击 **Start** 按钮
4. 观察 **TaskList** 状态变化（pending → running → completed）
5. 查看 **DAG 依赖视图**，点击节点打开 TaskDetailPanel
6. 查看 **AgentMatrix** 矩阵色块变化
7. 所有任务完成后，查看 **FinalReport**，点击下载按钮

---

## 10. 如何配置不同 Agent 使用不同模型

编辑数据库中 `agents` 表，修改对应 Agent 的字段：

| 字段 | 说明 | 可选值 |
|------|------|--------|
| `agent_type` | Agent 类型 | `mock`, `rule`, `llm` |
| `model_provider` | 模型提供者 | `mock`, `rule`, `mimo`, `openai_compatible` |
| `model_name` | 模型名称 | `default`, `gpt-4o`, `qwen2.5-7b-instruct` 等 |
| `temperature` | 温度 | 0.0 - 1.0 |

示例：让 data_agent 使用真实 LLM

```sql
UPDATE agents
SET model_provider = 'openai_compatible',
    model_name = 'gpt-4o-mini',
    temperature = 0.3
WHERE name = 'data_agent';
```

或通过 API 启动时选择 `planner_mode=real`（在 GoalInput 组件中切换）。

---

## 11. 如何配置 MiMo

MiMo 基于 OpenAI-compatible 协议，在 `.env` 中配置：

```env
MIMO_API_KEY=your-mimo-api-key
MIMO_BASE_URL=https://api.mimo.example.com/v1
```

然后在 Agent 配置中设置 `model_provider=mimo`，`model_name=mimo-xxx`。

MiMo Provider 内部使用 httpx 调用 OpenAI-compatible chat completions 接口。

---

## 12. 如何配置 OpenAI-compatible API

适用于任何兼容 OpenAI API 格式的服务（如 Azure OpenAI、DeepSeek、Qwen、本地 Ollama 等）：

```env
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://api.deepseek.com/v1
```

Agent 配置中设置 `model_provider=openai_compatible`，`model_name=deepseek-chat`。

**本地 Ollama 示例：**

```env
OPENAI_API_KEY=ollama
OPENAI_BASE_URL=http://localhost:11434/v1
```

Agent 中 `model_name=llama3`。

---

## 13. 当前限制

- **SQLite 单文件数据库**：不适合高并发生产环境，可后续迁移 PostgreSQL
- **BackgroundTasks 执行**：FastAPI BackgroundTasks 在进程内执行，重启会丢失；可后续换 Celery/RQ
- **CriticAgent 为规则模式**：MVP 审查仅检查字段完整性，未接入 LLM 深度审查
- **无用户认证**：所有 API 无鉴权，适合内网/本地使用
- **前端轮询**：1s 轮询代替 WebSocket/SSE，简单但不够实时
- **Tool 执行无沙箱**：python.run 直接执行代码，仅依赖超时限制
- **Agent 配置在数据库**：无管理界面，需直接操作数据库修改
- **无并发执行**：任务严格按拓扑顺序串行，无并行执行同一层级的多个任务

---

## 14. 后续路线

| 优先级 | 功能 | 说明 |
|--------|------|------|
| P0 | PostgreSQL 支持 | 修改 DATABASE_URL 即可切换 |
| P0 | WebSocket/SSE 实时推送 | 替代前端轮询 |
| P1 | Agent 管理界面 | 前端可视化编辑 Agent 配置 |
| P1 | 并行任务执行 | 同一层级的无依赖任务可并行 |
| P1 | LLM 审查模式 | CriticAgent 接入 LLM 做深度质量审查 |
| P2 | React Flow DAG | 替代简单 SVG，支持交互式编辑依赖 |
| P2 | 多 Run 管理 | Dashboard 列出所有 Run 历史 |
| P2 | 用户认证 | JWT + RBAC |
| P3 | Agent 沙箱执行 | Docker-in-Docker 沙箱执行 python.run |
| P3 | 任务回调/Webhook | 任务完成时通知外部系统 |

---

## 运行测试

```bash
cd backend
python -m pytest tests/ -v
```

22 个测试覆盖：Planner（4）+ Executor（5）+ ModelRouter（5）+ ToolGateway（8）

---

## License

MIT
