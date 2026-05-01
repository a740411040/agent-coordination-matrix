import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.utils.time_utils import utc_now_naive

from app.agents.base import AgentResult, ModelContext, ToolContext
from app.agents.critic_agent import review_result
from app.agents.registry import get_agent
from app.db import async_session_factory
from app.models import (
    Agent,
    MatrixCell,
    Run,
    RunStatus,
    Task,
    TaskStatus,
)
from app.orchestration.dependency import compute_ready_tasks
from app.orchestration.synthesizer import synthesize_report

logger = logging.getLogger(__name__)

MAX_AUTO_RETRIES = 2


async def _update_cell_status(session: AsyncSession, run_id: str, task_id: str, status: str):
    result = await session.execute(
        select(MatrixCell).where(
            MatrixCell.run_id == run_id,
            MatrixCell.task_id == task_id,
        )
    )
    cell = result.scalar_one_or_none()
    if cell:
        cell.status = status
        cell.updated_at = utc_now_naive()


async def _execute_agent(task: Task, agent, session: AsyncSession) -> AgentResult:
    agent_row = None
    if task.assigned_agent_id:
        result = await session.execute(
            select(Agent).where(Agent.id == task.assigned_agent_id)
        )
        agent_row = result.scalar_one_or_none()

    tool_ctx = ToolContext(
        session=session,
        run_id=task.run_id,
        task_id=task.id,
        agent_id=task.assigned_agent_id,
    )

    model_ctx = ModelContext(
        session=session,
        run_id=task.run_id,
        task_id=task.id,
        agent_id=task.assigned_agent_id,
        provider=agent_row.model_provider if agent_row else "mock",
        model_name=agent_row.model_name if agent_row else "default",
        temperature=agent_row.temperature if agent_row else 0.7,
    )

    return await agent.execute(
        task_title=task.title,
        task_description=task.description or "",
        context="",
        tool_ctx=tool_ctx,
        model_ctx=model_ctx,
    )


async def _verify_task(task: Task, agent_result: AgentResult, session: AsyncSession) -> str:
    task.status = TaskStatus.verifying
    await _update_cell_status(session, task.run_id, task.id, "verifying")
    await session.flush()

    cell_result = await session.execute(
        select(MatrixCell).where(
            MatrixCell.run_id == task.run_id,
            MatrixCell.task_id == task.id,
        )
    )
    cell = cell_result.scalar_one_or_none()

    summary = cell.summary if cell and cell.summary else None

    critic_result = review_result(task.result, task.error, summary)

    verify_logs = list(task.logs or [])
    verify_logs.extend(critic_result.logs)
    task.logs = verify_logs

    if cell:
        cell.logs = verify_logs
        cell.updated_at = utc_now_naive()

    return critic_result.status


async def _execute_single_task(session: AsyncSession, task: Task):
    task.status = TaskStatus.running
    await _update_cell_status(session, task.run_id, task.id, "running")
    await session.flush()

    agent_row = None
    if task.assigned_agent_id:
        result = await session.execute(
            select(Agent).where(Agent.id == task.assigned_agent_id)
        )
        agent_row = result.scalar_one_or_none()

    agent_name = agent_row.name if agent_row else None
    agent = get_agent(agent_name) if agent_name else None

    if agent is None:
        task.status = TaskStatus.failed
        task.error = f"未找到 agent: {agent_name}"
        await _update_cell_status(session, task.run_id, task.id, "failed")
        await session.flush()
        return

    try:
        agent_result = await _execute_agent(task, agent, session)

        task.result = agent_result.output
        task.logs = agent_result.logs

        cell_result = await session.execute(
            select(MatrixCell).where(
                MatrixCell.run_id == task.run_id,
                MatrixCell.task_id == task.id,
            )
        )
        cell = cell_result.scalar_one_or_none()
        if cell:
            cell.summary = agent_result.summary
            cell.result = agent_result.output

        verify_status = await _verify_task(task, agent_result, session)

        if verify_status == "success":
            task.status = TaskStatus.completed
            await _update_cell_status(session, task.run_id, task.id, "completed")
            logger.info("Task %s completed and verified", task.id)
        elif verify_status == "needs_review":
            task.status = TaskStatus.needs_review
            await _update_cell_status(session, task.run_id, task.id, "needs_review")
            logger.info(
                "Task %s needs_review (confidence=%.2f): %s",
                task.id, agent_result.confidence, agent_result.summary,
            )
        else:
            if task.retry_count < MAX_AUTO_RETRIES:
                task.retry_count += 1
                task.status = TaskStatus.retry
                await _update_cell_status(session, task.run_id, task.id, "retry")
                logger.info(
                    "Task %s failed review, auto-retry %d/%d",
                    task.id, task.retry_count, MAX_AUTO_RETRIES,
                )
                await session.flush()
                task.status = TaskStatus.pending
                await _update_cell_status(session, task.run_id, task.id, "pending")
                return
            else:
                task.status = TaskStatus.failed
                task.error = f"审查失败，已重试 {MAX_AUTO_RETRIES} 次: {agent_result.summary}"
                await _update_cell_status(session, task.run_id, task.id, "failed")
                logger.warning("Task %s failed after %d retries", task.id, MAX_AUTO_RETRIES)

    except Exception as e:
        logger.exception("Task execution failed: %s", task.id)
        task.status = TaskStatus.failed
        task.error = str(e)
        await _update_cell_status(session, task.run_id, task.id, "failed")

    await session.flush()


async def _mark_run_completed(session: AsyncSession, run: Run, run_id: str):
    if run.status in (RunStatus.completed, RunStatus.failed):
        return

    result = await session.execute(
        select(Task).where(Task.run_id == run_id)
    )
    tasks = list(result.scalars().all())

    terminal_states = (TaskStatus.completed, TaskStatus.failed, TaskStatus.blocked, TaskStatus.needs_review)
    all_done = all(t.status in terminal_states for t in tasks)
    if not all_done:
        return

    has_failure = any(t.status in (TaskStatus.failed, TaskStatus.blocked) for t in tasks)
    if has_failure:
        run.status = RunStatus.failed
        run.updated_at = utc_now_naive()
    else:
        await synthesize_report(session, run)


async def execute_single_task_manual(task_id: str):
    async with async_session_factory() as session:
        result = await session.execute(select(Task).where(Task.id == task_id))
        task = result.scalar_one_or_none()
        if not task:
            logger.error("Task not found: %s", task_id)
            return

        task.error = None
        task.result = None
        task.logs = []
        await session.flush()

        await _execute_single_task(session, task)

        run_result = await session.execute(select(Run).where(Run.id == task.run_id))
        run = run_result.scalar_one_or_none()
        if run:
            await _mark_run_completed(session, run, task.run_id)

        await session.commit()


async def run_executor(run_id: str):
    async with async_session_factory() as session:
        result = await session.execute(select(Run).where(Run.id == run_id))
        run = result.scalar_one_or_none()
        if not run:
            logger.error("Run not found: %s", run_id)
            return

        while True:
            ready_tasks = await compute_ready_tasks(session, run_id)

            if not ready_tasks:
                await session.refresh(run)
                if run.status == RunStatus.executing:
                    await _mark_run_completed(session, run, run_id)
                await session.commit()
                break

            for task in ready_tasks:
                await _execute_single_task(session, task)

            await _mark_run_completed(session, run, run_id)
            await session.commit()

            result = await session.execute(
                select(Task).where(
                    Task.run_id == run_id,
                    Task.status == TaskStatus.pending,
                )
            )
            remaining = result.scalars().all()
            if not remaining:
                break
