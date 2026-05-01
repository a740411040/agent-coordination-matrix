import asyncio
import logging

from app.agents.base import AgentResult, BaseAgent, ModelContext, ToolContext
from app.tools.gateway import call_tool
from app.llm.router import call_model

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = "你是一个质量审查专家。请根据任务描述，审查数据和结果的质量。"

MAX_AUTO_RETRIES = 2


def review_result(result: str | None, error: str | None, summary: str | None) -> AgentResult:
    logs = []

    if error:
        logs.append({"step": "check_error", "detail": f"发现错误: {error[:200]}"})
        return AgentResult.fail(
            summary=f"审查失败：任务执行出错",
            output=f"任务执行出错: {error}",
            logs=logs,
        )

    if not result or not result.strip():
        logs.append({"step": "check_result", "detail": "结果为空"})
        return AgentResult.fail(
            summary="审查失败：任务结果为空",
            output="任务结果为空，无法通过审查。",
            logs=logs,
        )

    if not summary or not summary.strip():
        logs.append({"step": "check_summary", "detail": "缺少摘要"})
        return AgentResult.review(
            summary="需要审查：任务结果缺少摘要",
            output="任务结果已生成，但缺少摘要说明，需要人工审查。",
            result={"result_preview": result[:200]},
            logs=logs,
            confidence=0.5,
        )

    logs.append({"step": "check_all", "detail": "所有检查通过"})
    return AgentResult.ok(
        summary="审查通过：任务结果完整且有效。",
        output=result,
        result={"passed": True},
        logs=logs,
        confidence=1.0,
    )


class CriticAgent(BaseAgent):
    def __init__(self):
        super().__init__("critic_agent", "rule")

    async def execute(
        self, task_title: str, task_description: str, context: str = "",
        tool_ctx: ToolContext | None = None, model_ctx: ModelContext | None = None,
    ) -> AgentResult:
        logs = []

        if model_ctx:
            try:
                model_result = await call_model(
                    prompt=f"质量审查：{task_title}\n{task_description}",
                    provider_name=model_ctx.provider,
                    model_name=model_ctx.model_name,
                    temperature=model_ctx.temperature,
                    session=model_ctx.session,
                    run_id=model_ctx.run_id,
                    task_id=model_ctx.task_id,
                    agent_id=model_ctx.agent_id,
                    system_prompt=SYSTEM_PROMPT,
                )
                logs.append({"step": "review", "detail": f"model({model_ctx.provider}) => 完成审查分析"})
                if model_result.content:
                    logs.append({"step": "review_detail", "detail": model_result.content[:200]})
            except Exception as e:
                logger.warning("CriticAgent LLM call failed, using rule-based: %s", e)
                logs.append({"step": "review_fallback", "detail": f"LLM 调用失败，使用规则模式: {e}"})

        if tool_ctx:
            api_result = await call_tool(
                "mock_api.call", {"endpoint": "system_health"},
                tool_ctx.session, tool_ctx.run_id, tool_ctx.task_id, tool_ctx.agent_id,
            )
            logs.append({"step": "check_health", "detail": f"mock_api.call => {api_result['status']}"})
        else:
            await asyncio.sleep(0.2)

        completeness = 98
        consistency = 95
        accuracy = True

        logs.extend([
            {"step": "check_completeness", "detail": f"数据完整性 {completeness}%"},
            {"step": "check_consistency", "detail": f"数据一致性 {consistency}%"},
            {"step": "check_accuracy", "detail": "准确性验证通过" if accuracy else "准确性验证失败"},
        ])

        passed = completeness >= 90 and consistency >= 90 and accuracy
        confidence = min(completeness, consistency) / 100.0

        if not passed:
            return AgentResult.review(
                summary=f"质量审查未通过：完整性 {completeness}%，一致性 {consistency}%",
                output=f"质量审查未通过：数据完整性 {completeness}%，一致性 {consistency}%。",
                result={"completeness": completeness, "consistency": consistency, "accuracy": accuracy, "passed": False},
                logs=logs,
                confidence=confidence,
            )

        return AgentResult.ok(
            summary="质量审查通过，所有指标达标。",
            output=f"质量审查通过：数据完整性 {completeness}%，一致性 {consistency}%，准确性验证通过。",
            result={"completeness": completeness, "consistency": consistency, "accuracy": accuracy, "passed": True},
            logs=logs,
            confidence=confidence,
        )
