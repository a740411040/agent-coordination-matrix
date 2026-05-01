from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import MatrixCell, Run, Task, TaskStatus


async def compute_ready_tasks(session: AsyncSession, run_id: str) -> list[Task]:
    result = await session.execute(
        select(Task).where(Task.run_id == run_id, Task.status == TaskStatus.pending)
    )
    pending_tasks = list(result.scalars().all())

    result_all = await session.execute(
        select(Task).where(Task.run_id == run_id)
    )
    all_tasks = {t.id: t for t in result_all.scalars().all()}

    ready: list[Task] = []
    for task in pending_tasks:
        deps = task.dependencies or []
        if not deps:
            ready.append(task)
            continue
        all_deps_done = all(
            all_tasks[d].status in (TaskStatus.completed, "success", TaskStatus.needs_review)
            for d in deps
            if d in all_tasks
        )
        all_deps_ok = all(
            all_tasks[d].status not in (TaskStatus.failed, TaskStatus.blocked)
            for d in deps
            if d in all_tasks
        )
        if all_deps_done and all_deps_ok:
            ready.append(task)
        elif not all_deps_ok:
            task.status = TaskStatus.blocked
            await session.flush()
            cell_result = await session.execute(
                select(MatrixCell).where(
                    MatrixCell.run_id == run_id,
                    MatrixCell.task_id == task.id,
                )
            )
            cell = cell_result.scalar_one_or_none()
            if cell:
                cell.status = "blocked"
                await session.flush()

    return ready
