import type { MatrixCell as MatrixCellType } from "../api/types"
import StatusBadge from "./StatusBadge"

interface Props {
  cell: MatrixCellType | null
  onClick: () => void
  selected?: boolean
}

const RUNNING_STATUSES = new Set(["running", "executing", "verifying", "retrying"])

export default function MatrixCellView({ cell, onClick, selected }: Props) {
  if (!cell) {
    return (
      <td className="px-1.5 py-1.5">
        <div className="w-full h-11 rounded-lg bg-white/[0.02] border border-dashed border-white/[0.04] flex items-center justify-center">
          <span className="text-[10px] text-gray-600">—</span>
        </div>
      </td>
    )
  }

  const isRunning = RUNNING_STATUSES.has(cell.status)
  const isFailed = cell.status === "failed" || cell.status === "needs_review"

  return (
    <td className="px-1.5 py-1.5">
      <button
        onClick={onClick}
        title={cell.summary || cell.status}
        className={`w-full h-11 rounded-lg flex flex-col items-center justify-center gap-0.5
          transition-all duration-200 cursor-pointer
          hover:scale-[1.08] hover:shadow-lg hover:shadow-black/30 hover:z-10 hover:relative
          focus:outline-none focus:ring-2 focus:ring-accent-blue/40
          ${selected ? "ring-2 ring-accent-blue/60 bg-white/[0.1] scale-[1.05] z-10 relative shadow-lg shadow-accent-blue/10" : ""}
          ${isRunning ? "running-cell" : ""}
          ${isFailed ? "animate-running-pulse" : ""}`}
      >
        <StatusBadge status={cell.status} />
        {cell.summary && (
          <span className="text-[9px] text-gray-500 max-w-[64px] truncate leading-none">{cell.summary.slice(0, 20)}</span>
        )}
      </button>
    </td>
  )
}
