# project_summary.md

## 项目名称
Composite Visual AI Agent Coordination System (复合可视化 AI Agent 协调系统)

## 版本
v1.0.0

## 当前阶段
阶段 14 已完成（Docker + 交付文档 + 最终验收）

---

## 已完成功能

### 阶段 1：项目骨架 ✅
- [x] 后端 FastAPI 项目骨架
- [x] 前端 React + Vite + TypeScript + TailwindCSS 项目骨架
- [x] `/api/health` 健康检查接口
- [x] 前端请求 `/api/health` 并展示结果
- [x] Vite 代理配置（`/api` → `localhost:8000`）
- [x] 环境变量配置（`.env` + `pydantic-settings`）
- [x] API Client 封装（基于 `fetch`）

### 阶段 2：数据库模型 + 基础 API ✅
- [x] SQLAlchemy ORM 模型（6 张表：runs, tasks, agents, matrix_cells, tool_calls, model_calls）
- [x] Pydantic 请求/响应 Schema
- [x] SQLite 数据库自动建表（lifespan startup）
- [x] 启动时初始化 5 个默认 Agent（planner, data, code, critic, writer）
- [x] `GET /api/agents` — 列出所有 Agent
- [x] `GET /api/agents/{agent_id}` — 获取 Agent 详情
- [x] `POST /api/runs` — 创建 Run（仅创建，不生成任务）
- [x] `GET /api/runs` — 列出所有 Run
- [x] `GET /api/runs/{run_id}` — 获取 Run 详情（含 tasks）
- [x] `GET /api/runs/{run_id}/matrix` — 获取 Run 的 Agent×Task 矩阵数据

### 阶段 3：Mock Planner ✅
- [x] Mock Planner 根据 goal 自动生成 5 个任务（数据准备→代码处理→结果检查→报告生成）
- [x] `POST /api/runs` 创建 Run 后自动触发 Mock Planner，返回 RunDetail（含 tasks）
- [x] 任务依赖链合理（dependencies 基于 DAG）
- [x] 自动分配 assigned_agent_id（从默认 agents 中匹配）
- [x] 创建 Agent×Task 矩阵单元（MatrixCell）
- [x] Agent Router 基础模块（关键字匹配路由到 agent）
- [x] 前端 GoalInput 组件（输入目标，点击创建 Run）
- [x] 前端 TaskList 组件（显示任务列表、状态、Agent 分配、依赖数）
- [x] 前端 AgentMatrix 组件（Agent×Task 矩阵表格，状态色块）
- [x] 前端 RunConsole 页面（整合 GoalInput + TaskList + AgentMatrix）
- [x] 前端 TypeScript 类型定义（types.ts）
- [x] 前端 API Client 更新（支持 createRun、listAgents、getMatrix）

### 阶段 4：Executor 与依赖执行 ✅
- [x] Agent 基类（BaseAgent + AgentResult）
- [x] 4 个 Mock Agent 实现（data_agent, code_agent, critic_agent, writer_agent）
- [x] Agent Registry（按名称查找 Agent 实例）
- [x] DAG 依赖解析器（compute_ready_tasks：pending→ready，检测 blocked）
- [x] 任务执行器（run_executor：循环解析 ready→running→completed/failed，更新 matrix cell）
- [x] 任务状态机：pending → ready → running → completed / failed / blocked
- [x] Run 状态自动汇总（所有任务完成 → Run completed/failed）
- [x] `POST /api/runs/{run_id}/start` — 启动执行（background task）
- [x] `GET /api/runs/{run_id}/tasks` — 获取 run 的任务列表
- [x] `GET /api/tasks/{task_id}` — 获取单个任务详情
- [x] 前端 StatusBadge 组件（统一状态色块显示）
- [x] 前端 Start 按钮（触发执行）
- [x] 前端 1 秒轮询（run、tasks、matrix 自动刷新）
- [x] 前端 AgentMatrix 颜色更新（支持 ready/success 状态）
- [x] 前端 API Client 更新（+startRun、+getRunTasks、+getTask）

