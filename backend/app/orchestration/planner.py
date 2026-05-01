import logging
import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Agent, MatrixCell, Run, RunStatus, Task, TaskStatus
from app.agents.planner_agent import llm_plan, LLMPlannedTask

logger = logging.getLogger(__name__)


@dataclass
class PlannedTask:
    title: str
    description: str
    agent_name: str
    dependencies: list[int]
    expected_output: str


MOCK_TASK_TEMPLATES = [
    PlannedTask(
        title="数据收集与预处理",
        description="根据目标收集相关数据源，清洗和格式化原始数据，输出结构化数据集。",
        agent_name="data_agent",
        dependencies=[],
        expected_output="结构化 JSON 数据集，包含清洗后的关键字段。",
    ),
    PlannedTask(
        title="数据深度分析",
        description="对预处理后的数据进行统计分析、趋势识别和模式挖掘。",
        agent_name="data_agent",
        dependencies=[0],
        expected_output="分析报告，包含关键指标、趋势和统计摘要。",
    ),
    PlannedTask(
        title="代码实现与处理",
        description="编写数据处理脚本，实现自动化分析流程和可视化图表生成。",
        agent_name="code_agent",
        dependencies=[0],
        expected_output="可执行的 Python 脚本和生成的可视化图表。",
    ),
    PlannedTask(
        title="结果质量审查",
        description="审查数据处理和分析结果的准确性、完整性和一致性。",
        agent_name="critic_agent",
        dependencies=[1, 2],
        expected_output="质量审查报告，列出发现的问题和改进建议。",
    ),
    PlannedTask(
        title="报告撰写与汇总",
        description="汇总所有任务结果，生成结构化的最终 Markdown 报告。",
        agent_name="writer_agent",
        dependencies=[1, 2, 3],
        expected_output="完整的 Markdown 报告，包含摘要、分析结果和建议。",
    ),
]


def _find_planner_agent(agents: list[Agent]) -> Agent | None:
    for a in agents:
        if a.name == "planner_agent":
            return a
    return None


async def _create_tasks_from_llm(
    session: AsyncSession,
    run: Run,
    llm_tasks: list[LLMPlannedTask],
) -> list[Task]:
    task_records: list[Task] = []

    for lt in llm_tasks:
        task = Task(
            run_id=run.id,
            title=lt.title,
            description=lt.description,
            assigned_agent_id=lt.assigned_agent_id,
            status=TaskStatus.pending,
            dependencies=[],
            expected_output=lt.expected_output,
        )
        session.add(task)
        await session.flush()
        task_records.append(task)

    for i, lt in enumerate(llm_tasks):
        if lt.dependencies:
            dep_ids = [task_records[d].id for d in lt.dependencies if d < len(task_records)]
            task_records[i].dependencies = dep_ids

    for task in task_records:
        cell = MatrixCell(
            run_id=run.id,
            task_id=task.id,
            agent_id=task.assigned_agent_id,
            status=task.status.value,
        )
        session.add(cell)

    run.plan = {
        "strategy": "llm_plan",
        "task_count": len(task_records),
        "tasks": [
            {
                "title": t.title,
                "agent": t.assigned_agent_id,
                "deps": t.dependencies,
            }
            for t in task_records
        ],
    }
    await session.flush()

    return task_records


async def _create_tasks_from_mock(
    session: AsyncSession,
    run: Run,
    agents_by_name: dict[str, Agent],
) -> list[Task]:
    task_records: list[Task] = []
    for tmpl in MOCK_TASK_TEMPLATES:
        agent = agents_by_name.get(tmpl.agent_name)
        task = Task(
            run_id=run.id,
            title=tmpl.title,
            description=tmpl.description,
            assigned_agent_id=agent.id if agent else None,
            status=TaskStatus.pending,
            dependencies=[],
            expected_output=tmpl.expected_output,
        )
        session.add(task)
        await session.flush()
        task_records.append(task)

    for i, tmpl in enumerate(MOCK_TASK_TEMPLATES):
        if tmpl.dependencies:
            dep_ids = [task_records[d].id for d in tmpl.dependencies]
            task_records[i].dependencies = dep_ids

    for task in task_records:
        cell = MatrixCell(
            run_id=run.id,
            task_id=task.id,
            agent_id=task.assigned_agent_id,
            status=task.status.value,
        )
        session.add(cell)

    run.plan = {
        "strategy": "mock_plan",
        "task_count": len(task_records),
        "tasks": [
            {
                "title": t.title,
                "agent": t.assigned_agent_id,
                "deps": t.dependencies,
            }
            for t in task_records
        ],
    }
    await session.flush()

    return task_records


async def plan_and_create_tasks(
    session: AsyncSession,
    run: Run,
    planner_mode: str = "mock",
) -> list[Task]:
    run.status = RunStatus.planning
    await session.flush()

    agents_result = await session.execute(select(Agent).where(Agent.enabled == 1))
    all_agents = list(agents_result.scalars().all())
    agents_by_name = {a.name: a for a in all_agents}

    task_records: list[Task] = []

    if planner_mode == "real":
        planner_agent = _find_planner_agent(all_agents)
        if not planner_agent:
            logger.warning("planner_agent 未找到，回退到 mock 模式")
        else:
            provider = planner_agent.model_provider
            model_name = planner_agent.model_name
            temperature = planner_agent.temperature

            llm_tasks = await llm_plan(
                goal=run.goal,
                agents=all_agents,
                session=session,
                run_id=run.id,
                planner_agent_id=planner_agent.id,
                provider=provider,
                model_name=model_name,
                temperature=temperature,
            )

            if llm_tasks is not None:
                task_records = await _create_tasks_from_llm(session, run, llm_tasks)
            else:
                logger.warning("LLM planner 失败，回退到 mock 模式")

    if not task_records:
        run.status = RunStatus.planning
        await session.flush()
        task_records = await _create_tasks_from_mock(session, run, agents_by_name)

    run.status = RunStatus.executing
    await session.flush()

    return task_records


async def mock_plan_and_create_tasks(session: AsyncSession, run: Run) -> list[Task]:
    return await plan_and_create_tasks(session, run, planner_mode="mock")
