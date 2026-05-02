# FutureAgent — Demo Walkthrough

This guide walks you through a complete FutureAgent demo session, from entering a goal to downloading the final report.

---

## Prerequisites

- FutureAgent backend running on `http://localhost:8000` (or the public demo backend)
- FutureAgent frontend running on `http://localhost:5173` (or the public demo)

If you haven't started the project yet, see the main [README.md](../README.md) Quick Start section.

---

## Step 1: Enter a Goal

Open the FutureAgent console. You'll see the hero area at the top with:

- **FutureAgent** title and description
- 4 highlight badges: Multi-Agent Coordination, Multi-Model Routing, Tool Gateway, Visual Audit Trail
- Dashboard metric cards (Agents, Tasks, Completed, Tool Calls, Model Calls, Status)

Below the hero, you'll find the **Goal Input** section.

### Using a Demo Goal

Click one of the three pre-built demo goals:

- **Sales Analysis**: "Analyze a CSV sales dataset and generate an executive report."
- **Code Review**: "Build and review a Python data-cleaning workflow."
- **Research Pipeline**: "Coordinate a multi-agent research analysis pipeline."

These goals are designed to exercise different parts of the system and produce meaningful results.

### Writing Your Own Goal

Type any natural language objective into the goal input field. Examples:

- "Research the latest developments in quantum computing and write a summary report"
- "Analyze user engagement data and recommend optimization strategies"
- "Build a data pipeline for processing sensor readings"

### Planner Mode

Select the planner mode:

- **Mock** (default): Uses template-based task decomposition. Fast, no API key needed.
- **Real**: Uses an LLM to decompose the goal into tasks. Requires `OPENAI_API_KEY` or `MIMO_API_KEY`.

---

## Step 2: Planner Creates Task DAG

Click **Start** to begin execution. The system:

1. Creates a new Run (status: `pending`)
2. Sends your goal to the Planner Agent
3. Planner decomposes it into tasks with dependencies
4. Run status changes to `executing`

### What You'll See

- **Dashboard metrics** update in real-time (Tasks count increases)
- **Task List** appears with all generated tasks
- **DAG View** shows the dependency graph with status-colored nodes

### Demo Tips (Displayed in UI)

1. Enter a goal
2. Planner creates a task DAG
3. Agents execute tasks
4. Inspect ToolCall & ModelCall logs
5. Download the final report

---

## Step 3: Agents Execute Tasks

The Executor runs tasks in topological order:

- Tasks with no dependencies run first
- Dependent tasks wait for their prerequisites
- Each task is assigned to a specialized agent (data, code, critic, writer)

### Watching the Matrix

The **Agent x Task Matrix** is the primary monitoring view:

- Each cell represents an agent-task pair
- **Gray**: Pending (not started)
- **Blue pulse**: Running (with glow animation)
- **Green**: Completed successfully
- **Yellow pulse**: Needs review (CriticAgent flagged an issue)
- **Red pulse**: Failed (auto-retry in progress)

**Interactions:**

- **Hover** a cell to see agent and task summary
- **Click** a cell to open the Task Detail Panel
- **Hover** a task column header to highlight the entire column
- **Hover** an agent row to highlight the entire row

### DAG View

The DAG view shows tasks as cards connected by dependency arrows:

- Node border color matches task status
- Running nodes pulse with a glow effect
- Click any node to open its detail panel

---

## Step 4: Inspect Calls and Logs

Click any matrix cell or DAG node to open the **Task Detail Panel**:

### Basic Info
- Task title, description, assigned agent, expected output

### Dependencies
- List of upstream task IDs this task depends on

### Execution Logs
- Step-by-step log entries from the agent's execution

### Tool Calls
Expand each tool call to see:
- **Tool name** (e.g., `file.read`, `python.run`, `http.request`)
- **Input arguments** (JSON)
- **Output result** (JSON)
- **Duration** in milliseconds

### Model Calls
Expand each model call to see:
- **Provider** and **model name**
- **Prompt** text
- **Response** text
- **Token counts** (input / output)
- **Duration** in milliseconds

### Error (if any)
- Full error message with red styling
- Retry button for failed/needs_review tasks

---

## Step 5: Download the Final Report

Once all tasks complete, the **Final Report** section appears:

- Document preview style with the full Markdown report
- **Download .md** button to save the report locally
- Report includes: executive summary, task-by-task results, methodology, and recommendations

### Report Contents

The synthesized report typically includes:

1. **Executive Summary** — High-level overview of findings
2. **Data Analysis** — Results from the data agent
3. **Implementation** — Code and technical details from the code agent
4. **Quality Review** — Assessment from the critic agent
5. **Final Report** — Polished write-up from the writer agent

---

## Agent Settings

Click the **Agent Settings** button (gear icon in the hero area) to open the settings panel:

### Provider Status
At the top, you'll see the status of each model provider:
- **Available** (green): API key configured, connectivity OK
- **Configured** (blue): API key set, not yet tested
- **Missing API Key** (yellow): No key configured

### Per-Agent Configuration
For each agent, you can configure:

| Setting | Description |
|---------|-------------|
| Agent Type | `mock`, `rule`, or `llm` |
| Model Provider | `mock`, `rule`, `mimo`, `openai_compatible` |
| Model Name | e.g., `gpt-4o`, `qwen2.5-7b-instruct`, `default` |
| Temperature | 0.0 – 1.0 (lower = more deterministic) |
| Tools | Select which tools the agent can use |

Changes take effect on the next Run.

---

## Example Session

Here's a complete example session:

1. Open `http://localhost:5173`
2. Click the demo goal: "Analyze a CSV sales dataset and generate an executive report."
3. Select **Mock** planner mode
4. Click **Start**
5. Watch the matrix: tasks go from gray → blue (running) → green (completed)
6. Click the "data_analysis" task cell in the matrix
7. Expand Tool Calls to see `file.read` and `mock_api.call` invocations
8. Expand Model Calls to see the prompt and response
9. Close the detail panel, wait for all tasks to complete
10. Scroll down to the Final Report section
11. Click **Download .md** to save the report

Total time: ~10-30 seconds in mock mode.

---

## Using Real LLMs

To use real LLMs instead of mock/rule agents:

1. Add your API key to `backend/.env`:
   ```
   OPENAI_API_KEY=your-key-here
   OPENAI_BASE_URL=https://api.openai.com/v1
   ```
2. Restart the backend
3. Open Agent Settings → change agent's Model Provider to `openai_compatible`
4. Set Model Name (e.g., `gpt-4o-mini`)
5. Set Planner Mode to **Real** in the goal input
6. Enter a goal and click Start

The matrix will show real LLM responses, and Model Calls will show actual token usage.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Backend may be offline" | Check if backend is running on port 8000 |
| "CORS error" | Add your frontend URL to `CORS_ORIGINS` in backend `.env` |
| Tasks stuck in "pending" | Click Start button, or check backend logs for errors |
| "No report available" | Wait for all tasks to complete; check for failed tasks |
| Matrix shows "N/A" cells | Normal — not every agent works on every task |

---

## Live Demo URLs

| Environment | URL |
|------------|-----|
| Frontend | https://futureagent-c0ab4cnu.edgeone.cool/ |
| Backend API | https://agent-coordination-matrix.onrender.com/api/health |
| Swagger UI | https://agent-coordination-matrix.onrender.com/docs |