### 阶段 5：完善前端协调矩阵 ✅
- [x] StatusBadge 更新（9 种状态颜色：pending/ready/running/verifying/success/failed/blocked/needs_review/retrying）
- [x] MatrixCell 组件（可点击单元格，状态色块 + 标签）
- [x] TaskDetailPanel 组件（右侧抽屉面板，显示 task 完整详情：title/description/agent/status/deps/logs/result/error/retry_count/时间）
- [x] AgentMatrix 重构（使用 MatrixCell 组件，支持 onCellClick 回调）
- [x] RunConsole 集成 TaskDetailPanel（点击矩阵单元格打开详情，最新 task 数据实时刷新）
- [x] 所有状态颜色与用户规格一致（pending 灰、ready 浅蓝、running 蓝、success 绿、failed 红、blocked 紫、needs_review 黄、retry 粉）
- [x] 前端 TypeScript 编译通过（0 errors）
- [x] 端到端测试通过（create run → start → execute → completed，matrix 4 agents × 5 tasks × 5 cells）

---

## 已完成功能（续）

### 阶段 6：Tool Gateway ✅
- [x] Tool Gateway 统一入口（`tools/gateway.py`）
- [x] 6 种工具实现（file.read, file.write, markdown.write, python.run, http.request, mock_api.call）
- [x] 每次工具调用自动记录 ToolCall（含 latency_ms、status、input、output、error）
- [x] 统一返回格式：`{"status": "success|failed", "output": {}, "error": null}`
- [x] file 工具路径沙箱（只能访问 outputs/ 目录）
- [x] python.run 超时限制（默认 10 秒）
- [x] http.request 仅支持 GET/POST
- [x] ToolContext 数据结构（session, run_id, task_id, agent_id）
- [x] BaseAgent.execute() 新增 tool_ctx 参数
- [x] 所有 Mock Agent 集成 Tool Gateway（通过 call_tool 调用真实工具）
- [x] Executor 传递 ToolContext 给 Agent
- [x] `GET /api/tools` — 列出所有可用工具
- [x] `GET /api/tools/{tool_name}` — 查看工具详情
- [x] `GET /api/runs/{run_id}/tool-calls` — 查看运行的所有工具调用记录
- [x] 前端 ToolCallList 组件（显示工具名称、状态、延迟、输入输出、错误）
- [x] 前端 TaskDetailPanel 新增工具调用展示区
- [x] 前端 RunConsole 点击 cell 时同时加载该 task 的 tool calls
- [x] 前端 TypeScript 类型定义更新（ToolCall、ToolInfo）
- [x] 前端 API Client 更新（listTools、getTool、getRunToolCalls）
- [x] 前端 build 通过
- [x] 端到端测试通过（8 个 ToolCall 记录，所有 agent 均通过 Tool Gateway 调用工具）

### 阶段 7：Model Router ✅
- [x] LLM 抽象层（BaseProvider 抽象基类 + ModelResponse + ModelUsage）
- [x] MockProvider（关键词匹配 mock 回复，用于开发测试）
- [x] RuleProvider（基于规则的关键词回复，critic_agent 使用）
- [x] MiMoProvider（按 OpenAI-compatible 风格实现，TODO 标记待确认实际端点）
- [x] OpenAICompatibleProvider（通用 OpenAI 兼容接口，使用 httpx）
- [x] Model Router 统一调用入口（call_model 函数，provider 注册表）
- [x] 所有模型调用自动记录 ModelCall（含 provider、model、input/output tokens、latency、status）
- [x] 统一返回格式：`{"content":"...", "parsed":{}, "usage":{"input_tokens":0, "output_tokens":0}, "raw":{}}`
- [x] API Key 仅从环境变量读取（MIMO_API_KEY、OPENAI_API_KEY 等）
- [x] ModelContext 数据结构（session, run_id, task_id, agent_id, provider, model_name, temperature）
- [x] BaseAgent.execute() 新增 model_ctx 参数
- [x] 所有 Mock Agent 集成 Model Router（通过 call_model 调用模型）
- [x] Executor 传递 ModelContext 给 Agent（从 Agent 配置读取 provider/model_name/temperature）
- [x] config.py 新增 DEFAULT_PROVIDER、DEFAULT_MODEL 配置
- [x] `GET /api/runs/{run_id}/model-calls` — 获取运行的模型调用记录
- [x] 前端 ModelCallList 组件（显示 provider、model、status、tokens、输入输出摘要）
- [x] 前端 TaskDetailPanel 新增模型调用展示区
- [x] 前端 RunConsole 点击 cell 时同时加载该 task 的 model calls
- [x] 前端 TypeScript 类型定义更新（ModelCall）
- [x] 前端 API Client 更新（getRunModelCalls）
- [x] 前端 build 通过
- [x] 端到端测试通过（5 个 ModelCall + 8 个 ToolCall 记录，Run completed）

