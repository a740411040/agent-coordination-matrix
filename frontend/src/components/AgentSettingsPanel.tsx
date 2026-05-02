import { useState, useEffect, useCallback } from "react"
import { api } from "../api/client"
import type { Agent, ProviderStatus } from "../api/types"
import ProviderStatusBadge from "./ProviderStatusBadge"

const AVAILABLE_TOOLS = [
  "file.read",
  "file.write",
  "markdown.write",
  "python.run",
  "http.request",
  "mock_api.call",
]

const AGENT_TYPES = ["mock", "rule", "llm"]

interface Props {
  open: boolean
  onClose: () => void
}

function AgentRow({
  agent,
  providers,
  onUpdated,
}: {
  agent: Agent
  providers: ProviderStatus[]
  onUpdated: (a: Agent) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    agent_type: agent.agent_type,
    model_provider: agent.model_provider,
    model_name: agent.model_name,
    temperature: agent.temperature,
    enabled: agent.enabled,
    tools: agent.tools ?? [],
  })

  useEffect(() => {
    setForm({
      agent_type: agent.agent_type,
      model_provider: agent.model_provider,
      model_name: agent.model_name,
      temperature: agent.temperature,
      enabled: agent.enabled,
      tools: agent.tools ?? [],
    })
  }, [agent])

  const handleSave = async () => {
    setSaving(true)
    setError("")
    setSaved(false)
    try {
      const updated = await api.updateAgent(agent.id, {
        agent_type: form.agent_type,
        model_provider: form.model_provider,
        model_name: form.model_name,
        temperature: form.temperature,
        enabled: form.enabled,
        tools: form.tools,
      })
      onUpdated(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const toggleTool = (tool: string) => {
    setForm((prev) => ({
      ...prev,
      tools: prev.tools.includes(tool)
        ? prev.tools.filter((t) => t !== tool)
        : [...prev.tools, tool],
    }))
  }

  const currentProvider = providers.find((p) => p.id === form.model_provider)
  const providerNotConfigured = currentProvider && !currentProvider.configured

  return (
    <div className={`rounded-xl border transition-all duration-200 ${
      expanded
        ? "bg-white/[0.06] border-accent-blue/30"
        : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1]"
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${agent.enabled ? "bg-green-400" : "bg-gray-500"}`} />
          <div className="min-w-0">
            <span className="text-sm font-semibold text-white block truncate">{agent.name}</span>
            <span className="text-[11px] text-gray-500 block truncate">{agent.role}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="tag text-[10px]">{form.model_provider}</span>
          <span className="tag text-[10px]">{form.agent_type}</span>
          <svg className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04] pt-3">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              {error}
            </div>
          )}
          {saved && (
            <div className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400">
              Updated
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">Agent Type</label>
              <select
                value={form.agent_type}
                onChange={(e) => setForm({ ...form, agent_type: e.target.value })}
                className="input-field text-xs py-1.5"
              >
                {AGENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">Provider</label>
              <select
                value={form.model_provider}
                onChange={(e) => setForm({ ...form, model_provider: e.target.value })}
                className="input-field text-xs py-1.5"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{!p.configured ? " (not configured)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {providerNotConfigured && (
            <div className="px-3 py-2 rounded-lg bg-amber-500/[0.08] border border-amber-500/20">
              <p className="text-[11px] text-amber-400">
                This provider is not configured on backend. Please set environment variables in Render.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">Model Name</label>
              <input
                type="text"
                value={form.model_name}
                onChange={(e) => setForm({ ...form, model_name: e.target.value })}
                className="input-field text-xs py-1.5"
                placeholder="default"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">
                Temperature ({form.temperature.toFixed(1)})
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={form.temperature}
                onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                className="w-full mt-1.5 accent-accent-blue"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 block">Enabled</label>
            <button
              onClick={() => setForm({ ...form, enabled: form.enabled ? 0 : 1 })}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                form.enabled
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-gray-600/20 text-gray-400 border-gray-600/30"
              }`}
            >
              {form.enabled ? "Enabled" : "Disabled"}
            </button>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 block">Tools</label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TOOLS.map((tool) => (
                <button
                  key={tool}
                  onClick={() => toggleTool(tool)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all border ${
                    form.tools.includes(tool)
                      ? "bg-accent-blue/20 text-accent-blue border-accent-blue/30"
                      : "bg-white/[0.04] text-gray-500 border-white/[0.06] hover:border-white/[0.12]"
                  }`}
                >
                  {tool}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary text-xs py-1.5 px-4 w-full">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  )
}

export default function AgentSettingsPanel({ open, onClose }: Props) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [providers, setProviders] = useState<ProviderStatus[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [a, p] = await Promise.all([api.listAgents(), api.listProviders()])
      setAgents(a)
      setProviders(p)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, loadData])

  const handleAgentUpdated = (updated: Agent) => {
    setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
  }

  if (!open) return null

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="panel-slide">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Model &amp; Agent Settings
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5">Model settings take effect on the next run.</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Provider Status */}
          <section>
            <h3 className="section-title flex items-center gap-2 mb-3">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Providers
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {providers.map((p) => (
                <ProviderStatusBadge key={p.id} provider={p} />
              ))}
            </div>
          </section>

          {/* Agent Cards */}
          <section>
            <h3 className="section-title flex items-center gap-2 mb-3">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Agents
            </h3>
            {loading ? (
              <div className="text-center py-8">
                <svg className="animate-spin h-5 w-5 mx-auto text-gray-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : (
              <div className="space-y-2">
                {agents.map((agent) => (
                  <AgentRow
                    key={agent.id}
                    agent={agent}
                    providers={providers}
                    onUpdated={handleAgentUpdated}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Security Notice */}
          <div className="px-3 py-2.5 rounded-lg bg-accent-blue/[0.06] border border-accent-blue/20">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              API keys are stored as backend environment variables only.
              The frontend can switch providers and models but never has access to any secret keys.
              All model calls go through the backend ModelRouter.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
