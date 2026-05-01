from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import Agent
from app.schemas import AgentRead

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("", response_model=list[AgentRead])
async def list_agents(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Agent).order_by(Agent.name))
    agents = result.scalars().all()
    return agents


@router.get("/{agent_id}", response_model=AgentRead)
async def get_agent(agent_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent
