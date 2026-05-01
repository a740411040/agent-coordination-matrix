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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refreshData = useCallback(async (runId: string) => {
    try {
      const [runData, tasksData, matrixData] = await Promise.all([
        api.getRun(runId),
        api.getRunTasks(runId),
        api.getMatrix(runId),
      ])
      setRun(runData)
      setTasks(tasksData)
      setMatrix(matrixData)

      if (runData.status === "completed" || runData.status === "failed" || runData.status === "synthesizing") {
        if (runData.status === "completed" || runData.status === "failed") {
          setExecuting(false)
          if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
          }
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
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
        const [allToolCalls, allModelCalls] = await Promise.all([
          api.getRunToolCalls(run.id),
          api.getRunModelCalls(run.id),
        ])
        setSelectedToolCalls(allToolCalls.filter((tc) => tc.task_id === task.id))
        setSelectedModelCalls(allModelCalls.filter((mc) => mc.task_id === task.id))
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

  return (
    <div className="space-y-4 relative">
      <GoalInput onSubmit={handleCreateRun} loading={loading} />

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {run && (
        <div className="p-4 bg-white border rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-lg font-semibold">Run</h2>
            <span className="text-xs text-gray-400 font-mono">{run.id}</span>
            <StatusBadge status={run.status} variant="run" />
            {run.status === "executing" && (
              <span className="text-xs text-blue-500 animate-pulse">执行中...</span>
            )}
            {run.status === "synthesizing" && (
              <span className="text-xs text-purple-500 animate-pulse">报告生成中...</span>
            )}
          </div>
          <p className="text-gray-700">{run.goal}</p>
          {run.status === "pending" && (
            <button
              onClick={handleStart}
              disabled={executing}
              className="mt-3 px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {executing ? "启动中..." : "▶ Start 执行"}
            </button>
          )}
        </div>
      )}

      {displayTasks.length > 0 && (
        <TaskList tasks={displayTasks} agents={agents} />
      )}

      {displayTasks.length > 0 && (
        <DagView tasks={displayTasks} agents={agents} onTaskClick={handleDagTaskClick} />
      )}

      {matrix && (
        <AgentMatrix
          agents={matrix.agents}
          tasks={matrix.tasks}
          cells={matrix.cells}
          onCellClick={handleCellClick}
        />
      )}

      {run && run.status === "completed" && run.final_report && (
        <FinalReport runId={run.id} visible={true} />
      )}

      {selectedTask && (
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
      )}
    </div>
  )
}
