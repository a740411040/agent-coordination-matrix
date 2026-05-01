import pytest
import pytest_asyncio
from sqlalchemy import select

from app.models import Run, RunStatus, Task, TaskStatus, Agent, MatrixCell
from app.orchestration.planner import (
    plan_and_create_tasks,
    mock_plan_and_create_tasks,
    MOCK_TASK_TEMPLATES,
)


@pytest.mark.asyncio
async def test_mock_plan_generates_tasks(db_session, seed_run, seed_agents):
    tasks = await mock_plan_and_create_tasks(db_session, seed_run)

    assert len(tasks) == len(MOCK_TASK_TEMPLATES)
    for task in tasks:
        assert task.run_id == seed_run.id
        assert task.status == TaskStatus.pending
        assert task.title
        assert task.description

    await db_session.refresh(seed_run)
    assert seed_run.status == RunStatus.executing
    assert seed_run.plan is not None
    assert seed_run.plan["strategy"] == "mock_plan"
    assert seed_run.plan["task_count"] == len(MOCK_TASK_TEMPLATES)


@pytest.mark.asyncio
async def test_mock_plan_sets_dependencies(db_session, seed_run, seed_agents):
    tasks = await mock_plan_and_create_tasks(db_session, seed_run)

    assert tasks[0].dependencies == []

    task2_deps = tasks[1].dependencies or []
    assert len(task2_deps) == 1
    assert tasks[0].id in task2_deps

    task4_deps = tasks[3].dependencies or []
    assert len(task4_deps) == 2
    assert tasks[1].id in task4_deps
    assert tasks[2].id in task4_deps

    task5_deps = tasks[4].dependencies or []
    assert len(task5_deps) == 3


@pytest.mark.asyncio
async def test_mock_plan_creates_matrix_cells(db_session, seed_run, seed_agents):
    await mock_plan_and_create_tasks(db_session, seed_run)

    result = await db_session.execute(
        select(MatrixCell).where(MatrixCell.run_id == seed_run.id)
    )
    cells = list(result.scalars().all())

    assert len(cells) == len(MOCK_TASK_TEMPLATES)
    for cell in cells:
        assert cell.task_id is not None
        assert cell.agent_id is not None
        assert cell.status == "pending"


@pytest.mark.asyncio
async def test_plan_and_create_tasks_default_mock(db_session, seed_run, seed_agents):
    tasks = await plan_and_create_tasks(db_session, seed_run)

    assert len(tasks) > 0
    await db_session.refresh(seed_run)
    assert seed_run.status == RunStatus.executing
