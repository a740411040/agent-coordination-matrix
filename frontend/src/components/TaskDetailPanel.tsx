import { useState } from "react"
import type { Task, Agent, MatrixCell, ToolCall, ModelCall } from "../api/types"
import { api } from "../api/client"
import StatusBadge from "./StatusBadge"
import ToolCallList from "./ToolCallList"
import ModelCallList from "./ModelCallList"

interface Props {
  task: Task
  agent: Agent | null
  cell: MatrixCell | null
  agents: Agent[]
  toolCalls: ToolCall[]
  modelCalls: ModelCall[]
  onClose: () => void
  onTaskUpdated?: (task: Task) => void
}

function resolveAgentName(agents: Agent[], id: string | null): string {
  if (!id) return "unassigned"
  const a = agents.find((a) => a.id === id)
  return a ? a.name.replace(/_/g, " ") : id.slice(0, 8)
}

const RETRYABLE_STATUSES = ["failed", "needs_review"]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">{title}</h4>
      {children}
    </div>
  )
}

export default function TaskDetailPanel({ task, agent, cell, agents, toolCalls, modelCalls, onClose, onTaskUpdated }: Props) {
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState("")

  const depNames = (task.dependencies || []).map((depId) => depId.slice(0, 8))
  const canRetry = RETRYABLE_STATUSES.includes(task.status)

  const handleRetry = async () => {
    setRetrying(true)
    setRetryError("")
    try {
      const updated = await api.retryTask(task.id)
      if (onTaskUpdated) onTaskUpdated(updated)
    } catch (e: unknown) {
      setRetryError(e instanceof Error ? e.message : String(e))
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="panel-slide">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex-1 min-w-0 mr-3">
          <h3 className="font-bold text-white truncate">{task.title}</h3>
          <p className="text-xs text-gray-500 font-mono mt-0.5">{task.id.slice(0, 12)}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center
            text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Status + Retry */}
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={task.status} />
          {task.retry_count > 0 && (
            <span className="tag">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              {task.retry_count} retries
            </span>
          )}
          {canRetry && (
            <button onClick={handleRetry} disabled={retrying} className="btn-secondary text-xs">
              {retrying ? "Retrying..." : "↻ Retry"}
            </button>
          )}
        </div>
        {retryError && <p className="text-xs text-red-400">{retryError}</p>}

        {/* Basic Info */}
        <Section title="Description">
          <p className="text-sm text-gray-300 leading-relaxed">{task.description || "No description"}</p>
        </Section>

        <div className="grid grid-cols-2 gap-4">
          <Section title="Agent">
            <p className="text-sm text-gray-300">{agent ? agent.name.replace(/_/g, " ") : resolveAgentName(agents, task.assigned_agent_id)}</p>
          </Section>
          <Section title="Expected Output">
            <p className="text-sm text-gray-300">{task.expected_output || "—"}</p>
          </Section>
        </div>

        <Section title="Dependencies">
          {depNames.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {depNames.map((name, i) => (
                <span key={i} className="tag font-mono">{name}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No dependencies</p>
          )}
        </Section>

        <div className="divider" />

        {/* Result */}
        {task.result && (
          <Section title="Result">
            <pre className="code-block">{task.result}</pre>
          </Section>
        )}

        {/* Error */}
        {task.error && (
          <Section title="Error">
            <pre className="bg-red-500/[0.06] border border-red-500/10 rounded-xl p-4 font-mono text-xs text-red-400 whitespace-pre-wrap break-words">
              {task.error}
            </pre>
          </Section>
        )}

        {/* Logs */}
        {cell && cell.logs && cell.logs.length > 0 && (
          <Section title="Execution Logs">
            <div className="space-y-1.5">
              {cell.logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="text-gray-700 font-mono flex-shrink-0">{String(i).padStart(2, "0")}</span>
                  {typeof log === "object" && log !== null ? (
                    <span className="text-gray-400">
                      <span className="text-gray-500 font-medium">{String((log as Record<string, unknown>).step || "·")}</span>
                      <span className="text-gray-700 mx-1">→</span>
                      {String((log as Record<string, unknown>).detail || JSON.stringify(log))}
                    </span>
                  ) : (
                    <span className="text-gray-400">{String(log)}</span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Model Calls */}
        {modelCalls.length > 0 && (
          <>
            <div className="divider" />
            <Section title={`Model Calls (${modelCalls.length})`}>
              <ModelCallList modelCalls={modelCalls} />
            </Section>
          </>
        )}

        {/* Tool Calls */}
        {toolCalls.length > 0 && (
          <>
            <div className="divider" />
            <Section title={`Tool Calls (${toolCalls.length})`}>
              <ToolCallList toolCalls={toolCalls} />
            </Section>
          </>
        )}

        {/* Agent Summary */}
        {cell && cell.summary && (
          <>
            <div className="divider" />
            <Section title="Agent Summary">
              <p className="text-sm text-gray-300 leading-relaxed">{cell.summary}</p>
            </Section>
          </>
        )}

        <div className="divider" />

        {/* Timestamps */}
        <Section title="Timestamps">
          <div className="space-y-1 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Created: {new Date(task.created_at).toLocaleString()}
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Updated: {new Date(task.updated_at).toLocaleString()}
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
