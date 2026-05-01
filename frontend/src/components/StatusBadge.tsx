const TASK_STYLES: Record<string, { bg: string; text: string; glow: string; label: string }> = {
  pending:      { bg: "bg-white/[0.06]",      text: "text-gray-400",    glow: "",                 label: "pending" },
  ready:        { bg: "bg-sky-500/15",         text: "text-sky-400",     glow: "shadow-[0_0_8px_rgba(56,189,248,0.2)]", label: "ready" },
  running:      { bg: "bg-blue-500/20",        text: "text-blue-400",    glow: "shadow-[0_0_12px_rgba(59,130,246,0.3)]", label: "running" },
  completed:    { bg: "bg-emerald-500/15",     text: "text-emerald-400", glow: "shadow-[0_0_8px_rgba(16,185,129,0.2)]", label: "completed" },
  success:      { bg: "bg-emerald-500/15",     text: "text-emerald-400", glow: "shadow-[0_0_8px_rgba(16,185,129,0.2)]", label: "success" },
  verifying:    { bg: "bg-amber-500/15",       text: "text-amber-400",   glow: "shadow-[0_0_8px_rgba(245,158,11,0.2)]", label: "verifying" },
  failed:       { bg: "bg-red-500/15",         text: "text-red-400",     glow: "shadow-[0_0_8px_rgba(239,68,68,0.2)]", label: "failed" },
  blocked:      { bg: "bg-purple-500/15",      text: "text-purple-400",  glow: "shadow-[0_0_8px_rgba(139,92,246,0.2)]", label: "blocked" },
  needs_review: { bg: "bg-yellow-500/15",      text: "text-yellow-400",  glow: "shadow-[0_0_8px_rgba(234,179,8,0.2)]", label: "needs review" },
  retry:        { bg: "bg-pink-500/15",        text: "text-pink-400",    glow: "",                 label: "retry" },
  retrying:     { bg: "bg-pink-500/15",        text: "text-pink-400",    glow: "",                 label: "retrying" },
}

const RUN_STYLES: Record<string, { bg: string; text: string; glow: string; label: string }> = {
  pending:      { bg: "bg-white/[0.06]",       text: "text-gray-400",    glow: "",                 label: "pending" },
  planning:     { bg: "bg-amber-500/15",        text: "text-amber-400",   glow: "",                 label: "planning" },
  executing:    { bg: "bg-blue-500/20",         text: "text-blue-400",    glow: "shadow-[0_0_12px_rgba(59,130,246,0.3)]", label: "executing" },
  synthesizing: { bg: "bg-purple-500/15",       text: "text-purple-400",  glow: "shadow-[0_0_12px_rgba(139,92,246,0.3)]", label: "synthesizing" },
  completed:    { bg: "bg-emerald-500/15",      text: "text-emerald-400", glow: "shadow-[0_0_12px_rgba(16,185,129,0.3)]", label: "completed" },
  failed:       { bg: "bg-red-500/15",          text: "text-red-400",     glow: "shadow-[0_0_12px_rgba(239,68,68,0.3)]", label: "failed" },
}

const SPINNER_STATES = new Set(["running", "executing", "planning", "synthesizing", "verifying"])

export default function StatusBadge({ status, variant = "task" }: { status: string; variant?: "task" | "run" }) {
  const map = variant === "run" ? RUN_STYLES : TASK_STYLES
  const s = map[status] || TASK_STYLES.pending
  const showSpinner = SPINNER_STATES.has(status)

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap
        ${s.bg} ${s.text} ${s.glow} backdrop-blur-sm transition-all duration-300`}
    >
      {showSpinner && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${s.text.replace("text-", "bg-")}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${s.text.replace("text-", "bg-")}`} />
        </span>
      )}
      {s.label}
    </span>
  )
}
