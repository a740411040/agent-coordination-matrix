import asyncio
import logging

from app.agents.base import AgentResult, BaseAgent, ModelContext, ToolContext
from app.tools.gateway import call_tool
from app.llm.router import call_model

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = "你是一个数据分析专家。请根据任务描述，规划数据收集和分析步骤。"


class DataAgent(BaseAgent):
    def __init__(self):
        super().__init__("data_agent", "rule")

    async def execute(
        self, task_title: str, task_description: str, context: str = "",
        tool_ctx: ToolContext | None = None, model_ctx: ModelContext | None = None,
    ) -> AgentResult:
        logs = []
        tool_requests = []

        if model_ctx:
            try:
                model_result = await call_model(
                    prompt=f"分析任务：{task_title}\n{task_description}\n\n请规划数据收集和分析步骤。",
                    provider_name=model_ctx.provider,
                    model_name=model_ctx.model_name,
                    temperature=model_ctx.temperature,
                    session=model_ctx.session,
                    run_id=model_ctx.run_id,
                    task_id=model_ctx.task_id,
                    agent_id=model_ctx.agent_id,
                    system_prompt=SYSTEM_PROMPT,
                )
                logs.append({"step": "plan", "detail": f"model({model_ctx.provider}) => 完成分析规划"})
                if model_result.content:
                    logs.append({"step": "plan_detail", "detail": model_result.content[:200]})
            except Exception as e:
                logger.warning("DataAgent LLM call failed, using rule-based: %s", e)
                logs.append({"step": "plan_fallback", "detail": f"LLM 调用失败，使用规则模式: {e}"})

        if tool_ctx:
            tool_requests.append({"tool": "mock_api.call", "input": {"endpoint": "sales_summary"}})
            api_result = await call_tool(
                "mock_api.call", {"endpoint": "sales_summary"},
                tool_ctx.session, tool_ctx.run_id, tool_ctx.task_id, tool_ctx.agent_id,
            )
            logs.append({"step": "fetch", "detail": f"mock_api.call => {api_result['status']}"})

            tool_requests.append({"tool": "file.read", "input": {"path": "sample_data.csv"}})
            file_result = await call_tool(
                "file.read", {"path": "sample_data.csv"},
                tool_ctx.session, tool_ctx.run_id, tool_ctx.task_id, tool_ctx.agent_id,
            )
            logs.append({"step": "read_file", "detail": f"file.read => {file_result['status']}"})
        else:
            await asyncio.sleep(0.3)
            logs.extend([
                {"step": "connect", "detail": "已连接数据源"},
                {"step": "read", "detail": "读取 1250 条记录"},
                {"step": "clean", "detail": "清洗完成，空值已填充"},
            ])

        return AgentResult.ok(
            summary="数据读取完成：1250 条记录，3 个字段，3 个空值已处理。",
            output='{"records": 1250, "fields": ["date", "value", "category"], "null_count": 3}',
            result={"records": 1250, "fields": ["date", "value", "category"], "null_count": 3},
            logs=logs,
            confidence=0.9,
        )
