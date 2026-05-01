import type { Task, Agent } from "../api/types"
import StatusBadge from "./StatusBadge"

interface Props {
  tasks: Task[]
  agents: Agent[]
}

function getAgentName(agents: Agent[], id: string | null): string {
  if (!id) return "unassigned"
  const agent = agents.find((a) => a.id === id)
  return agent ? agent.name.replace(/_/g, " ") : id.slice(0, 8)
}

export default function TaskList({ tasks, agents }: Props) {
  if (tasks.length === 0) return null

  return (
    <div className="space-y-2">
      {tasks.map((task, idx) => (
        <div
          key={task.id}
          className="glass glass-hover p-4 group animate-slide-up"
          style={{ animationDelay: `${idx * 50}ms` }}
        >
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/[0.04] text-gray-500 text-xs font-mono flex-shrink-0 mt-0.5">
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold text-gray-200 truncate">{task.title}</h4>
                <StatusBadge status={task.status} />
                {task.retry_count > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    ↻ {task.retry_count}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">{task.description}</p>
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-gray-500">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  {getAgentName(agents, task.assigned_agent_id)}
                </span>
                {task.dependencies && task.dependencies.length > 0 && (
                  <span className="flex items-center gap-1 text-gray-600" title={task.dependencies.map(d => d.slice(0, 8)).join(", ")}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    {task.dependencies.length} deps
                  </span>
                )}
              </div>
            </div>
          </div>
          {task.result && (
            <div className="mt-3 ml-12 text-xs text-gray-400 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl line-clamp-3">
              {task.result}
            </div>
          )}
          {task.error && (
            <div className="mt-3 ml-12 text-xs text-red-400 bg-red-500/[0.06] border border-red-500/10 p-3 rounded-xl">
              {task.error}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
