import asyncio
import logging

from app.agents.base import AgentResult, BaseAgent, ModelContext, ToolContext
from app.tools.gateway import call_tool
from app.llm.router import call_model

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = "你是一个报告撰写专家。请根据任务描述和上下文，撰写结构化的 Markdown 报告。"

TEMPLATE_REPORT = (
    "# 分析报告\n\n"
    "## 摘要\n本次分析覆盖 1250 条数据记录，生成了 3 张可视化图表。\n\n"
    "## 关键发现\n- 趋势呈上升态势\n- Q3 增速最快\n- 分布集中在中位数附近\n\n"
    "## 建议\n- 持续关注 Q3 表现\n- 优化数据采集流程"
)


class WriterAgent(BaseAgent):
    def __init__(self):
        super().__init__("writer_agent", "mock")

    async def execute(
        self, task_title: str, task_description: str, context: str = "",
        tool_ctx: ToolContext | None = None, model_ctx: ModelContext | None = None,
    ) -> AgentResult:
        logs = []
        report = TEMPLATE_REPORT

        if model_ctx:
            try:
                model_result = await call_model(
                    prompt=f"撰写报告：{task_title}\n{task_description}\n\n上下文：\n{context or '无额外上下文'}",
                    provider_name=model_ctx.provider,
                    model_name=model_ctx.model_name,
                    temperature=model_ctx.temperature,
                    session=model_ctx.session,
                    run_id=model_ctx.run_id,
                    task_id=model_ctx.task_id,
                    agent_id=model_ctx.agent_id,
                    system_prompt=SYSTEM_PROMPT,
                )
                logs.append({"step": "draft_report", "detail": f"model({model_ctx.provider}) => 完成报告草稿"})
                if model_result.content and len(model_result.content) > 50:
                    report = model_result.content
                    logs.append({"step": "report_source", "detail": "使用 LLM 生成的报告"})
                else:
                    logs.append({"step": "report_fallback", "detail": "LLM 输出过短，使用模板报告"})
            except Exception as e:
                logger.warning("WriterAgent LLM call failed, using template: %s", e)
                logs.append({"step": "draft_fallback", "detail": f"LLM 调用失败，使用模板报告: {e}"})

        if tool_ctx:
            md_result = await call_tool(
                "markdown.write", {"filename": "analysis_report.md", "content": report},
                tool_ctx.session, tool_ctx.run_id, tool_ctx.task_id, tool_ctx.agent_id,
            )
            logs.append({"step": "write_report", "detail": f"markdown.write => {md_result['status']}"})
        else:
            await asyncio.sleep(0.3)

        logs.extend([
            {"step": "collect", "detail": "收集所有任务结果"},
            {"step": "draft", "detail": "生成报告草稿"},
            {"step": "finalize", "detail": "报告定稿"},
        ])

        return AgentResult.ok(
            summary="报告生成完成：包含摘要、关键发现和建议。",
            output=report,
            result={"report_length": len(report), "format": "markdown"},
            logs=logs,
            confidence=0.85,
        )
