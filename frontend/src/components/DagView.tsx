import { useMemo, useRef, useLayoutEffect, useState, useCallback } from "react"
import type { Task } from "../api/types"
import StatusBadge from "./StatusBadge"

interface Props {
  tasks: Task[]
  agents?: { id: string; name: string }[]
  onTaskClick?: (task: Task) => void
}

function computeLevels(tasks: Task[]): Map<string, number> {
  const taskMap = new Map(tasks.map((t) => [t.id, t]))
  const levels = new Map<string, number>()

  function getLevel(taskId: string, visiting = new Set<string>()): number {
    if (levels.has(taskId)) return levels.get(taskId)!
    if (visiting.has(taskId)) return 0
    visiting.add(taskId)

    const task = taskMap.get(taskId)
    if (!task || !task.dependencies || task.dependencies.length === 0) {
      levels.set(taskId, 0)
      return 0
    }

    let maxDep = -1
    for (const depId of task.dependencies) {
      if (taskMap.has(depId)) {
        maxDep = Math.max(maxDep, getLevel(depId, visiting))
      }
    }

    const lv = maxDep >= 0 ? maxDep + 1 : 0
    levels.set(taskId, lv)
    return lv
  }

  for (const t of tasks) {
    getLevel(t.id)
  }
  return levels
}

interface Line {
  x1: number
  y1: number
  x2: number
  y2: number
}

export default function DagView({ tasks, agents, onTaskClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 })
  const [lines, setLines] = useState<Line[]>([])

  const levels = useMemo(() => computeLevels(tasks), [tasks])

  const levelGroups = useMemo(() => {
    const grouped = new Map<number, Task[]>()
    for (const [taskId, lv] of levels) {
      const task = tasks.find((t) => t.id === taskId)
      if (!task) continue
      if (!grouped.has(lv)) grouped.set(lv, [])
      grouped.get(lv)!.push(task)
    }
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a - b)
      .map(([lv, ts]) => ({ level: lv, tasks: ts }))
  }, [levels, tasks])

  const edges = useMemo(() => {
    const taskMap = new Map(tasks.map((t) => [t.id, t]))
    const result: { from: string; to: string }[] = []
    for (const task of tasks) {
      for (const depId of task.dependencies || []) {
        if (taskMap.has(depId)) {
          result.push({ from: depId, to: task.id })
        }
      }
    }
    return result
  }, [tasks])

  const setNodeRef = useCallback(
    (taskId: string, el: HTMLDivElement | null) => {
      if (el) nodeRefs.current.set(taskId, el)
      else nodeRefs.current.delete(taskId)
    },
    [],
  )

  const recalc = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const cRect = container.getBoundingClientRect()
    setSvgSize({ width: container.scrollWidth, height: container.scrollHeight })

    const result: Line[] = []
    for (const edge of edges) {
      const fromEl = nodeRefs.current.get(edge.from)
      const toEl = nodeRefs.current.get(edge.to)
      if (!fromEl || !toEl) continue
      const f = fromEl.getBoundingClientRect()
      const t = toEl.getBoundingClientRect()
      result.push({
        x1: f.left + f.width / 2 - cRect.left,
        y1: f.bottom - cRect.top + 4,
        x2: t.left + t.width / 2 - cRect.left,
        y2: t.top - cRect.top - 4,
      })
    }
    setLines(result)
  }, [edges])

  useLayoutEffect(() => {
    recalc()
    const container = containerRef.current
    if (!container) return

    const ro = new ResizeObserver(() => recalc())
    ro.observe(container)
    window.addEventListener("resize", recalc)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", recalc)
    }
  }, [recalc])

  const resolveAgent = (agentId: string | null) => {
    if (!agentId || !agents) return null
    return agents.find((a) => a.id === agentId)?.name?.replace(/_/g, " ") ?? null
  }

  if (tasks.length === 0) return null

  return (
    <div className="glass overflow-hidden">
      <div ref={containerRef} className="relative p-8 overflow-x-auto">
        {svgSize.width > 0 && (
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            width={svgSize.width}
            height={svgSize.height}
          >
            <defs>
              <marker
                id="dag-arrow"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="rgba(59, 130, 246, 0.5)" />
              </marker>
              <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0.4)" />
                <stop offset="100%" stopColor="rgba(6, 182, 212, 0.4)" />
              </linearGradient>
            </defs>
            {lines.map((line, i) => (
              <line
                key={i}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="url(#edge-gradient)"
                strokeWidth={1.5}
                markerEnd="url(#dag-arrow)"
              />
            ))}
          </svg>
        )}
        <div className="space-y-12 relative" style={{ zIndex: 2 }}>
          {levelGroups.map((group) => (
            <div key={group.level} className="flex justify-center gap-5 flex-wrap">
              {group.tasks.map((task) => {
                const agentName = resolveAgent(task.assigned_agent_id)
                return (
                  <div
                    key={task.id}
                    ref={(el) => setNodeRef(task.id, el)}
                    onClick={() => onTaskClick?.(task)}
                    className="w-60 glass glass-hover p-4 cursor-pointer group"
                  >
                    <div className="text-[10px] text-gray-600 font-mono truncate mb-1">
                      {task.id.slice(0, 8)}
                    </div>
                    <div className="text-sm font-semibold text-gray-200 truncate mb-1 group-hover:text-white transition-colors">
                      {task.title}
                    </div>
                    {agentName && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        {agentName}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <StatusBadge status={task.status} />
                      {task.retry_count > 0 && (
                        <span className="text-[10px] text-amber-400">
                          ↻ {task.retry_count}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