### 阶段 8：Real LLM Planner ✅
- [x] PlannerAgent 模块（`agents/planner_agent.py`）支持 mock/real 两种模式
- [x] LLM Planner 系统提示词（任务拆解专家，输出结构化 JSON）
- [x] Planner 输入构建（goal + 可用 agents + 可用 tools + 输出 schema）
- [x] LLM Planner 输出 JSON 解析（支持 ```json 包裹、裸 JSON、正则提取）
- [x] LLM 输出验证（任务数 3-8 个、assigned_agent_id 必须来自可用 agents、依赖索引合法）
- [x] LLM 返回 JSON 错误时自动 fallback 到 Mock Planner
- [x] planner.py 重构（plan_and_create_tasks 统一入口，支持 planner_mode 参数）
- [x] mock_plan_and_create_tasks 保留向后兼容
- [x] RunCreate Schema 新增 planner_mode 字段（默认 "mock"）
- [x] `POST /api/runs` 端点传递 planner_mode 到 planner
- [x] plan.strategy 区分 "mock_plan" / "llm_plan"
- [x] LLM planner 调用记录 ModelCall（通过 call_model）
- [x] 前端 GoalInput 新增 Planner 模式切换按钮（Mock / Real LLM）
- [x] 前端 API Client 更新（createRun 支持 plannerMode 参数）
- [x] 前端 RunConsole 传递 plannerMode 到 createRun
- [x] .env.example 新增 DEFAULT_PLANNER_MODE
- [x] 前端 build 通过
- [x] 端到端测试通过（mock 模式 5 tasks + 5 ModelCalls + 8 ToolCalls）
- [x] 端到端测试通过（real 模式 fallback，6 ModelCalls 含 planner 调用 + 5 tasks + 8 ToolCalls）

### 阶段 9：混合 Agent 执行 ✅
- [x] AgentResult 重构（新增 status/confidence/tool_requests/result 字段，保留 success 属性向后兼容）
- [x] AgentResult 工厂方法（AgentResult.ok / .fail / .review）
- [x] 拆分 mock_agents.py 为独立文件（data_agent.py, code_agent.py, critic_agent.py, writer_agent.py）
- [x] DataAgent（rule 模式，LLM 失败时 fallback 到规则模式）
- [x] CodeAgent（mock/LLM 模式，LLM 失败时 fallback 到 mock）
- [x] CriticAgent（rule 模式，支持 needs_review 状态返回）
- [x] WriterAgent（模板/LLM 模式，LLM 输出过短时 fallback 到模板）
- [x] mock_agents.py 保留向后兼容（使用新 AgentResult API）
- [x] Registry 更新为使用独立 agent 文件
- [x] Executor 处理新 AgentResult（status→TaskStatus 映射，needs_review→completed）
- [x] Agent 不能直接调用模型，必须走 ModelRouter（call_model）
- [x] Agent 不能直接调用工具，必须走 ToolGateway（call_tool）
- [x] 所有 Agent LLM 调用失败时有 fallback
- [x] Executor 日志记录 needs_review 状态和 confidence 值
- [x] 端到端测试通过（5 tasks + 5 ModelCalls + 8 ToolCalls，Run completed）

### 阶段 10：Critic 审查 + 重试机制 ✅
- [x] TaskStatus 新增 verifying 状态
- [x] Critic MVP 审查函数（review_result：result 为空→failed，error 不为空→failed，缺少 summary→needs_review，其他→success）
- [x] CriticAgent 保留 execute 方法（rule/LLM 模式，Tool+Model 集成）
- [x] Executor 任务执行后进入 verifying 状态
- [x] Executor 调用 review_result 验证任务结果
- [x] 审查通过→completed，needs_review→needs_review，失败→自动重试或 failed
- [x] 自动重试最多 2 次（retry_count < MAX_AUTO_RETRIES）
- [x] 超过重试次数→failed
- [x] `POST /api/tasks/{task_id}/retry` — 手动重试（仅 failed/needs_review 状态）
- [x] schemas.py 新增 TaskRetry schema
- [x] 前端 TaskDetailPanel 显示 retry_count（橙色高亮）
- [x] 前端 TaskDetailPanel failed/needs_review 状态显示 🔄 Retry 按钮
- [x] 前端 retry 后自动刷新状态（startPolling）
- [x] 前端 TaskList 显示 retry_count（retry:N 标签）
- [x] 前端 API Client 新增 retryTask 方法
- [x] 前端 TypeScript 类型定义更新（TaskRetryResponse）
- [x] StatusBadge 已支持 verifying 状态颜色（橙色）
- [x] 前端 build 通过
- [x] 端到端测试通过（5 tasks 全部 completed，retry_count=0，Critic 审查通过）
- [x] POST /tasks/{id}/retry 对 completed 任务正确返回 400

### 阶段 11：最终报告生成与下载 ✅
- [x] RunStatus 新增 synthesizing 状态（紫色徽章，报告生成中）
- [x] Synthesizer 模块（orchestration/synthesizer.py）：收集任务摘要 + 模板报告生成
- [x] Synthesizer collect_task_summaries：读取 Task + MatrixCell + Agent 名称
- [x] Synthesizer generate_template_report：Markdown 模板（目标、时间戳、任务列表、分析、指标表）
- [x] Synthesizer synthesize_report：入口函数（set synthesizing → collect → generate → save → completed）
- [x] executor.py 任务全部完成后调用 synthesize_report（替代旧的 writer 结果提取）
- [x] executor.py _mark_run_completed 增加终态防护（已 completed/failed 不重复合成）
- [x] schemas.py 新增 FinalReportRead 响应模型
- [x] reports.py API（GET /runs/{id}/final-report 返回 JSON，GET /runs/{id}/download-report 返回 Markdown 文件下载）
- [x] download-report 端点正确设置 Content-Type + Content-Disposition 头
- [x] main.py 注册 reports router
- [x] 前端 FinalReport 组件（加载报告 + Markdown 下载按钮 + 错误处理）
- [x] 前端 RunConsole 集成 FinalReport（run completed + final_report 存在时显示）
- [x] RunConsole synthesizing 状态显示"报告生成中..."动画
- [x] StatusBadge synthesizing 状态颜色（紫色）+ 中文标签"报告生成中"
- [x] RunConsole polling synthesizing 不停止（继续轮询直到 completed/failed）
- [x] 前端 types.ts 新增 FinalReport 接口
- [x] 前端 client.ts 新增 getFinalReport / getDownloadReportUrl 方法
- [x] 前端 build 通过
- [x] 端到端测试通过（run completed + final_report 1314 字符 + final-report API + download-report API）

### 阶段 12：简单 DAG 视图 ✅
- [x] DagView 组件（纯 CSS + SVG 箭头，无 React Flow 依赖）
- [x] DAG 层级布局算法（computeLevels：根据 dependencies 计算拓扑层级）
- [x] 每层任务水平排列（levelGroups），SVG 箭头连接依赖关系
- [x] 任务节点卡片（ID + 标题 + Agent 名称 + StatusBadge + retry_count）
- [x] 点击任务节点触发 onTaskClick，打开 TaskDetailPanel
- [x] SVG 箭头自适应容器尺寸（ResizeObserver + window resize）
- [x] RunConsole handleCellClick 支持 Agent | null
- [x] RunConsole 集成 DagView（位于 TaskList 和 AgentMatrix 之间）
- [x] 前端 build 通过

### 阶段 13：测试与 Demo Workflow ✅
- [x] 安装 pytest + pytest-asyncio
- [x] pytest 配置（pytest.ini: asyncio_mode=auto）
- [x] tests/conftest.py（in-memory SQLite + db_session/seed_agents/seed_run fixtures）
- [x] test_planner.py（4 tests: 生成任务/依赖设置/矩阵创建/默认 mock）
- [x] test_executor.py（5 tests: 依赖计算/单任务执行/依赖解锁/全任务执行流程/Run 完成标记）
- [x] test_model_router.py（5 tests: provider 查找/fallback/MockProvider 调用/ModelCall 记录/多种 prompt）
- [x] test_tool_gateway.py（8 tests: 工具列表/工具信息/未知工具/mock_api 直接调用/ToolCall 记录/异常处理）
- [x] 22 tests 全部通过（0.97s）
- [x] backend/README.md（Quick Start + Architecture + API Endpoints + Testing + Demo Goals）
- [x] README.md（Project Structure + Quick Start + Architecture Overview + Demo Goals + Tech Stack）
- [x] project_summary.md 更新

### 阶段 14：Docker + 交付文档 + 最终验收 ✅
- [x] .gitignore（Python/Node/IDE/OS/项目产物）
- [x] backend/Dockerfile（python:3.12-slim + pip install + uvicorn）
- [x] frontend/Dockerfile（多阶段: node:20-alpine build + nginx:alpine 运行）
- [x] frontend/nginx.conf（/api 代理到 backend:8000 + SPA 路由）
- [x] docker-compose.yml（backend:8000 + frontend:3000 + backend-data 卷）
- [x] backend/.env.example 更新（分区注释）
- [x] README.md 完整重写（15 项内容：项目简介/系统架构/技术栈/功能清单/目录结构/环境变量/后端启动/前端启动/Docker 启动/Demo 使用流程/Agent 模型配置/MiMo 配置/OpenAI-compatible 配置/当前限制/后续路线）
- [x] backend/README.md 更新（API 端点列表 + Testing 命令 + Docker 启动）
- [x] frontend/README.md（Quick Start + 技术栈 + 组件列表 + Build + API Proxy）
- [x] 最终验收 10/10 项全部通过:
    - [x] 1.Health: ok
    - [x] 2.CreateRun: 成功创建 run（5 tasks）
    - [x] 3.GenTasks: 5 tasks 生成
    - [x] 5.Status: completed
    - [x] 6.AllTasks: 5 tasks 全部 completed
    - [x] 7.ToolCalls: 8 条记录
    - [x] 8.ModelCalls: 5 条记录
    - [x] 9.TaskDetail: API 正常返回
    - [x] 10.Report: final_report 2169 字符
    - [x] 附加: matrix（4 agents, 5 tasks, 5 cells）+ download-report（200, 1305 bytes）
- [x] 后端测试 22/22 通过
- [x] 前端 build 通过

---

## 技术栈
- 后端：Python 3.12+, FastAPI, SQLAlchemy (async), SQLite, Pydantic v2, httpx, python-dotenv
- 前端：React 19, Vite 6, TypeScript 5, TailwindCSS 3
- 任务执行：FastAPI BackgroundTasks（MVP）
- 模型路由：Model Router + 4 个 Provider（mock/rule/mimo/openai_compatible）
- 工具网关：Tool Gateway + 6 种工具（file.read/file.write/markdown.write/python.run/http.request/mock_api.call）
- Agent 架构：独立 Agent 文件 + AgentResult 统一格式（status/confidence/tool_requests）
- 报告合成：Synthesizer 模块（模板模式 + LLM 扩展）
- 审查机制：Critic MVP 规则审查 + 自动重试（最多 2 次）
- 状态更新：前端轮询（1s 间隔）
- DAG 可视化：纯 CSS 层级布局 + SVG 箭头（无 React Flow 依赖）
- 测试：pytest + pytest-asyncio，in-memory SQLite，22 个测试覆盖 Planner/Executor/ModelRouter/ToolGateway
- 容器化：Docker + Docker Compose + Nginx 反向代理
- 交付文档：README（15 项内容）、backend/README、frontend/README

---

## 目录结构

```
futureagent/
├── README.md                      # 项目说明（15 项内容）
├── project_summary.md             # 开发进度文档
├── .gitignore
├── docker-compose.yml             # Docker Compose 编排
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI 入口 + lifespan
│   │   ├── config.py              # pydantic-settings 配置
│   │   ├── db.py                  # SQLAlchemy async engine + session
│   │   ├── models.py              # ORM 模型（6 张表）
│   │   ├── schemas.py             # Pydantic 请求/响应 Schema
│   │   ├── agents/
│   │   │   ├── base.py, data_agent.py, code_agent.py, critic_agent.py, writer_agent.py
│   │   │   ├── mock_agents.py, planner_agent.py, registry.py
│   │   ├── api/
│   │   │   ├── agents.py, runs.py, tasks.py, reports.py, tools.py
│   │   ├── tools/
│   │   │   ├── gateway.py, file_tools.py, python_runner.py, markdown_tools.py, http_tools.py, mock_api.py
│   │   ├── orchestration/
│   │   │   ├── planner.py, router.py, dependency.py, executor.py, synthesizer.py
│   │   └── llm/
│   │       ├── base.py, router.py
│   │       └── providers/
│   │           ├── mock_provider.py, rule_provider.py, mimo_provider.py, openai_compatible_provider.py
│   ├── tests/
│   │   ├── conftest.py, test_planner.py, test_executor.py, test_model_router.py, test_tool_gateway.py
│   ├── pytest.ini
│   ├── README.md
│   ├── Dockerfile
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.tsx, App.tsx, index.css
│   │   ├── api/client.ts, api/types.ts
│   │   ├── components/
│   │   │   ├── GoalInput.tsx, TaskList.tsx, AgentMatrix.tsx, MatrixCell.tsx
│   │   │   ├── TaskDetailPanel.tsx, ToolCallList.tsx, ModelCallList.tsx
│   │   │   ├── FinalReport.tsx, DagView.tsx, StatusBadge.tsx
│   │   └── pages/RunConsole.tsx
│   ├── index.html, package.json, vite.config.ts, tsconfig.json
│   ├── tailwind.config.js, postcss.config.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── README.md
```

---

## 数据库表结构

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `runs` | 运行实例（用户目标） | id, goal, status, plan, final_output, final_report |
| `tasks` | 任务 | id, run_id, title, description, assigned_agent_id, status, dependencies, expected_output, result, logs, error, retry_count |
| `agents` | Agent 配置 | id, name, role, agent_type, model_provider, model_name, temperature, tools, output_schema, enabled |
| `matrix_cells` | Agent×Task 矩阵单元 | id, run_id, task_id, agent_id, status, summary, logs, result |
| `tool_calls` | 工具调用记录 | id, run_id, task_id, agent_id, tool_name, input, output, status, error, latency_ms |
| `model_calls` | 模型调用记录 | id, run_id, task_id, agent_id, provider, model, input_summary, output, input_tokens, output_tokens, status, error |

---

## Run 状态机

```
pending → planning → executing → synthesizing → completed
                    → failed（执行异常）
