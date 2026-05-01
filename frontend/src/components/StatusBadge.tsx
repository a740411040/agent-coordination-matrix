const TASK_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  ready: "bg-sky-100 text-sky-700",
  running: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  success: "bg-green-100 text-green-700",
  verifying: "bg-orange-100 text-orange-700",
  failed: "bg-red-100 text-red-700",
  blocked: "bg-purple-100 text-purple-700",
  needs_review: "bg-yellow-100 text-yellow-700",
  retry: "bg-pink-100 text-pink-700",
  retrying: "bg-pink-100 text-pink-700",
}

const RUN_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  planning: "bg-yellow-100 text-yellow-700",
  executing: "bg-blue-100 text-blue-700",
  synthesizing: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
}

const LABELS: Record<string, string> = {
  synthesizing: "报告生成中",
}

export default function StatusBadge({ status, variant = "task" }: { status: string; variant?: "task" | "run" }) {
  const colors = variant === "run" ? RUN_COLORS : TASK_COLORS
  const label = LABELS[status] || status
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {label}
    </span>
  )
}
