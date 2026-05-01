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
  if (!id) return "未分配"
  const a = agents.find((a) => a.id === id)
  return a ? a.name : id.slice(0, 8)
}

const RETRYABLE_STATUSES = ["failed", "needs_review"]

export default function TaskDetailPanel({ task, agent, cell, agents, toolCalls, modelCalls, onClose, onTaskUpdated }: Props) {
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState("")

  const depNames = (task.dependencies || []).map((depId) => {
    return depId.slice(0, 8)
  })

  const canRetry = RETRYABLE_STATUSES.includes(task.status)

  const handleRetry = async () => {
    setRetrying(true)
    setRetryError("")
    try {
      const updated = await api.retryTask(task.id)
      if (onTaskUpdated) {
        onTaskUpdated(updated)
      }
    } catch (e: unknown) {
      setRetryError(e instanceof Error ? e.message : String(e))
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-white border-l shadow-lg z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <h3 className="font-semibold text-sm truncate flex-1 mr-2">{task.title}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 text-lg leading-none px-1"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
        <section>
          <div className="text-xs text-gray-500 mb-1">状态</div>
          <StatusBadge status={task.status} />
        </section>

        <section>
          <div className="text-xs text-gray-500 mb-1">描述</div>
          <p className="text-gray-700">{task.description || "—"}</p>
        </section>

        <section>
          <div className="text-xs text-gray-500 mb-1">分配 Agent</div>
          <span className="text-gray-700">{agent ? agent.name : resolveAgentName(agents, task.assigned_agent_id)}</span>
        </section>

        <section>
          <div className="text-xs text-gray-500 mb-1">期望输出</div>
          <p className="text-gray-700">{task.expected_output || "—"}</p>
        </section>

        <section>
          <div className="text-xs text-gray-500 mb-1">依赖任务</div>
          {depNames.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {depNames.map((name, i) => (
                <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">无依赖</span>
          )}
        </section>

        <section>
          <div className="text-xs text-gray-500 mb-1">重试次数</div>
          <div className="flex items-center gap-2">
            <span className={`font-medium ${task.retry_count > 0 ? "text-orange-600" : "text-gray-700"}`}>
              {task.retry_count}
            </span>
            {canRetry && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="px-3 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {retrying ? "重试中..." : "🔄 Retry"}
              </button>
            )}
          </div>
          {retryError && (
            <p className="text-xs text-red-600 mt-1">{retryError}</p>
          )}
        </section>

        {task.result && (
          <section>
            <div className="text-xs text-gray-500 mb-1">执行结果</div>
            <pre className="bg-gray-50 p-3 rounded text-xs text-gray-700 whitespace-pre-wrap break-words">
              {task.result}
            </pre>
          </section>
        )}

        {task.error && (
          <section>
            <div className="text-xs text-gray-500 mb-1">错误信息</div>
            <pre className="bg-red-50 p-3 rounded text-xs text-red-700 whitespace-pre-wrap break-words">
              {task.error}
            </pre>
          </section>
        )}

        {cell && cell.logs && cell.logs.length > 0 && (
          <section>
            <div className="text-xs text-gray-500 mb-1">执行日志</div>
            <div className="space-y-1">
              {cell.logs.map((log, i) => (
                <div key={i} className="bg-gray-50 px-3 py-1.5 rounded text-xs">
                  {typeof log === "object" && log !== null ? (
                    <>
                      <span className="font-mono text-gray-500">{String((log as Record<string, unknown>).step || "?")}</span>
                      <span className="mx-1 text-gray-300">→</span>
                      <span className="text-gray-700">{String((log as Record<string, unknown>).detail || JSON.stringify(log))}</span>
                    </>
                  ) : (
                    <span className="text-gray-700">{String(log)}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {modelCalls.length > 0 && (
          <section>
            <div className="text-xs text-gray-500 mb-1">模型调用 ({modelCalls.length})</div>
            <ModelCallList modelCalls={modelCalls} />
          </section>
        )}

        {toolCalls.length > 0 && (
          <section>
            <div className="text-xs text-gray-500 mb-1">工具调用 ({toolCalls.length})</div>
            <ToolCallList toolCalls={toolCalls} />
          </section>
        )}

        {cell && cell.summary && (
          <section>
            <div className="text-xs text-gray-500 mb-1">Agent 摘要</div>
            <p className="text-gray-700">{cell.summary}</p>
          </section>
        )}

        <section>
          <div className="text-xs text-gray-500 mb-1">时间</div>
          <div className="text-gray-600 text-xs space-y-0.5">
            <div>创建: {new Date(task.created_at).toLocaleString()}</div>
            <div>更新: {new Date(task.updated_at).toLocaleString()}</div>
          </div>
        </section>
      </div>
    </div>
  )
}
