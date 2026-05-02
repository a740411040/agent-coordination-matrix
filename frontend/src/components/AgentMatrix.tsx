import type { Agent, Task, MatrixCell } from "../api/types"
import MatrixCellView from "./MatrixCell"

const LEGEND: [string, string][] = [
  ["pending", "bg-gray-500/30"],
  ["ready", "bg-sky-500/30"],
  ["running", "bg-blue-500/30"],
  ["verifying", "bg-amber-500/30"],
  ["success", "bg-emerald-500/30"],
  ["failed", "bg-red-500/30"],
  ["blocked", "bg-purple-500/30"],
  ["needs_review", "bg-yellow-500/30"],
  ["retry", "bg-pink-500/30"],
]

function shortName(name: string): string {
  return name.replace("_agent", "").replace(/_/g, " ")
}

interface Props {
  agents: Agent[]
  tasks: Task[]
  cells: MatrixCell[]
  onCellClick: (task: Task, agent: Agent, cell: MatrixCell | null) => void
  selectedTaskId?: string | null
  selectedAgentId?: string | null
}

export default function AgentMatrix({ agents, tasks, cells, onCellClick, selectedTaskId, selectedAgentId }: Props) {
  if (tasks.length === 0 || agents.length === 0) return null

  const cellMap = new Map<string, MatrixCell>()
  for (const cell of cells) {
    cellMap.set(`${cell.task_id}:${cell.agent_id}`, cell)
  }

  return (
    <div className="grid-matrix">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface-2/90 backdrop-blur-sm px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-white/[0.06] min-w-[120px]">
                <span className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-accent-blue/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Agent
                </span>
              </th>
              {tasks.map((t, i) => {
                const isSelected = selectedTaskId === t.id
                return (
                  <th
                    key={t.id}
                    className={`px-3 py-3 text-center text-xs font-semibold border-b border-white/[0.06] min-w-[90px] transition-colors duration-200
                      ${isSelected ? "bg-accent-blue/15 text-accent-blue" : "bg-surface-2/90 text-gray-500 hover:bg-surface-3/60"}`}
                    title={t.title}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[10px] opacity-60">T{i + 1}</span>
                      <span className="truncate max-w-[80px]">{t.title?.slice(0, 12)}</span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => {
              const isAgentSelected = selectedAgentId === agent.id
              return (
                <tr key={agent.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className={`sticky left-0 z-10 backdrop-blur-sm px-4 py-2 border-b border-white/[0.04] whitespace-nowrap transition-colors duration-200
                    ${isAgentSelected ? "bg-accent-blue/10" : "bg-surface-1/90 group-hover:bg-surface-2/90"}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full transition-colors ${isAgentSelected ? "bg-accent-blue" : "bg-accent-blue/40 group-hover:bg-accent-blue/60"}`} />
                      <span className={`text-xs font-medium transition-colors ${isAgentSelected ? "text-accent-blue" : "text-gray-300 group-hover:text-gray-200"}`}>
                        {shortName(agent.name)}
                      </span>
                    </div>
                  </td>
                  {tasks.map((task) => {
                    const cell = cellMap.get(`${task.id}:${agent.id}`) || null
                    return (
                      <MatrixCellView
                        key={task.id}
                        cell={cell}
                        onClick={() => onCellClick(task, agent, cell)}
                        selected={selectedTaskId === task.id && selectedAgentId === agent.id}
                      />
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3 px-4 py-3 border-t border-white/[0.06] text-[10px] text-gray-500 flex-wrap">
        {LEGEND.map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
            {status}
          </span>
        ))}
      </div>
    </div>
  )
}