```

---

## 任务状态机

```
pending → ready → running → verifying → completed (success)
                                      → needs_review
                          → failed（审查失败且重试用尽 / 执行异常）
           → blocked（依赖失败时）
           → retry → pending（自动重试/手动重试）
```

---

## 默认 Agent（启动时 seed）

| 名称 | 类型 | Provider | 模型 | 工具 | 策略 |
|------|------|----------|------|------|------|
| planner_agent | llm | mock | default | - | 只负责规划 |
| data_agent | mock | mock | default | file.read, http.request | rule/LLM，失败 fallback |
| code_agent | mock | mock | default | file.read, file.write, python.run | mock/LLM，失败 fallback |
| critic_agent | rule | mock | default | - | rule，支持 needs_review |
| writer_agent | mock | mock | default | markdown.write | 模板/LLM，输出过短 fallback |

### AgentResult 统一格式
```json
{
  "status": "success|failed|needs_review",
  "summary": "...",
  "output": "...",
  "result": {},
  "logs": [],
  "tool_requests": [],
  "confidence": 0.0
}
```

- `success` 属性向后兼容：`status == "success"` 时返回 `True`
- `AgentResult.ok()` / `.fail()` / `.review()` 工厂方法
- `needs_review` 映射到 `TaskStatus.completed`，记录到日志

---

## Critic 审查机制

### MVP 审查规则（review_result 函数）
| 条件 | 结果 |
|------|------|
| error 不为空 | → failed（任务执行出错） |
| result 为空 | → failed（结果为空） |
| 缺少 summary | → needs_review（需要人工审查） |
| 其他 | → success（审查通过） |

### 自动重试
- 审查失败时自动重试（retry_count < MAX_AUTO_RETRIES=2）
- 超过重试次数→failed
- 重试流程：retry → pending → running → verifying → success/failed

### 手动重试
- `POST /api/tasks/{task_id}/retry`
- 仅 failed/needs_review 状态可重试
- 前端 Retry 按钮触发

### 审查流程
```
task 执行完成 → task.result/task.error 已设置
    → task.status = verifying
    → 调用 review_result(task.result, task.error, cell.summary)
    → success → task.status = completed
    → needs_review → task.status = needs_review
    → failed → retry_count < 2? → auto-retry → pending
                         → else → task.status = failed
