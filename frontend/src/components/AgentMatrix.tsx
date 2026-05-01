import type { Agent, Task, MatrixCell } from "../api/types"
import MatrixCellView from "./MatrixCell"

const LEGEND: [string, string][] = [
  ["pending", "bg-gray-200"],
  ["ready", "bg-sky-200"],
  ["running", "bg-blue-300"],
  ["verifying", "bg-orange-300"],
  ["success", "bg-green-300"],
  ["failed", "bg-red-300"],
  ["blocked", "bg-purple-300"],
  ["needs_review", "bg-yellow-300"],
  ["retry", "bg-pink-300"],
]

function shortName(name: string): string {
  return name.replace("_agent", "")
}

interface Props {
  agents: Agent[]
  tasks: Task[]
  cells: MatrixCell[]
  onCellClick: (task: Task, agent: Agent, cell: MatrixCell | null) => void
}

export default function AgentMatrix({ agents, tasks, cells, onCellClick }: Props) {
  if (tasks.length === 0 || agents.length === 0) return null

  const cellMap = new Map<string, MatrixCell>()
  for (const cell of cells) {
    cellMap.set(`${cell.task_id}:${cell.agent_id}`, cell)
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Agent × Task 矩阵</h3>
      <div className="overflow-x-auto">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th className="border px-3 py-2 bg-gray-50 text-left sticky left-0 z-10">
                Agent \ Task
              </th>
              {tasks.map((t, i) => (
                <th
                  key={t.id}
                  className="border px-2 py-2 bg-gray-50 text-center min-w-[80px] cursor-help"
                  title={t.title}
                >
                  T{i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id}>
                <td className="border px-3 py-2 bg-gray-50 font-medium sticky left-0 z-10 whitespace-nowrap">
                  {shortName(agent.name)}
                </td>
                {tasks.map((task) => {
                  const cell = cellMap.get(`${task.id}:${agent.id}`) || null
                  return (
                    <MatrixCellView
                      key={task.id}
                      cell={cell}
                      onClick={() => onCellClick(task, agent, cell)}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3 mt-2 text-xs text-gray-500 flex-wrap">
        {LEGEND.map(([status, color]) => (
          <span key={status} className="flex items-center gap-1">
            <span className={`inline-block w-3 h-3 rounded ${color}`} />
            {status}
          </span>
        ))}
      </div>
    </div>
  )
}
