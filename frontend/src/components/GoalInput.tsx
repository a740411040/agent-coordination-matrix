import { useState } from "react"

interface Props {
  onSubmit: (goal: string, plannerMode: string) => void
  loading: boolean
}

export default function GoalInput({ onSubmit, loading }: Props) {
  const [goal, setGoal] = useState("")
  const [plannerMode, setPlannerMode] = useState("mock")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!goal.trim()) return
    onSubmit(goal.trim(), plannerMode)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="输入你的目标，例如：分析 2025 年 AI 行业趋势并生成报告"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !goal.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "创建中..." : "创建 Run"}
        </button>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">Planner 模式：</span>
        <button
          type="button"
          onClick={() => setPlannerMode("mock")}
          className={`px-3 py-1 rounded ${plannerMode === "mock" ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          disabled={loading}
        >
          Mock
        </button>
        <button
          type="button"
          onClick={() => setPlannerMode("real")}
          className={`px-3 py-1 rounded ${plannerMode === "real" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          disabled={loading}
        >
          Real (LLM)
        </button>
      </div>
    </form>
  )
}
