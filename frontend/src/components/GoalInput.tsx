import { useState } from "react"

interface Props {
  onSubmit: (goal: string, plannerMode: string) => void
  loading: boolean
  hasRun: boolean
}

const EXAMPLE_GOALS = [
  "Analyze a CSV sales dataset and generate an executive report.",
  "Build and review a Python data-cleaning workflow.",
  "Coordinate a multi-agent research analysis pipeline.",
]

const DEMO_STEPS = [
  { step: "1", title: "Enter a goal", desc: "Describe your objective in natural language" },
  { step: "2", title: "Planner creates a task DAG", desc: "AI decomposes the goal into sub-tasks with dependencies" },
  { step: "3", title: "Agents execute tasks", desc: "Specialized agents work through the task graph" },
  { step: "4", title: "Inspect ToolCall & ModelCall logs", desc: "Click matrix cells to view detailed execution traces" },
  { step: "5", title: "Download the final report", desc: "Get a structured Markdown report of all findings" },
]

const HIGHLIGHTS = [
  {
    title: "Multi-Agent Coordination",
    desc: "Planner, Data, Code, Critic, and Writer agents collaborate through a dependency graph.",
    color: "from-accent-blue to-accent-cyan",
    border: "border-accent-blue/20",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    title: "Multi-Model Routing",
    desc: "Route tasks to different LLMs — mock, rule-based, MiMo, or any OpenAI-compatible API.",
    color: "from-accent-purple to-accent-pink",
    border: "border-accent-purple/20",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Tool Gateway",
    desc: "File I/O, Python execution, HTTP requests, and mock API calls — all through a unified gateway.",
    color: "from-accent-green to-accent-cyan",
    border: "border-accent-green/20",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Visual Audit Trail",
    desc: "Agent×Task matrix, DAG dependency graph, and full ToolCall/ModelCall execution logs.",
    color: "from-accent-amber to-accent-red",
    border: "border-accent-amber/20",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
]

export default function GoalInput({ onSubmit, loading, hasRun }: Props) {
  const [goal, setGoal] = useState("")
  const [plannerMode, setPlannerMode] = useState("mock")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!goal.trim()) return
    onSubmit(goal.trim(), plannerMode)
  }

  const handleExampleClick = (example: string) => {
    setGoal(example)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <form onSubmit={handleSubmit} className="glass p-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Describe your goal — e.g. Analyze 2025 AI industry trends and generate a report"
            className="input-field"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !goal.trim()} className="btn-primary whitespace-nowrap">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </span>
            ) : "Create Run"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Planner</span>
          {(["mock", "real"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setPlannerMode(mode)}
              disabled={loading}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                ${plannerMode === mode
                  ? "bg-accent-blue/20 text-accent-blue border border-accent-blue/30"
                  : "bg-white/[0.04] text-gray-500 border border-white/[0.06] hover:bg-white/[0.08] hover:text-gray-300"
                }`}
            >
              {mode === "mock" ? "Mock" : "Real (LLM)"}
            </button>
          ))}
        </div>

        {!hasRun && (
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs text-gray-500 uppercase tracking-wider self-center mr-1">Try</span>
            {EXAMPLE_GOALS.map((eg) => (
              <button
                key={eg}
                type="button"
                onClick={() => handleExampleClick(eg)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-400 bg-white/[0.03] border border-white/[0.06]
                  hover:bg-accent-blue/10 hover:text-accent-blue hover:border-accent-blue/20
                  transition-all duration-200 text-left"
              >
                {eg}
              </button>
            ))}
          </div>
        )}
      </form>

      {!hasRun && (
        <>
          <div className="glass p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Demo Tips</span>
            </div>
            <div className="space-y-3">
              {DEMO_STEPS.map((s) => (
                <div key={s.step} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-blue/15 text-accent-blue text-xs font-bold flex items-center justify-center mt-0.5">
                    {s.step}
                  </span>
                  <div>
                    <span className="text-sm font-medium text-gray-200">{s.title}</span>
                    <span className="text-sm text-gray-500 ml-2">{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className={`glass p-5 group hover:scale-[1.02] transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.06] ${h.border}`}>
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${h.color} text-white/90 mb-3 transition-transform group-hover:scale-110`}>
                  {h.icon}
                </div>
                <h4 className="text-sm font-semibold text-gray-200 mb-1">{h.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
