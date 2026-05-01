import type { Task, Agent } from "../api/types"
import StatusBadge from "./StatusBadge"

interface Props {
  tasks: Task[]
  agents: Agent[]
}

function getAgentName(agents: Agent[], id: string | null): string {
  if (!id) return "未分配"
  const agent = agents.find((a) => a.id === id)
  return agent ? agent.name : id.slice(0, 8)
}

export default function TaskList({ tasks, agents }: Props) {
  if (tasks.length === 0) return null

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">任务列表</h3>
      <div className="space-y-2">
        {tasks.map((task, idx) => (
          <div
            key={task.id}
            className="p-3 bg-white border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 w-6 text-right">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{task.title}</div>
                <div className="text-sm text-gray-500 truncate">
                  {task.description}
                </div>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {getAgentName(agents, task.assigned_agent_id)}
              </span>
              {task.retry_count > 0 && (
                <span className="text-xs text-orange-600 whitespace-nowrap" title="重试次数">
                  retry:{task.retry_count}
                </span>
              )}
              <StatusBadge status={task.status} />
              {task.dependencies && task.dependencies.length > 0 && (
                <span className="text-xs text-gray-400" title={task.dependencies.join(", ")}>
                  deps:{task.dependencies.length}
                </span>
              )}
            </div>
            {task.result && (
              <div className="mt-2 ml-9 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                {task.result.length > 120 ? task.result.slice(0, 120) + "..." : task.result}
              </div>
            )}
            {task.error && (
              <div className="mt-2 ml-9 text-xs text-red-600 bg-red-50 p-2 rounded">
                {task.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
