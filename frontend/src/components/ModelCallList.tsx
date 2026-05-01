import type { ModelCall } from "../api/types"

interface Props {
  modelCalls: ModelCall[]
}

export default function ModelCallList({ modelCalls }: Props) {
  if (modelCalls.length === 0) return null

  return (
    <div className="space-y-2">
      {modelCalls.map((mc) => (
        <div key={mc.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-md bg-accent-purple/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <span className="font-mono font-semibold text-gray-200">{mc.provider}</span>
            <span className="text-gray-500">/</span>
            <span className="font-mono text-gray-400">{mc.model}</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium
              ${mc.status === "success" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
              {mc.status}
            </span>
            <span className="text-gray-600 ml-auto font-mono">
              {(mc.input_tokens + mc.output_tokens).toLocaleString()} tokens
            </span>
          </div>
          <div className="flex gap-4 text-[10px] text-gray-600 mb-2">
            <span>in: {mc.input_tokens.toLocaleString()}</span>
            <span>out: {mc.output_tokens.toLocaleString()}</span>
          </div>
          {mc.input_summary && (
            <div className="mb-1.5">
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">Input</span>
              <p className="text-gray-400 mt-1 line-clamp-3">{mc.input_summary}</p>
            </div>
          )}
          {mc.output && (
            <div className="mb-1.5">
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">Output</span>
              <pre className="code-block mt-1 text-[11px] max-h-24 overflow-auto">{mc.output}</pre>
            </div>
          )}
          {mc.error && (
            <div className="text-red-400 text-[11px] bg-red-500/[0.06] border border-red-500/10 p-2 rounded-lg mt-1">{mc.error}</div>
          )}
        </div>
      ))}
    </div>
  )
}
