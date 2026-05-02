const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined
const BASE = envBase ? `${envBase.replace(/\/+$/, "")}/api` : "/api"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${body}`)
  }
  return res.json()
}

export const api = {
  getHealth: () => request<{ status: string }>("/health"),
  listAgents: () => request<import("./types").Agent[]>("/agents"),
  getAgent: (id: string) => request<import("./types").Agent>(`/agents/${id}`),
  createRun: (goal: string, plannerMode: string = "mock") =>
    request<import("./types").RunDetail>("/runs", {
      method: "POST",
      body: JSON.stringify({ goal, planner_mode: plannerMode }),
    }),
  startRun: (runId: string) =>
    request<import("./types").Run>(`/runs/${runId}/start`, { method: "POST" }),
  listRuns: () => request<import("./types").Run[]>("/runs"),
  getRun: (id: string) => request<import("./types").RunDetail>(`/runs/${id}`),
  getRunTasks: (runId: string) =>
    request<import("./types").Task[]>(`/runs/${runId}/tasks`),
  getTask: (taskId: string) =>
    request<import("./types").Task>(`/tasks/${taskId}`),
  getMatrix: (runId: string) =>
    request<import("./types").MatrixResponse>(`/runs/${runId}/matrix`),
  getRunToolCalls: (runId: string) =>
    request<import("./types").ToolCall[]>(`/runs/${runId}/tool-calls`),
  getRunModelCalls: (runId: string) =>
    request<import("./types").ModelCall[]>(`/runs/${runId}/model-calls`),
  listTools: () =>
    request<import("./types").ToolInfo[]>("/tools"),
  getTool: (toolName: string) =>
    request<import("./types").ToolInfo>(`/tools/${toolName}`),
  retryTask: (taskId: string) =>
    request<import("./types").Task>(`/tasks/${taskId}/retry`, { method: "POST" }),
  getFinalReport: (runId: string) =>
    request<import("./types").FinalReport>(`/runs/${runId}/final-report`),
  getDownloadReportUrl: (runId: string) => `${BASE}/runs/${runId}/download-report`,
  listProviders: () =>
    request<import("./types").ProviderStatus[]>("/providers"),
  testProvider: (providerId: string) =>
    request<import("./types").ProviderTestResult>(`/providers/${providerId}/test`, { method: "POST" }),
  updateAgent: (agentId: string, body: Record<string, unknown>) =>
    request<import("./types").Agent>(`/agents/${agentId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
}
