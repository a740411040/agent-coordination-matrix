from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel


# ── Run ──

class RunCreate(BaseModel):
    goal: str
    planner_mode: str = "mock"


class RunRead(BaseModel):
    id: str
    goal: str
    status: str
    plan: Optional[dict] = None
    final_output: Optional[str] = None
    final_report: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RunDetail(RunRead):
    tasks: List["TaskRead"] = []


# ── Task ──

class TaskRead(BaseModel):
    id: str
    run_id: str
    title: str
    description: Optional[str] = None
    assigned_agent_id: Optional[str] = None
    status: str
    dependencies: Optional[List[str]] = None
    expected_output: Optional[str] = None
    result: Optional[str] = None
    logs: Optional[List[dict]] = None
    error: Optional[str] = None
    retry_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskRetry(BaseModel):
    pass


class FinalReportRead(BaseModel):
    run_id: str
    goal: str
    status: str
    final_report: str

    model_config = {"from_attributes": True}


# ── Agent ──

class AgentRead(BaseModel):
    id: str
    name: str
    role: str
    agent_type: str
    model_provider: str
    model_name: str
    temperature: float
    tools: Optional[List[str]] = None
    output_schema: Optional[dict] = None
    enabled: int

    model_config = {"from_attributes": True}


class AgentUpdate(BaseModel):
    model_provider: Optional[str] = None
    model_name: Optional[str] = None
    temperature: Optional[float] = None
    tools: Optional[List[str]] = None
    enabled: Optional[int] = None


# ── MatrixCell ──

class MatrixCellRead(BaseModel):
    id: str
    run_id: str
    task_id: str
    agent_id: str
    status: str
    summary: Optional[str] = None
    logs: Optional[List[dict]] = None
    result: Optional[str] = None
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── ToolCall ──

class ToolCallRead(BaseModel):
    id: str
    run_id: str
    task_id: str
    agent_id: str
    tool_name: str
    input: Optional[dict] = None
    output: Optional[dict] = None
    status: str
    error: Optional[str] = None
    latency_ms: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── ModelCall ──

class ModelCallRead(BaseModel):
    id: str
    run_id: str
    task_id: str
    agent_id: str
    provider: str
    model: str
    input_summary: Optional[str] = None
    output: Optional[str] = None
    input_tokens: int
    output_tokens: int
    status: str
    error: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Matrix response ──

class MatrixResponse(BaseModel):
    run_id: str
    agents: List[AgentRead]
    tasks: List[TaskRead]
    cells: List[MatrixCellRead]
