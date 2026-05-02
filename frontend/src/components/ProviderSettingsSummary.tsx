import { useEffect, useState } from "react"
import { api } from "../api/client"
import type { ProviderStatus } from "../api/types"
import ProviderStatusBadge from "./ProviderStatusBadge"

export default function ProviderSettingsSummary() {
  const [providers, setProviders] = useState<ProviderStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.listProviders().then(setProviders).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="glass p-4 animate-fade-in">
        <span className="text-xs text-gray-500">Loading providers...</span>
      </div>
    )
  }

  return (
    <div className="glass p-4 animate-slide-up">
      <h3 className="section-title mb-3">Provider Status</h3>
      <div className="grid grid-cols-2 gap-2">
        {providers.map((p) => (
          <ProviderStatusBadge key={p.id} provider={p} />
        ))}
      </div>
      {!providers.every((p) => p.configured) && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-amber-500/[0.08] border border-amber-500/20">
          <p className="text-[11px] text-amber-400 leading-relaxed">
            Some providers are not configured on the backend. Set environment variables in Render to enable them.
          </p>
        </div>
      )}
    </div>
  )
}
