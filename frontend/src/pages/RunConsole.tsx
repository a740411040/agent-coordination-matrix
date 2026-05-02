import { useState, useEffect, useRef, useCallback } from "react"
import { api } from "../api/client"
import type { RunDetail, Agent, MatrixResponse, Task, MatrixCell, ToolCall, ModelCall } from "../api/types"
import GoalInput from "../components/GoalInput"
import TaskList from "../components/TaskList"
import AgentMatrix from "../components/AgentMatrix"
import StatusBadge from "../components/StatusBadge"
import TaskDetailPanel from "../components/TaskDetailPanel"
import FinalReport from "../components/FinalReport"
import DagView from "../components/DagView"
import ProviderSettingsSummary from "../components/ProviderSettingsSummary"
import AgentSettingsPanel from "../components/AgentSettingsPanel"

function MetricCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="stat-card-enhanced group">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2 ${color} transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{label}</div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="glass p-12 text-center animate-fade-in">
      <div className="text-4xl mb-4 opacity-40">
        <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  const lower = message.toLowerCase()
  let hint = ""
  if (lower.includes("fetch") || lower.includes("network") || lower.includes("failed to fetch") || lower.includes("econnrefused")) {
    hint = "The backend may be offline or sleeping. Check that the server is running and VITE_API_BASE_URL points to it."
  } else if (lower.includes("cors") || lower.includes("access-control")) {
    hint = "CORS error — add your frontend domain to the CORS_ORIGINS environment variable on the backend."
  } else if (lower.includes("500") || lower.includes("internal server error")) {
    hint = "The backend returned an error. Check the server logs for details."
  } else if (lower.includes("404")) {
    hint = "API endpoint not found. Ensure the backend version matches the frontend."
  }

  return (
    <div className="glass border-red-500/30 bg-red-500/[0.08] p-4 rounded-2xl animate-slide-up">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div className="flex-1">
          <span className="text-red-300 text-sm block">{message}</span>
          {hint && (
            <p className="text-xs text-red-400/60 mt-1.5 leading-relaxed">{hint}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {icon && <span className="text-accent-blue">{icon}</span>}
      <h3 className="section-title mb-0">{title}</h3>
      <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
    </div>
  )
}

export default function RunConsole() {
  const [run, setRun] = useState<RunDetail | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [matrix, setMatrix] = useState<MatrixResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [executing, setExecuting] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null)
  const [selectedToolCalls, setSelectedToolCalls] = useState<ToolCall[]>([])
  const [selectedModelCalls, setSelectedModelCalls] = useState<ModelCall[]>([])
  const [allToolCalls, setAllToolCalls] = useState<ToolCall[]>([])
  const [allModelCalls, setAllModelCalls] = useState<ModelCall[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refreshData = useCallback(async (runId: string) => {
    try {
      const [runData, tasksData, matrixData, toolCallsData, modelCallsData] = await Promise.all([
        api.getRun(runId),
        api.getRunTasks(runId),
        api.getMatrix(runId),
        api.getRunToolCalls(runId),
        api.getRunModelCalls(runId),
      ])
      setRun(runData)
      setTasks(tasksData)
      setMatrix(matrixData)
      setAllToolCalls(toolCallsData)
      setAllModelCalls(modelCallsData)

      if (runData.status === "completed" || runData.status === "failed") {
        setExecuting(false)
        if (pollRef.current) {
          clearInterval(pollRef.current)
          pollRef.current = null
        }
      }
    } catch {
    }
  }, [])

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
    }
  }, [])

  const startPolling = useCallback((runId: string) => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
    }
    pollRef.current = setInterval(() => refreshData(runId), 1000)
  }, [refreshData])

  const handleCreateRun = async (goal: string, plannerMode: string) => {
    setLoading(true)
    setError("")
    setExecuting(false)
    setSelectedTask(null)
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    try {
      const result = await api.createRun(goal, plannerMode)
      setRun(result)
      setTasks(result.tasks)
      const allAgents = await api.listAgents()
      setAgents(allAgents)
      const m = await api.getMatrix(result.id)
      setMatrix(m)
      setAllToolCalls([])
      setAllModelCalls([])
      setLoading(false)

      setExecuting(true)
      await api.startRun(result.id)
      await refreshData(result.id)
      startPolling(result.id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setLoading(false)
      setExecuting(false)
    }
  }

  const handleStart = async () => {
    if (!run) return
    setError("")
    setExecuting(true)
    try {
      await api.startRun(run.id)
      startPolling(run.id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setExecuting(false)
    }
  }

  const handleCellClick = async (task: Task, agent: Agent | null, cell: MatrixCell | null) => {
    const latestTask = tasks.find((t) => t.id === task.id) || task
    setSelectedTask(latestTask)
    setSelectedAgent(agent)
    setSelectedCell(cell)
    try {
      if (run) {
        const [taskToolCalls, taskModelCalls] = await Promise.all([
          api.getRunToolCalls(run.id),
          api.getRunModelCalls(run.id),
        ])
        setSelectedToolCalls(taskToolCalls.filter((tc) => tc.task_id === task.id))
        setSelectedModelCalls(taskModelCalls.filter((mc) => mc.task_id === task.id))
      }
    } catch {
      setSelectedToolCalls([])
      setSelectedModelCalls([])
    }
  }

  const handleClosePanel = () => {
    setSelectedTask(null)
    setSelectedAgent(null)
    setSelectedCell(null)
    setSelectedToolCalls([])
    setSelectedModelCalls([])
  }

  const handleTaskUpdated = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    setSelectedTask(updated)
    if (run) {
      setExecuting(true)
      startPolling(run.id)
    }
  }

  const handleDagTaskClick = (task: Task) => {
    const agent = agents.find((a) => a.id === task.assigned_agent_id) || null
    handleCellClick(task, agent, null)
  }

  const displayTasks = tasks.length > 0 ? tasks : (run?.tasks ?? [])

  const completedTasks = displayTasks.filter((t) => t.status === "completed" || t.status === "success").length

  return (
    <div className="relative z-10">
      {/* Hero */}
      <header className="relative pt-12 pb-8 px-4 sm:px-8 text-center animate-fade-in overflow-hidden">
        <div className="hero-orb w-64 h-64 -top-32 left-1/2 -translate-x-1/2 bg-accent-blue/10" />
        <div className="hero-orb w-48 h-48 -bottom-24 left-1/4 bg-accent-purple/8 animate-float" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-glow-pulse" />
            v1.0 — Multi-Agent Coordination
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            <span className="text-gradient-blue">FutureAgent</span>
          </h1>
          <p className="text-lg text-gray-400 font-light mb-2">
            Composite Visual AI Agent Coordination System
          </p>
          <p className="text-sm text-gray-500 max-w-xl mx-auto mb-5">
            Visual orchestration for multi-agent, multi-model, multi-tool AI workflows.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <span className="highlight-badge bg-accent-blue/10 border-accent-blue/20 text-accent-blue">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Multi-Agent Coordination
            </span>
            <span className="highlight-badge bg-accent-purple/10 border-accent-purple/20 text-accent-purple">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Multi-Model Routing
            </span>
            <span className="highlight-badge bg-accent-green/10 border-accent-green/20 text-accent-green">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Tool Gateway
            </span>
            <span className="highlight-badge bg-accent-amber/10 border-accent-amber/20 text-accent-amber">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              Visual Audit Trail
            </span>
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            className="btn-secondary text-xs inline-flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Agent / Model Settings
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-16 space-y-8">
        {/* Goal Input */}
        <GoalInput onSubmit={handleCreateRun} loading={loading} hasRun={!!run} />

        {/* Provider Status Summary */}
        {!run && !loading && <ProviderSettingsSummary />}

        {/* Error */}
        {error && <ErrorBanner message={error} />}

        {/* Metric Cards */}
        {run && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-slide-up">
            <MetricCard
              label="Agents"
              value={agents.length || matrix?.agents.length || 0}
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              color="bg-accent-blue/20 text-accent-blue"
            />
            <MetricCard
              label="Tasks"
              value={displayTasks.length}
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
              color="bg-accent-cyan/20 text-accent-cyan"
            />
            <MetricCard
              label="Completed"
              value={completedTasks}
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              color="bg-accent-green/20 text-accent-green"
            />
            <MetricCard
              label="Tool Calls"
              value={allToolCalls.length}
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              color="bg-accent-green/20 text-accent-green"
            />
            <MetricCard
              label="Model Calls"
              value={allModelCalls.length}
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              color="bg-accent-purple/20 text-accent-purple"
            />
            <MetricCard
              label="Status"
              value={run.status}
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              color={run.status === "completed" ? "bg-accent-green/20 text-accent-green" : run.status === "failed" ? "bg-accent-red/20 text-accent-red" : "bg-accent-blue/20 text-accent-blue"}
            />
          </div>
        )}

        {/* Run Info Card */}
        {run && (
          <div className="glass p-6 animate-slide-up">
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <h2 className="text-lg font-bold text-white">Run</h2>
              <span className="font-mono text-xs text-gray-500 bg-white/[0.04] px-2 py-1 rounded-md">{run.id}</span>
              <StatusBadge status={run.status} variant="run" />
              {run.status === "executing" && (
                <span className="text-xs text-accent-blue animate-pulse">Executing...</span>
              )}
              {run.status === "synthesizing" && (
                <span className="text-xs text-accent-purple animate-pulse">Generating report...</span>
              )}
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{run.goal}</p>
            {run.status === "pending" && (
              <button onClick={handleStart} disabled={executing} className="btn-primary mt-4">
                {executing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Starting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                    Start Execution
                  </span>
                )}
              </button>
            )}
            {completedTasks > 0 && displayTasks.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Progress</span>
                  <span>{completedTasks} / {displayTasks.length}</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-blue to-accent-cyan rounded-full transition-all duration-700"
                    style={{ width: `${(completedTasks / displayTasks.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!run && !loading && <EmptyState message="Enter a goal above to start an AI-coordinated workflow" />}

        {/* Loading */}
        {loading && (
          <div className="glass p-12 text-center animate-fade-in">
            <div className="inline-flex items-center gap-3 text-gray-400">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Creating your run and generating tasks...</span>
            </div>
          </div>
        )}

        {/* Task List */}
        {displayTasks.length > 0 && (
          <section className="animate-slide-up">
            <SectionHeader
              title="Tasks"
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            />
            <TaskList tasks={displayTasks} agents={agents} />
          </section>
        )}

        {/* DAG View */}
        {displayTasks.length > 0 && (
          <section className="animate-slide-up">
            <SectionHeader
              title="DAG Dependency Graph"
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            />
            <DagView tasks={displayTasks} agents={agents} onTaskClick={handleDagTaskClick} />
          </section>
        )}

        {/* Agent Matrix */}
        {matrix && (
          <section className="animate-slide-up">
            <SectionHeader
              title="Agent × Task Matrix"
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
            />
            <AgentMatrix
              agents={matrix.agents}
              tasks={matrix.tasks}
              cells={matrix.cells}
              onCellClick={handleCellClick}
            />
          </section>
        )}

        {/* Final Report */}
        {run && run.status === "completed" && run.final_report && (
          <section className="animate-slide-up">
            <SectionHeader
              title="Final Report"
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            />
            <FinalReport runId={run.id} visible={true} />
          </section>
        )}
      </div>

      {/* Task Detail Panel */}
      {selectedTask && (
        <>
          <div className="panel-overlay" onClick={handleClosePanel} />
          <TaskDetailPanel
            task={selectedTask}
            agent={selectedAgent}
            cell={selectedCell}
            agents={agents}
            toolCalls={selectedToolCalls}
            modelCalls={selectedModelCalls}
            onClose={handleClosePanel}
            onTaskUpdated={handleTaskUpdated}
          />
        </>
      )}

      {/* Agent Settings Panel */}
      <AgentSettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
