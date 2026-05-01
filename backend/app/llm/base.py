from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class ModelUsage:
    input_tokens: int = 0
    output_tokens: int = 0


@dataclass
class ModelResponse:
    content: str = ""
    parsed: dict | None = None
    usage: ModelUsage = field(default_factory=ModelUsage)
    raw: dict = field(default_factory=dict)


class BaseProvider(ABC):
    provider_name: str = "unknown"

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        model_name: str,
        temperature: float,
        system_prompt: str = "",
    ) -> ModelResponse:
        ...
