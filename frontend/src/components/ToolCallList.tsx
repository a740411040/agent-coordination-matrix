import type { ToolCall } from "../api/types"

interface Props {
  toolCalls: ToolCall[]
}

export default function ToolCallList({ toolCalls }: Props) {
  if (toolCalls.length === 0) return null

  return (
    <div className="space-y-2">
      {toolCalls.map((tc) => (
        <div key={tc.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-md bg-accent-green/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <span className="font-mono font-semibold text-gray-200">{tc.tool_name}</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium
              ${tc.status === "success" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
              {tc.status}
            </span>
            <span className="text-gray-600 ml-auto font-mono">{tc.latency_ms}ms</span>
          </div>
          {tc.input && (
            <div className="mb-1.5">
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">Input</span>
              <pre className="code-block mt-1 text-[11px] max-h-24 overflow-auto">{JSON.stringify(tc.input, null, 2)}</pre>
            </div>
          )}
          {tc.output && (
            <div className="mb-1.5">
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">Output</span>
              <pre className="code-block mt-1 text-[11px] max-h-24 overflow-auto">{JSON.stringify(tc.output, null, 2)}</pre>
            </div>
          )}
          {tc.error && (
            <div className="text-red-400 text-[11px] bg-red-500/[0.06] border border-red-500/10 p-2 rounded-lg mt-1">{tc.error}</div>
          )}
        </div>
      ))}
    </div>
  )
}
