import type { MatrixCell as MatrixCellType } from "../api/types"

const CELL_BG: Record<string, string> = {
  pending: "bg-gray-200",
  ready: "bg-sky-200",
  running: "bg-blue-300",
  verifying: "bg-orange-300",
  completed: "bg-green-300",
  success: "bg-green-300",
  failed: "bg-red-300",
  blocked: "bg-purple-300",
  needs_review: "bg-yellow-300",
  retry: "bg-pink-300",
  retrying: "bg-pink-300",
}

const CELL_LABEL: Record<string, string> = {
  pending: "·",
  ready: "rdy",
  running: "...",
  verifying: "chk",
  completed: "ok",
  success: "ok",
  failed: "✗",
  blocked: "blk",
  needs_review: "?",
  retry: "↻",
  retrying: "↻",
}

interface Props {
  cell: MatrixCellType | null
  onClick: () => void
}

export default function MatrixCellView({ cell, onClick }: Props) {
  if (!cell) {
    return (
      <td className="border px-2 py-2 text-center text-xs text-gray-300 bg-gray-50">
        —
      </td>
    )
  }

  const bg = CELL_BG[cell.status] || "bg-gray-100"
  const label = CELL_LABEL[cell.status] || cell.status.slice(0, 3)

  return (
    <td
      className={`border px-2 py-2 text-center text-xs font-medium cursor-pointer hover:opacity-80 ${bg}`}
      title={cell.summary || cell.status}
      onClick={onClick}
    >
      {label}
    </td>
  )
}
