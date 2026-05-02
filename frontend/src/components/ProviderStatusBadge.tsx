import type { ProviderStatus } from "../api/types"

export default function ProviderStatusBadge({ provider }: { provider: ProviderStatus }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full ${
          provider.configured ? "bg-green-400 animate-glow-pulse" : "bg-gray-500"
        }`}
      />
      <span className="text-xs font-medium text-white">{provider.name}</span>
      {provider.requires_api_key && !provider.configured && (
        <span className="tag text-[10px] text-amber-400/80 border-amber-400/20 bg-amber-400/10">
          Missing API Key
        </span>
      )}
      {!provider.requires_api_key && (
        <span className="tag text-[10px] text-green-400/80 border-green-400/20 bg-green-400/10">
          Available
        </span>
      )}
      {provider.requires_api_key && provider.configured && (
        <span className="tag text-[10px] text-green-400/80 border-green-400/20 bg-green-400/10">
          Configured
        </span>
      )}
    </div>
  )
}
