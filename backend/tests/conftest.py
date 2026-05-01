import os
import sys
import asyncio
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.db import Base
from app.models import Run, RunStatus, Task, TaskStatus, Agent, AgentType, MatrixCell


TEST_DB_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(TEST_DB_URL, echo=False)
test_session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture
async def db_session():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with test_session_factory() as session:
        yield session
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def seed_agents(db_session: AsyncSession):
    agents = [
        Agent(name="planner_agent", role="任务规划", agent_type=AgentType.mock,
              model_provider="mock", model_name="default"),
        Agent(name="data_agent", role="数据采集与分析", agent_type=AgentType.rule,
              model_provider="rule", model_name="default"),
        Agent(name="code_agent", role="代码实现", agent_type=AgentType.rule,
              model_provider="rule", model_name="default"),
        Agent(name="critic_agent", role="质量审查", agent_type=AgentType.rule,
              model_provider="rule", model_name="default"),
        Agent(name="writer_agent", role="报告撰写", agent_type=AgentType.rule,
              model_provider="rule", model_name="default"),
    ]
    for a in agents:
        db_session.add(a)
    await db_session.flush()
    return {a.name: a for a in agents}


@pytest_asyncio.fixture
async def seed_run(db_session: AsyncSession, seed_agents):
    run = Run(goal="test goal", status=RunStatus.pending)
    db_session.add(run)
    await db_session.flush()
    return run
