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
      <div className="p-4 bg-white border rounded-lg">
        <div className="text-sm text-gray-500">加载报告中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-white border rounded-lg">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    )
  }

  if (!report) return null

  const downloadUrl = api.getDownloadReportUrl(runId)

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <h3 className="font-semibold text-sm">最终报告</h3>
        <a
          href={downloadUrl}
          download
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          ⬇ 下载 Markdown
        </a>
      </div>
      <div className="p-4 max-h-[500px] overflow-y-auto">
        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
          {report.final_report}
        </pre>
      </div>
    </div>
  )
}
