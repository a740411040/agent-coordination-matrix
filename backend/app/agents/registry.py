from app.agents.base import BaseAgent
from app.agents.data_agent import DataAgent
from app.agents.code_agent import CodeAgent
from app.agents.critic_agent import CriticAgent
from app.agents.writer_agent import WriterAgent
from app.agents.mock_agents import MockPlannerAgent

_REGISTRY: dict[str, BaseAgent] = {
    "data_agent": DataAgent(),
    "code_agent": CodeAgent(),
    "critic_agent": CriticAgent(),
    "writer_agent": WriterAgent(),
    "planner_agent": MockPlannerAgent(),
}


def get_agent(name: str) -> BaseAgent | None:
    return _REGISTRY.get(name)
