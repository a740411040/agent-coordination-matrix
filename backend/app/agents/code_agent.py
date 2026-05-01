import asyncio
import logging

from app.agents.base import AgentResult, BaseAgent, ModelContext, ToolContext
from app.tools.gateway import call_tool
from app.llm.router import call_model

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = "你是一个代码编写专家。请根据任务描述，规划代码实现方案。"


class CodeAgent(BaseAgent):
    def __init__(self):
        super().__init__("code_agent", "mock")

    async def execute(
        self, task_title: str, task_description: str, context: str = "",
        tool_ctx: ToolContext | None = None, model_ctx: ModelContext | None = None,
    ) -> AgentResult:
        logs = []

        if model_ctx:
            try:
                model_result = await call_model(
                    prompt=f"编写代码：{task_title}\n{task_description}",
                    provider_name=model_ctx.provider,
                    model_name=model_ctx.model_name,
                    temperature=model_ctx.temperature,
                    session=model_ctx.session,
                    run_id=model_ctx.run_id,
                    task_id=model_ctx.task_id,
                    agent_id=model_ctx.agent_id,
                    system_prompt=SYSTEM_PROMPT,
                )
                logs.append({"step": "plan_code", "detail": f"model({model_ctx.provider}) => 完成代码规划"})
                if model_result.content:
                    logs.append({"step": "plan_detail", "detail": model_result.content[:200]})
            except Exception as e:
                logger.warning("CodeAgent LLM call failed, using mock: %s", e)
                logs.append({"step": "plan_fallback", "detail": f"LLM 调用失败，使用 mock 模式: {e}"})

        if tool_ctx:
            py_result = await call_tool(
                "python.run", {"code": "print('Analysis complete: 3 charts generated')"},
                tool_ctx.session, tool_ctx.run_id, tool_ctx.task_id, tool_ctx.agent_id,
            )
            logs.append({"step": "execute", "detail": f"python.run => {py_result['status']}"})

            write_result = await call_tool(
                "file.write", {"path": "charts/summary.txt", "content": "Charts: trend, distribution, comparison"},
                tool_ctx.session, tool_ctx.run_id, tool_ctx.task_id, tool_ctx.agent_id,
            )
            logs.append({"step": "write_output", "detail": f"file.write => {write_result['status']}"})
        else:
            await asyncio.sleep(0.4)
            logs.extend([
                {"step": "parse", "detail": "解析输入数据"},
                {"step": "execute", "detail": "运行分析脚本"},
                {"step": "output", "detail": "生成 3 张图表"},
            ])

        return AgentResult.ok(
            summary="代码执行完成：3 张可视化图表已生成。",
            output="脚本执行成功：生成 3 张图表（趋势图、分布图、对比图）。",
            result={"charts": ["trend", "distribution", "comparison"], "count": 3},
            logs=logs,
            confidence=0.95,
        )
