import pytest
import pytest_asyncio
from sqlalchemy import select

from app.models import ToolCall
from app.tools.gateway import call_tool, list_tools, get_tool_info
from app.tools.mock_api import mock_api_call


@pytest.mark.asyncio
async def test_list_tools():
    tools = list_tools()
    assert len(tools) >= 6
    tool_names = [t["name"] for t in tools]
    assert "file.read" in tool_names
    assert "file.write" in tool_names
    assert "python.run" in tool_names
    assert "mock_api.call" in tool_names


@pytest.mark.asyncio
async def test_get_tool_info():
    info = get_tool_info("mock_api.call")
    assert info is not None
    assert info["name"] == "mock_api.call"
    assert "endpoint" in info["input_schema"]


@pytest.mark.asyncio
async def test_get_tool_info_unknown():
    info = get_tool_info("nonexistent_tool")
    assert info is None


@pytest.mark.asyncio
async def test_mock_api_call_direct():
    result = await mock_api_call({"endpoint": "user_stats"})
    assert result["status"] == "success"
    assert result["output"]["total_users"] == 12580

    result = await mock_api_call({"endpoint": "sales_summary"})
    assert result["status"] == "success"
    assert result["output"]["revenue"] == 1_250_000


@pytest.mark.asyncio
async def test_mock_api_call_unknown_endpoint():
    result = await mock_api_call({"endpoint": "unknown_api"})
    assert result["status"] == "success"
    assert "模拟 API 响应" in result["output"]["message"]


@pytest.mark.asyncio
async def test_mock_api_call_no_endpoint():
    result = await mock_api_call({})
    assert result["status"] == "failed"
    assert "endpoint" in result["error"]


@pytest.mark.asyncio
async def test_call_tool_records_tool_call(db_session, seed_run, seed_agents):
    result = await call_tool(
        tool_name="mock_api.call",
        input_data={"endpoint": "user_stats"},
        session=db_session,
        run_id=seed_run.id,
        task_id="test-task-id",
        agent_id=list(seed_agents.values())[0].id,
    )

    assert result["status"] == "success"
    assert result["output"]["total_users"] == 12580

    tc_result = await db_session.execute(
        select(ToolCall).where(ToolCall.run_id == seed_run.id)
    )
    calls = list(tc_result.scalars().all())
    assert len(calls) == 1
    tc = calls[0]
    assert tc.tool_name == "mock_api.call"
    assert tc.status.value == "success"
    assert tc.output is not None


@pytest.mark.asyncio
async def test_call_tool_unknown_tool(db_session, seed_run, seed_agents):
    result = await call_tool(
        tool_name="nonexistent.tool",
        input_data={},
        session=db_session,
        run_id=seed_run.id,
        task_id="test-task-id",
        agent_id=list(seed_agents.values())[0].id,
    )

    assert result["status"] == "failed"
    assert "未知工具" in result["error"]
