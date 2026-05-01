from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import Task, TaskStatus
from app.orchestration.executor import execute_single_task_manual
from app.schemas import TaskRead

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("/{task_id}", response_model=TaskRead)
async def get_task(task_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/{task_id}/retry", response_model=TaskRead)
async def retry_task(
    task_id: str,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status not in (TaskStatus.failed, TaskStatus.needs_review):
        raise HTTPException(
            status_code=400,
            detail=f"Task status is '{task.status.value}', only failed or needs_review tasks can be retried",
        )

    background_tasks.add_task(execute_single_task_manual, task_id)

    task.status = TaskStatus.pending
    task.retry_count += 1
    await session.commit()
    await session.refresh(task)

    return task
