import type { ToolCall } from "../api/types"

interface Props {
  toolCalls: ToolCall[]
}

const STATUS_BADGE: Record<string, string> = {
  success: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
}

export default function ToolCallList({ toolCalls }: Props) {
  if (toolCalls.length === 0) return null

  return (
    <div className="space-y-1.5">
      {toolCalls.map((tc) => (
        <div key={tc.id} className="bg-gray-50 border rounded px-3 py-2 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-medium text-gray-700">{tc.tool_name}</span>
            <span className={`px-1.5 py-0.5 rounded ${STATUS_BADGE[tc.status] || "bg-gray-100 text-gray-600"}`}>
              {tc.status}
            </span>
            <span className="text-gray-400 ml-auto">{tc.latency_ms}ms</span>
          </div>
          {tc.input && (
            <div className="text-gray-500 truncate" title={JSON.stringify(tc.input)}>
              输入: {JSON.stringify(tc.input).slice(0, 100)}
            </div>
          )}
          {tc.output && (
            <div className="text-gray-600 truncate" title={JSON.stringify(tc.output)}>
              输出: {JSON.stringify(tc.output).slice(0, 100)}
            </div>
          )}
          {tc.error && (
            <div className="text-red-600">错误: {tc.error}</div>
          )}
        </div>
      ))}
    </div>
  )
}
