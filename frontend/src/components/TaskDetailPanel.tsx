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

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="section-panel p-4">
      <h4 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500 mb-2 flex items-center gap-1.5">
        {icon}
        {title}
      </h4>
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

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
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
        <Section title="Basic Info" icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
          <p className="text-sm text-gray-300 leading-relaxed mb-2">{task.description || "No description"}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">Agent</span>
              <p className="text-sm text-gray-300">{agent ? agent.name.replace(/_/g, " ") : resolveAgentName(agents, task.assigned_agent_id)}</p>
            </div>
            <div>
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">Expected Output</span>
              <p className="text-sm text-gray-300">{task.expected_output || "—"}</p>
            </div>
          </div>
        </Section>

        {/* Dependencies */}
        <Section title="Dependencies" icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}>
          {depNames.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {depNames.map((name, i) => (
                <span key={i} className="tag font-mono">{name}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No dependencies — root task</p>
          )}
        </Section>

        {/* Result */}
        {task.result && (
          <Section title="Result" icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
            <pre className="code-block">{task.result}</pre>
          </Section>
        )}

        {/* Error */}
        {task.error && (
          <Section title="Error" icon={<svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
            <pre className="bg-red-500/[0.06] border border-red-500/10 rounded-xl p-4 font-mono text-xs text-red-400 whitespace-pre-wrap break-words">
              {task.error}
            </pre>
          </Section>
        )}

        {/* Logs */}
        {cell && cell.logs && cell.logs.length > 0 && (
          <Section title="Execution Logs" icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}>
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

        {/* Tool Calls */}
        {toolCalls.length > 0 && (
          <Section title={`Tool Calls (${toolCalls.length})`} icon={<svg className="w-3 h-3 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}>
            <ToolCallList toolCalls={toolCalls} />
          </Section>
        )}

        {/* Model Calls */}
        {modelCalls.length > 0 && (
          <Section title={`Model Calls (${modelCalls.length})`} icon={<svg className="w-3 h-3 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}>
            <ModelCallList modelCalls={modelCalls} />
          </Section>
        )}

        {/* Agent Summary */}
        {cell && cell.summary && (
          <Section title="Agent Summary" icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>
            <p className="text-sm text-gray-300 leading-relaxed">{cell.summary}</p>
          </Section>
        )}

        {/* Timestamps */}
        <Section title="Timestamps" icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
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
