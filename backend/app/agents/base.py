from dataclasses import dataclass, field
from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


@dataclass
class AgentResult:
    status: str = "success"
    summary: str = ""
    output: str = ""
    result: dict = field(default_factory=dict)
    logs: list[dict] = field(default_factory=list)
    tool_requests: list[dict] = field(default_factory=list)
    confidence: float = 1.0

    @property
    def success(self) -> bool:
        return self.status == "success"

    @staticmethod
    def ok(summary: str, output: str = "", result: dict | None = None,
           logs: list[dict] | None = None, confidence: float = 1.0) -> "AgentResult":
        return AgentResult(
            status="success",
            summary=summary,
            output=output,
            result=result or {},
            logs=logs or [],
            confidence=confidence,
        )

    @staticmethod
    def fail(summary: str, output: str = "", logs: list[dict] | None = None) -> "AgentResult":
        return AgentResult(
            status="failed",
            summary=summary,
            output=output,
            logs=logs or [],
            confidence=0.0,
        )

    @staticmethod
    def review(summary: str, output: str = "", result: dict | None = None,
               logs: list[dict] | None = None, confidence: float = 0.5) -> "AgentResult":
        return AgentResult(
            status="needs_review",
            summary=summary,
            output=output,
            result=result or {},
            logs=logs or [],
            confidence=confidence,
        )


@dataclass
class ToolContext:
    session: "AsyncSession"
    run_id: str
    task_id: str
    agent_id: str


@dataclass
class ModelContext:
    session: "AsyncSession"
    run_id: str
    task_id: str
    agent_id: str
    provider: str
    model_name: str
    temperature: float


class BaseAgent(ABC):
    def __init__(self, name: str, agent_type: str):
        self.name = name
        self.agent_type = agent_type

    @abstractmethod
    async def execute(
        self,
        task_title: str,
        task_description: str,
        context: str = "",
        tool_ctx: ToolContext | None = None,
        model_ctx: ModelContext | None = None,
    ) -> AgentResult:
        ...