```

---

## 报告合成机制

### 流程
```
所有任务完成 → _mark_run_completed
    → 有失败任务 → run.status = failed
    → 全部成功 → synthesize_report
        → run.status = synthesizing
        → collect_task_summaries（读取 Task + MatrixCell + Agent 名称）
        → generate_template_report（Markdown 模板）
        → run.final_report = report
        → run.status = completed
```

### 模板报告结构
| 章节 | 内容 |
|------|------|
| 目标 | 用户输入的 goal |
| 执行时间 | 当前时间戳 |
| 任务列表 | 各任务标题、状态、Agent、摘要 |
| 分析 | 任务完成率、失败任务、需审查任务 |
| 指标表 | 总数/完成/失败/需审查 统计 |

### API 端点
| 端点 | 返回 | 说明 |
|------|------|------|
| GET /runs/{id}/final-report | JSON (FinalReportRead) | 获取报告数据 |
| GET /runs/{id}/download-report | Markdown 文件 | 下载报告（Content-Disposition: attachment） |

### 前端集成
- FinalReport 组件：run completed + final_report 存在时显示
- 下载按钮：直接链接到 download-report 端点
- synthesizing 状态：紫色动画"报告生成中..."，继续轮询

---

## Planner 机制

### 模式
| 模式 | 说明 |
|------|------|
| mock | 使用预定义 5 个任务模板，不调用 LLM |
| real | 通过 Model Router 调用 LLM，输出结构化 JSON 任务列表；解析失败时 fallback 到 mock |

### Real 模式流程
1. 构建 system prompt（任务拆解专家）
2. 构建 user prompt（goal + 可用 agents + 可用 tools + 输出 schema）
3. 调用 call_model（provider/model_name/temperature 来自 planner_agent 配置）
4. 解析 LLM 返回的 JSON（支持 ```json 包裹、裸 JSON、正则提取）
5. 验证（任务数 3-8 个、agent_id 合法、依赖索引合法）
6. 创建 Task + MatrixCell
7. 失败时 fallback 到 mock 模式

