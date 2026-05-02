import { useState, useEffect } from "react"
import { api } from "../api/client"
import type { FinalReport as FinalReportType } from "../api/types"

interface Props {
  runId: string
  visible: boolean
}

export default function FinalReport({ runId, visible }: Props) {
  const [report, setReport] = useState<FinalReportType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!visible || !runId) return
    setLoading(true)
    setError("")
    api.getFinalReport(runId)
      .then(setReport)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [runId, visible])

  if (!visible) return null

  if (loading) {
    return (
      <div className="glass p-8 text-center animate-fade-in">
        <div className="inline-flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Generating final report...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass border-red-500/30 bg-red-500/[0.06] p-6 text-center animate-fade-in">
        <svg className="w-8 h-8 mx-auto text-red-400/50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="glass p-12 text-center animate-fade-in">
        <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500 text-sm">No report available yet. The report will appear once all tasks complete.</p>
      </div>
    )
  }

  const downloadUrl = api.getDownloadReportUrl(runId)

  return (
    <div className="glass overflow-hidden animate-slide-up">
      {/* Doc header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-green/20 to-accent-cyan/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Final Report</h3>
            <p className="text-[10px] text-gray-500">{report.final_report.length.toLocaleString()} characters</p>
          </div>
        </div>
        <a
          href={downloadUrl}
          download
          className="btn-primary text-xs flex items-center gap-2 hover:scale-[1.03]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download .md
        </a>
      </div>

      {/* Doc body — document preview style */}
      <div className="p-6 max-h-[600px] overflow-y-auto bg-surface-0/40">
        <div className="max-w-none prose prose-invert prose-sm">
          <pre className="whitespace-pre-wrap text-[13px] text-gray-300 font-sans leading-[1.7] break-words">
            {report.final_report}
          </pre>
        </div>
      </div>
    </div>
  )
}
