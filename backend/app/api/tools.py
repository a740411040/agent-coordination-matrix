from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import ToolCall
from app.schemas import ToolCallRead
from app.tools.gateway import list_tools, get_tool_info

router = APIRouter(prefix="/api", tags=["tools"])


@router.get("/tools")
async def get_tools():
    return list_tools()


@router.get("/tools/{tool_name:path}")
async def get_tool(tool_name: str):
    info = get_tool_info(tool_name)
    if info is None:
        raise HTTPException(status_code=404, detail=f"工具不存在: {tool_name}")
    return info


@router.get("/runs/{run_id}/tool-calls", response_model=list[ToolCallRead])
async def get_run_tool_calls(run_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(ToolCall).where(ToolCall.run_id == run_id).order_by(ToolCall.created_at)
    )
    return result.scalars().all()