### Mock 任务模板

| 任务 | Agent | 依赖 | 说明 |
|------|-------|------|------|
| 数据收集与预处理 | data_agent | 无 | 收集数据，清洗格式化 |
| 数据深度分析 | data_agent | 任务1 | 统计分析、趋势识别 |
| 代码实现与处理 | code_agent | 任务1 | 脚本编写、可视化 |
| 结果质量审查 | critic_agent | 任务2,3 | 准确性、一致性审查 |
| 报告撰写与汇总 | writer_agent | 任务2,3,4 | Markdown 报告生成 |

---

## API 端点清单

### 已实现 ✅
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/agents` | 列出所有 Agent |
| GET | `/api/agents/{agent_id}` | 获取 Agent 详情 |
| POST | `/api/runs` | 创建 Run + 自动触发 Planner |
| POST | `/api/runs/{run_id}/start` | 启动 Run 执行（background task） |
| GET | `/api/runs` | 列出所有 Run |
| GET | `/api/runs/{run_id}` | 获取 Run 详情 |
| GET | `/api/runs/{run_id}/tasks` | 获取 Run 的任务列表 |
| GET | `/api/runs/{run_id}/matrix` | 获取矩阵数据 |
| GET | `/api/tasks/{task_id}` | 获取单个任务详情 |
| POST | `/api/tasks/{task_id}/retry` | 手动重试任务（failed/needs_review） |
| GET | `/api/tools` | 列出所有可用工具 |
| GET | `/api/tools/{tool_name}` | 查看工具详情 |
| GET | `/api/runs/{run_id}/tool-calls` | 获取运行的工具调用记录 |
| GET | `/api/runs/{run_id}/model-calls` | 获取运行的模型调用记录 |
| GET | `/api/runs/{run_id}/final-report` | 获取最终报告（JSON） |
| GET | `/api/runs/{run_id}/download-report` | 下载最终报告（Markdown 文件） |

---

## 运行命令

### 后端
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
# → http://localhost:8000
# → http://localhost:8000/docs (Swagger UI)
```

