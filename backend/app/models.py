import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class RunStatus(str, enum.Enum):
    pending = "pending"
    planning = "planning"
    executing = "executing"
    synthesizing = "synthesizing"
    completed = "completed"
    failed = "failed"


class TaskStatus(str, enum.Enum):
    pending = "pending"
    ready = "ready"
    running = "running"
    verifying = "verifying"
    completed = "completed"
    success = "success"
    failed = "failed"
    blocked = "blocked"
    retry = "retry"
    needs_review = "needs_review"


class AgentType(str, enum.Enum):
    mock = "mock"
    rule = "rule"
    llm = "llm"


class CallStatus(str, enum.Enum):
    success = "success"
    error = "error"


class Run(Base):
    __tablename__ = "runs"

    id = Column(String(36), primary_key=True, default=_uuid)
    goal = Column(Text, nullable=False)
    status = Column(Enum(RunStatus), nullable=False, default=RunStatus.pending)
    plan = Column(JSON, nullable=True)
    final_output = Column(Text, nullable=True)
    final_report = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    tasks = relationship("Task", back_populates="run", lazy="selectin")
    matrix_cells = relationship("MatrixCell", back_populates="run", lazy="selectin")
    tool_calls = relationship("ToolCall", back_populates="run", lazy="selectin")
    model_calls = relationship("ModelCall", back_populates="run", lazy="selectin")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=_uuid)
    run_id = Column(String(36), ForeignKey("runs.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True, default="")
    assigned_agent_id = Column(String(36), ForeignKey("agents.id"), nullable=True, index=True)
    status = Column(Enum(TaskStatus), nullable=False, default=TaskStatus.pending)
    dependencies = Column(JSON, nullable=True, default=list)
    expected_output = Column(Text, nullable=True)
    result = Column(Text, nullable=True)
    logs = Column(JSON, nullable=True, default=list)
    error = Column(Text, nullable=True)
    retry_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    run = relationship("Run", back_populates="tasks")
    agent = relationship("Agent", back_populates="tasks")
    matrix_cells = relationship("MatrixCell", back_populates="task", lazy="selectin")
    tool_calls = relationship("ToolCall", back_populates="task", lazy="selectin")
    model_calls = relationship("ModelCall", back_populates="task", lazy="selectin")


class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(100), nullable=False, unique=True)
    role = Column(String(255), nullable=False)
    agent_type = Column(Enum(AgentType), nullable=False, default=AgentType.mock)
    model_provider = Column(String(50), nullable=False, default="mock")
    model_name = Column(String(100), nullable=False, default="default")
    temperature = Column(Float, nullable=False, default=0.7)
    tools = Column(JSON, nullable=True, default=list)
    output_schema = Column(JSON, nullable=True)
    enabled = Column(Integer, nullable=False, default=1)

    tasks = relationship("Task", back_populates="agent", lazy="selectin")
    matrix_cells = relationship("MatrixCell", back_populates="agent", lazy="selectin")


class MatrixCell(Base):
    __tablename__ = "matrix_cells"

    id = Column(String(36), primary_key=True, default=_uuid)
    run_id = Column(String(36), ForeignKey("runs.id"), nullable=False, index=True)
    task_id = Column(String(36), ForeignKey("tasks.id"), nullable=False, index=True)
    agent_id = Column(String(36), ForeignKey("agents.id"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="pending")
    summary = Column(Text, nullable=True)
    logs = Column(JSON, nullable=True, default=list)
    result = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    run = relationship("Run", back_populates="matrix_cells")
    task = relationship("Task", back_populates="matrix_cells")
    agent = relationship("Agent", back_populates="matrix_cells")


class ToolCall(Base):
    __tablename__ = "tool_calls"

    id = Column(String(36), primary_key=True, default=_uuid)
    run_id = Column(String(36), ForeignKey("runs.id"), nullable=False, index=True)
    task_id = Column(String(36), ForeignKey("tasks.id"), nullable=False, index=True)
    agent_id = Column(String(36), ForeignKey("agents.id"), nullable=False, index=True)
    tool_name = Column(String(100), nullable=False)
    input = Column(JSON, nullable=True)
    output = Column(JSON, nullable=True)
    status = Column(Enum(CallStatus), nullable=False, default=CallStatus.success)
    error = Column(Text, nullable=True)
    latency_ms = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=_utcnow)

    run = relationship("Run", back_populates="tool_calls")
    task = relationship("Task", back_populates="tool_calls")
    agent = relationship("Agent")


class ModelCall(Base):
    __tablename__ = "model_calls"

    id = Column(String(36), primary_key=True, default=_uuid)
    run_id = Column(String(36), ForeignKey("runs.id"), nullable=False, index=True)
    task_id = Column(String(36), ForeignKey("tasks.id"), nullable=False, index=True)
    agent_id = Column(String(36), ForeignKey("agents.id"), nullable=False, index=True)
    provider = Column(String(50), nullable=False)
    model = Column(String(100), nullable=False)
    input_summary = Column(Text, nullable=True)
    output = Column(Text, nullable=True)
    input_tokens = Column(Integer, nullable=False, default=0)
    output_tokens = Column(Integer, nullable=False, default=0)
    status = Column(Enum(CallStatus), nullable=False, default=CallStatus.success)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utcnow)

    run = relationship("Run", back_populates="model_calls")
    task = relationship("Task", back_populates="model_calls")
    agent = relationship("Agent")
