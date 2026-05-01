import asyncio

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import Agent, MatrixCell, ModelCall, Run, RunStatus, Task
from app.schemas import AgentRead, MatrixCellRead, MatrixResponse, ModelCallRead, RunCreate, RunRead, RunDetail, TaskRead
from app.orchestration.planner import plan_and_create_tasks
from app.orchestration.executor import run_executor

router = APIRouter(prefix="/api/runs", tags=["runs"])


@router.post("", response_model=RunDetail, status_code=201)
async def create_run(body: RunCreate, session: AsyncSession = Depends(get_session)):
    run = Run(goal=body.goal)
    session.add(run)
    await session.flush()

    tasks = await plan_and_create_tasks(session, run, planner_mode=body.planner_mode)
    await session.commit()
    await session.refresh(run)

    run_detail = RunDetail(
        id=run.id,
        goal=run.goal,
        status=run.status.value,
        plan=run.plan,
        final_output=run.final_output,
        final_report=run.final_report,
        created_at=run.created_at,
        updated_at=run.updated_at,
        tasks=[TaskRead.model_validate(t) for t in tasks],
    )
    return run_detail


@router.post("/{run_id}/start", response_model=RunRead)
async def start_run(run_id: str, background_tasks: BackgroundTasks, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Run).where(Run.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if run.status not in (RunStatus.executing, RunStatus.pending):
        raise HTTPException(status_code=400, detail=f"Run status is {run.status.value}, cannot start")

    run.status = RunStatus.executing
    await session.commit()
    await session.refresh(run)

    background_tasks.add_task(run_executor, run_id)

    return run


@router.get("", response_model=list[RunRead])
async def list_runs(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Run).order_by(Run.created_at.desc()))
    runs = result.scalars().all()
    return runs


@router.get("/{run_id}", response_model=RunDetail)
async def get_run(run_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Run).where(Run.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.get("/{run_id}/tasks", response_model=list[TaskRead])
async def get_run_tasks(run_id: str, session: AsyncSession = Depends(get_session)):
    run_result = await session.execute(select(Run).where(Run.id == run_id))
    if not run_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Run not found")
    result = await session.execute(select(Task).where(Task.run_id == run_id).order_by(Task.created_at))
    return result.scalars().all()


@router.get("/{run_id}/matrix", response_model=MatrixResponse)
async def get_run_matrix(run_id: str, session: AsyncSession = Depends(get_session)):
    run_result = await session.execute(select(Run).where(Run.id == run_id))
    run = run_result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    tasks_result = await session.execute(select(Task).where(Task.run_id == run_id).order_by(Task.created_at))
    tasks = tasks_result.scalars().all()

    agent_ids = list({t.assigned_agent_id for t in tasks if t.assigned_agent_id})
    agents = []
    if agent_ids:
        agents_result = await session.execute(select(Agent).where(Agent.id.in_(agent_ids)))
        agents = list(agents_result.scalars().all())

    cells_result = await session.execute(select(MatrixCell).where(MatrixCell.run_id == run_id))
    cells = cells_result.scalars().all()

    return MatrixResponse(run_id=run_id, agents=agents, tasks=tasks, cells=cells)


@router.get("/{run_id}/model-calls", response_model=list[ModelCallRead])
async def get_run_model_calls(run_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(ModelCall).where(ModelCall.run_id == run_id).order_by(ModelCall.created_at)
    )
    return result.scalars().all()
