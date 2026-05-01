import pytest
import pytest_asyncio
from sqlalchemy import select

from app.models import Run, RunStatus, Task, TaskStatus, Agent, MatrixCell
from app.orchestration.planner import mock_plan_and_create_tasks
from app.orchestration.executor import _execute_single_task, _mark_run_completed
from app.orchestration.dependency import compute_ready_tasks


@pytest.mark.asyncio
async def test_dependency_computes_ready_tasks(db_session, seed_run, seed_agents):
    tasks = await mock_plan_and_create_tasks(db_session, seed_run)

    ready = await compute_ready_tasks(db_session, seed_run.id)

    ready_ids = {t.id for t in ready}
    assert tasks[0].id in ready_ids

    task2_ready = tasks[1].id in ready_ids
    task3_ready = tasks[2].id in ready_ids
    assert not task2_ready
    assert not task3_ready


@pytest.mark.asyncio
async def test_execute_first_task_completes(db_session, seed_run, seed_agents):
    tasks = await mock_plan_and_create_tasks(db_session, seed_run)
    first_task = tasks[0]

    await _execute_single_task(db_session, first_task)

    assert first_task.status == TaskStatus.completed
    assert first_task.result is not None

    cell_result = await db_session.execute(
        select(MatrixCell).where(MatrixCell.task_id == first_task.id)
    )
    cell = cell_result.scalar_one_or_none()
    assert cell is not None
    assert cell.status == "completed"


@pytest.mark.asyncio
async def test_dependency_unlocks_after_completion(db_session, seed_run, seed_agents):
    tasks = await mock_plan_and_create_tasks(db_session, seed_run)

    await _execute_single_task(db_session, tasks[0])

    ready = await compute_ready_tasks(db_session, seed_run.id)
    ready_ids = {t.id for t in ready}

    assert tasks[1].id in ready_ids
    assert tasks[2].id in ready_ids


@pytest.mark.asyncio
async def test_all_tasks_execution_flow(db_session, seed_run, seed_agents):
    tasks = await mock_plan_and_create_tasks(db_session, seed_run)

    execution_order = []
    for _ in range(len(tasks) * 2):
        ready = await compute_ready_tasks(db_session, seed_run.id)
        if not ready:
            break
        for task in ready:
            await _execute_single_task(db_session, task)
            execution_order.append(task.id)

    assert len(execution_order) == len(tasks)

    for task in tasks:
        await db_session.refresh(task)
        assert task.status == TaskStatus.completed

    assert execution_order.index(tasks[0].id) < execution_order.index(tasks[1].id)
    assert execution_order.index(tasks[0].id) < execution_order.index(tasks[2].id)

    idx_1 = execution_order.index(tasks[1].id)
    idx_2 = execution_order.index(tasks[2].id)
    idx_3 = execution_order.index(tasks[3].id)
    assert idx_3 > max(idx_1, idx_2)


@pytest.mark.asyncio
async def test_mark_run_completed_after_all_tasks(db_session, seed_run, seed_agents):
    tasks = await mock_plan_and_create_tasks(db_session, seed_run)

    for _ in range(len(tasks) * 2):
        ready = await compute_ready_tasks(db_session, seed_run.id)
        if not ready:
            break
        for task in ready:
            await _execute_single_task(db_session, task)

    await _mark_run_completed(db_session, seed_run, seed_run.id)
    await db_session.commit()

    await db_session.refresh(seed_run)
    assert seed_run.status in (RunStatus.completed, RunStatus.failed)
