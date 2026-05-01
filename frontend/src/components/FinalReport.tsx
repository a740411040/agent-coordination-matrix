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
          <span className="text-sm">Loading report...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass border-red-500/30 bg-red-500/[0.06] p-6 text-center animate-fade-in">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  if (!report) return null

  const downloadUrl = api.getDownloadReportUrl(runId)

  return (
    <div className="glass overflow-hidden animate-slide-up">
      {/* Doc header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-accent-green/15 flex items-center justify-center">
            <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Final Report</h3>
            <p className="text-[10px] text-gray-500">{report.final_report.length} characters</p>
          </div>
        </div>
        <a
          href={downloadUrl}
          download
          className="btn-primary text-xs flex items-center gap-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download Markdown
        </a>
      </div>

      {/* Doc body */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        <div className="prose prose-invert prose-sm max-w-none">
          <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans leading-relaxed break-words">
            {report.final_report}
          </pre>
        </div>
      </div>
    </div>
  )
}
