export interface Agent {
  id: string
  name: string
  role: string
  agent_type: string
  model_provider: string
  model_name: string
  temperature: number
  tools: string[] | null
  output_schema: Record<string, unknown> | null
  enabled: number
}

export interface Task {
  id: string
  run_id: string
  title: string
  description: string | null
  assigned_agent_id: string | null
  status: string
  dependencies: string[] | null
  expected_output: string | null
  result: string | null
  logs: Record<string, unknown>[] | null
  error: string | null
  retry_count: number
  created_at: string
  updated_at: string
}

export interface Run {
  id: string
  goal: string
  status: string
  plan: Record<string, unknown> | null
  final_output: string | null
  final_report: string | null
  created_at: string
  updated_at: string
}

export interface RunDetail extends Run {
  tasks: Task[]
}

export interface MatrixCell {
  id: string
  run_id: string
  task_id: string
  agent_id: string
  status: string
  summary: string | null
  logs: Record<string, unknown>[] | null
  result: string | null
  updated_at: string
}

export interface MatrixResponse {
  run_id: string
  agents: Agent[]
  tasks: Task[]
  cells: MatrixCell[]
}

export interface ToolCall {
  id: string
  run_id: string
  task_id: string
  agent_id: string
  tool_name: string
  input: Record<string, unknown> | null
  output: Record<string, unknown> | null
  status: string
  error: string | null
  latency_ms: number
  created_at: string
}

export interface ToolInfo {
  name: string
  description: string
  input_schema: Record<string, string>
}

export interface FinalReport {
  run_id: string
  goal: string
  status: string
  final_report: string
}

export interface ModelCall {
  id: string
  run_id: string
  task_id: string
  agent_id: string
  provider: string
  model: string
  input_summary: string | null
  output: string | null
  input_tokens: number
  output_tokens: number
  status: string
  error: string | null
  created_at: string
}

export interface TaskRetryResponse {
  id: string
  status: string
  retry_count: number
}

export interface ProviderStatus {
  id: string
  name: string
  configured: boolean
  requires_api_key: boolean
  description: string
}

export interface ProviderTestResult {
  provider: string
  configured: boolean
  message: string
}