### 前端
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Docker（一键启动）
```bash
docker-compose up --build
# → http://localhost:3000（前端 + API 代理）
# → http://localhost:8000（后端 API）
# → http://localhost:8000/docs（Swagger UI）
```

---

## 开发规则备忘
1. 一次只做一个阶段
2. 每阶段先列目标和文件清单
3. 修改已有文件优先给 patch
4. 每阶段结束必须更新 project_summary.md
5. 所有模型调用必须经过 Model Router（call_model）
6. 所有工具调用必须经过 Tool Gateway（call_tool）
7. Agent 之间只传结构化摘要，不传完整长日志
8. 代码必须可运行
9. API Key 只能从环境变量读取，不能硬编码
10. 每次模型调用必须记录 ModelCall，每次工具调用必须记录 ToolCall
11. Planner 支持 mock/real 模式，real 模式 LLM 解析失败时必须 fallback 到 mock
12. Agent 不能直接调用模型/工具，必须走 ModelRouter/ToolGateway
13. Agent LLM 失败时必须有 fallback，不能让 Agent 执行中断
14. AgentResult 使用工厂方法（.ok/.fail/.review），不用构造函数直接实例化
15. 任务执行后必须经过 Critic 审查（review_result），审查结果决定任务最终状态
16. 审查失败自动重试最多 2 次，超过则标记 failed
17. 用户可通过 POST /tasks/{id}/retry 手动重试 failed/needs_review 状态的任务
18. 所有任务成功后自动触发报告合成（synthesize_report），Run 经过 synthesizing 状态
19. Writer Agent 读取 task summaries（不读取完整长日志），生成结构化 Markdown 报告
20. 报告支持 JSON 获取（final-report）和文件下载（download-report）两种方式
21. 后端测试使用 pytest + pytest-asyncio + in-memory SQLite，覆盖 Planner/Executor/ModelRouter/ToolGateway 核心流程
22. 交付文件包括 Dockerfile、docker-compose.yml、README（15 项内容）、.env.example、.gitignore，项目可通过 docker-compose up --build 一键启动
