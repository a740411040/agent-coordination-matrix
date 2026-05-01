import logging
import time
from dataclasses import dataclass
from typing import Callable, Awaitable

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ToolCall, CallStatus

from app.tools.file_tools import file_read, file_write
from app.tools.python_runner import python_run
from app.tools.markdown_tools import markdown_write
from app.tools.http_tools import http_request
from app.tools.mock_api import mock_api_call

logger = logging.getLogger(__name__)

ToolFunc = Callable[[dict], Awaitable[dict]]

_REGISTRY: dict[str, ToolFunc] = {
    "file.read": file_read,
    "file.write": file_write,
    "python.run": python_run,
    "markdown.write": markdown_write,
    "http.request": http_request,
    "mock_api.call": mock_api_call,
}

TOOL_INFO: dict[str, dict] = {
    "file.read": {
        "name": "file.read",
        "description": "读取 workspace 目录中的文件内容",
        "input_schema": {"path": "string（相对于 workspace 的路径）"},
    },
    "file.write": {
        "name": "file.write",
        "description": "写入文件到 workspace 目录",
        "input_schema": {"path": "string", "content": "string"},
    },
    "python.run": {
        "name": "python.run",
        "description": "执行 Python 代码（有超时限制）",
        "input_schema": {"code": "string", "timeout": "int（秒，默认 10）"},
    },
    "markdown.write": {
        "name": "markdown.write",
        "description": "将 Markdown 内容写入文件",
        "input_schema": {"filename": "string（可选）", "content": "string"},
    },
    "http.request": {
        "name": "http.request",
        "description": "发送 HTTP GET/POST 请求",
        "input_schema": {"url": "string", "method": "GET|POST", "headers": "dict（可选）", "body": "string（可选）"},
    },
    "mock_api.call": {
        "name": "mock_api.call",
        "description": "调用模拟 API（返回 mock 数据）",
        "input_schema": {"endpoint": "string"},
    },
}


def list_tools() -> list[dict]:
    return list(TOOL_INFO.values())


def get_tool_info(tool_name: str) -> dict | None:
    return TOOL_INFO.get(tool_name)


async def call_tool(
    tool_name: str,
    input_data: dict,
    session: AsyncSession,
    run_id: str,
    task_id: str,
    agent_id: str,
) -> dict:
    func = _REGISTRY.get(tool_name)
    if func is None:
        result = {"status": "failed", "output": None, "error": f"未知工具: {tool_name}"}
    else:
        start = time.monotonic()
        try:
            result = await func(input_data)
        except Exception as e:
            logger.exception("Tool %s raised exception", tool_name)
            result = {"status": "failed", "output": None, "error": str(e)}
        elapsed_ms = int((time.monotonic() - start) * 1000)

    tc = ToolCall(
        run_id=run_id,
        task_id=task_id,
        agent_id=agent_id,
        tool_name=tool_name,
        input=input_data,
        output=result.get("output"),
        status=CallStatus.success if result["status"] == "success" else CallStatus.error,
        error=result.get("error"),
        latency_ms=elapsed_ms if func else 0,
    )
    session.add(tc)
    await session.flush()
    return result
