from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.config import settings
from app.db import async_session_factory, create_all_tables
from app.models import Agent, AgentType
from app.api.agents import router as agents_router
from app.api.runs import router as runs_router
from app.api.tasks import router as tasks_router
from app.api.tools import router as tools_router
from app.api.reports import router as reports_router


DEFAULT_AGENTS = [
    {
        "name": "planner_agent",
        "role": "拆解用户目标为任务 DAG，输出结构化任务列表",
        "agent_type": AgentType.llm,
        "model_provider": "mock",
        "model_name": "default",
        "temperature": 0.3,
        "tools": [],
    },
    {
        "name": "data_agent",
        "role": "数据收集、清洗与分析",
        "agent_type": AgentType.mock,
        "model_provider": "mock",
        "model_name": "default",
        "temperature": 0.5,
        "tools": ["file.read", "http.request"],
    },
    {
        "name": "code_agent",
        "role": "编写和执行代码任务",
        "agent_type": AgentType.mock,
        "model_provider": "mock",
        "model_name": "default",
        "temperature": 0.2,
        "tools": ["file.read", "file.write", "python.run"],
    },
    {
        "name": "critic_agent",
        "role": "审查其他 Agent 的输出质量并给出反馈",
        "agent_type": AgentType.rule,
        "model_provider": "mock",
        "model_name": "default",
        "temperature": 0.4,
        "tools": [],
    },
    {
        "name": "writer_agent",
        "role": "汇总所有任务结果，生成最终 Markdown 报告",
        "agent_type": AgentType.mock,
        "model_provider": "mock",
        "model_name": "default",
        "temperature": 0.6,
        "tools": ["markdown.write"],
    },
]


async def _seed_agents():
    async with async_session_factory() as session:
        for agent_def in DEFAULT_AGENTS:
            result = await session.execute(
                select(Agent).where(Agent.name == agent_def["name"])
            )
            if result.scalar_one_or_none() is None:
                session.add(Agent(**agent_def))
        await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_all_tables()
    await _seed_agents()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents_router)
app.include_router(runs_router)
app.include_router(tasks_router)
app.include_router(tools_router)
app.include_router(reports_router)


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
