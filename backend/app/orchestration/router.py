from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Agent


AGENT_ROLE_MAP = {
    "data": "data_agent",
    "code": "code_agent",
    "review": "critic_agent",
    "report": "writer_agent",
    "plan": "planner_agent",
}


async def resolve_agent(session: AsyncSession, agent_name: str) -> Agent | None:
    result = await session.execute(
        select(Agent).where(Agent.name == agent_name, Agent.enabled == 1)
    )
    return result.scalar_one_or_none()


async def route_task_to_agent(session: AsyncSession, task_description: str) -> Agent | None:
    desc_lower = task_description.lower()
    for keyword, agent_name in AGENT_ROLE_MAP.items():
        if keyword in desc_lower:
            return await resolve_agent(session, agent_name)
    return await resolve_agent(session, "data_agent")
