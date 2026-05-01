import type { ModelCall } from "../api/types"

interface Props {
  modelCalls: ModelCall[]
}

const STATUS_BADGE: Record<string, string> = {
  success: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
}

export default function ModelCallList({ modelCalls }: Props) {
  if (modelCalls.length === 0) return null

  return (
    <div className="space-y-1.5">
      {modelCalls.map((mc) => (
        <div key={mc.id} className="bg-gray-50 border rounded px-3 py-2 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-medium text-gray-700">{mc.provider}</span>
            <span className="text-gray-500">/ {mc.model}</span>
            <span className={`px-1.5 py-0.5 rounded ${STATUS_BADGE[mc.status] || "bg-gray-100 text-gray-600"}`}>
              {mc.status}
            </span>
            <span className="text-gray-400 ml-auto">
              {mc.input_tokens + mc.output_tokens} tokens
            </span>
          </div>
          {mc.input_summary && (
            <div className="text-gray-500 truncate" title={mc.input_summary}>
              输入: {mc.input_summary.slice(0, 100)}
            </div>
          )}
          {mc.output && (
            <div className="text-gray-600 truncate" title={mc.output}>
              输出: {mc.output.slice(0, 100)}
            </div>
          )}
          {mc.error && (
            <div className="text-red-600">错误: {mc.error}</div>
          )}
        </div>
      ))}
    </div>
  )
}
