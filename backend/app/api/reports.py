from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import Run
from app.schemas import FinalReportRead

router = APIRouter(prefix="/api/runs", tags=["reports"])


@router.get("/{run_id}/final-report", response_model=FinalReportRead)
async def get_final_report(run_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Run).where(Run.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if not run.final_report:
        raise HTTPException(status_code=404, detail="Final report not available yet")
    return FinalReportRead(
        run_id=run.id,
        goal=run.goal,
        status=run.status.value,
        final_report=run.final_report,
    )


@router.get("/{run_id}/download-report")
async def download_report(run_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Run).where(Run.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if not run.final_report:
        raise HTTPException(status_code=404, detail="Final report not available yet")
    return Response(
        content=run.final_report.encode("utf-8"),
        media_type="text/markdown; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="report_{run_id[:8]}.md"',
        },
    )
