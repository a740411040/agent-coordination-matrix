import type { MatrixCell as MatrixCellType } from "../api/types"
import StatusBadge from "./StatusBadge"

interface Props {
  cell: MatrixCellType | null
  onClick: () => void
  selected?: boolean
}

export default function MatrixCellView({ cell, onClick, selected }: Props) {
  if (!cell) {
    return (
      <td className="px-1.5 py-1.5">
        <div className="w-full h-10 rounded-lg bg-white/[0.02] border border-dashed border-white/[0.04] flex items-center justify-center">
          <span className="text-[10px] text-gray-600">—</span>
        </div>
      </td>
    )
  }

  return (
    <td className="px-1.5 py-1.5">
      <button
        onClick={onClick}
        title={cell.summary || cell.status}
        className={`w-full h-10 rounded-lg flex items-center justify-center
          transition-all duration-200 cursor-pointer
          hover:scale-105 hover:shadow-lg hover:shadow-black/30
          focus:outline-none focus:ring-2 focus:ring-accent-blue/40
          ${selected
            ? "ring-2 ring-accent-blue/60 bg-white/[0.08]"
            : ""
          }`}
      >
        <StatusBadge status={cell.status} />
      </button>
    </td>
  )
}
