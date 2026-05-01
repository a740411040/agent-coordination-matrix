import asyncio
import logging

from app.agents.base import AgentResult, BaseAgent, ModelContext, ToolContext
from app.tools.gateway import call_tool
from app.llm.router import call_model

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_MAP = {
    "data_agent": "你是一个数据分析专家。",
    "code_agent": "你是一个代码编写专家。",
    "critic_agent": "你是一个质量审查专家。",
    "writer_agent": "你是一个报告撰写专家。",
}

MOCK_OUTPUT = {
    "data_agent": {
        "summary": "数据读取完成：1250 条记录，3 个字段，3 个空值已处理。",
        "output": '{"records": 1250, "fields": ["date", "value", "category"], "null_count": 3}',
        "result": {"records": 1250, "fields": ["date", "value", "category"], "null_count": 3},
    },
    "code_agent": {
        "summary": "代码执行完成：3 张可视化图表已生成。",
        "output": "脚本执行成功：生成 3 张图表（趋势图、分布图、对比图）。",
        "result": {"charts": ["trend", "distribution", "comparison"], "count": 3},
    },
    "critic_agent": {
        "summary": "质量审查通过，所有指标达标。",
        "output": "质量审查通过：数据完整性 98%，一致性 95%，准确性验证通过。",
        "result": {"completeness": 98, "consistency": 95, "accuracy": True, "passed": True},
    },
    "writer_agent": {
        "summary": "报告生成完成：包含摘要、关键发现和建议。",
        "output": "# 分析报告\n\n## 摘要\n本次分析覆盖 1250 条数据记录，生成了 3 张可视化图表。\n\n## 关键发现\n- 趋势呈上升态势\n- Q3 增速最快\n- 分布集中在中位数附近\n\n## 建议\n- 持续关注 Q3 表现\n- 优化数据采集流程",
        "result": {"report_length": 200, "format": "markdown"},
    },
}


class MockDataAgent(BaseAgent):
    def __init__(self):
        super().__init__("data_agent", "mock")

    async def execute(
        self, task_title: str, task_description: str, context: str = "",
        tool_ctx: ToolContext | None = None, model_ctx: ModelContext | None = None,
    ) -> AgentResult:
        logs = []
        if model_ctx:
            try:
                await call_model(
                    prompt=f"分析任务：{task_title}\n{task_description}",
                    provider_name=model_ctx.provider,
                    model_name=model_ctx.model_name,
                    temperature=model_ctx.temperature,
                    session=model_ctx.session,
                    run_id=model_ctx.run_id,
                    task_id=model_ctx.task_id,
                    agent_id=model_ctx.agent_id,
                    system_prompt="你是一个数据分析专家。",
                )
                logs.append({"step": "plan", "detail": f"model({model_ctx.provider}) => 完成分析规划"})
            except Exception as e:
                logger.warning("MockDataAgent model call failed: %s", e)

        if tool_ctx:
            await call_tool("mock_api.call", {"endpoint": "sales_summary"},
                           tool_ctx.session, tool_ctx.run_id, tool_ctx.task_id, tool_ctx.agent_id)
            logs.append({"step": "fetch", "detail": "mock_api.call => success"})
            await call_tool("file.read", {"path": "sample_data.csv"},
                           tool_ctx.session, tool_ctx.run_id, tool_ctx.task_id, tool_ctx.agent_id)
            logs.append({"step": "read_file", "detail": "file.read => success"})
        else:
            await asyncio.sleep(0.3)

        mock = MOCK_OUTPUT["data_agent"]
        logs.extend([
            {"step": "connect", "detail": "已连接数据源"},
            {"step": "read", "detail": "读取 1250 条记录"},
            {"step": "clean", "detail": "清洗完成，空值已填充"},
        ])
        return AgentResult.ok(summary=mock["summary"], output=mock["output"],
                              result=mock["result"], logs=logs, confidence=0.9)


class MockCodeAgent(BaseAgent):
    def __init__(self):
        super().__init__("code_agent", "mock")

    async def execute(
        self, task_title: str, task_description: str, context: str = "",
        tool_ctx: ToolContext | None = None, model_ctx: ModelContext | None = None,
    ) -> AgentResult:
        logs = []
        if model_ctx:
            try:
                await call_model(
                    prompt=f"编写代码：{task_title}\n{task_description}",
                    provider_name=model_ctx.provider,
                    model_name=model_ctx.model_name,
                    temperature=model_ctx.temperature,
                    session=model_ctx.session,
                    run_id=model_ctx.run_id,
                    task_id=model_ctx.task_id,
                    agent_id=model_ctx.agent_id,
                    system_prompt="你是一个代码编写专家。",
                )
                logs.append({"step": "plan_code", "detail": f"model({model_ctx.provider}) => 完成代码规划"})
            except Exception as e:
                logger.warning("MockCodeAgent model call failed: %s", e)

        if tool_ctx:
            await call_tool("python.run", {"code": "print('Analysis complete: 3 charts generated')"},
                           tool_ctx.session, tool_ctx.run_id, tool_ctx.task_id, tool_ctx.agent_id)
            logs.append({"step": "execute", "detail": "python.run => success"})
            await call_tool("file.write", {"path": "charts/summary.txt", "content": "Charts: trend, distribution, comparison"},
                           tool_ctx.session, tool_ctx.run_id, tool_ctx.task_id, tool_ctx.agent_id)
            logs.append({"step": "write_output", "detail": "file.write => success"})
        else:
            await asyncio.sleep(0.4)

        mock = MOCK_OUTPUT["code_agent"]
        logs.extend([
            {"step": "parse", "detail": "解析输入数据"},
            {"step": "execute", "detail": "运行分析脚本"},
            {"step": "output", "detail": "生成 3 张图表"},
        ])
        return AgentResult.ok(summary=mock["summary"], output=mock["output"],
                              result=mock["result"], logs=logs, confidence=0.95)


class MockCriticAgent(BaseAgent):
    def __init__(self):
        super().__init__("critic_agent", "rule")

    async def execute(
        self, task_title: str, task_description: str, context: str = "",
        tool_ctx: ToolContext | None = None, model_ctx: ModelContext | None = None,
    ) -> AgentResult:
        logs = []
        if model_ctx:
            try:
                await call_model(
                    prompt=f"质量审查：{task_title}\n{task_description}",
                    provider_name=model_ctx.provider,
                    model_name=model_ctx.model_name,
                    temperature=model_ctx.temperature,
                    session=model_ctx.session,
                    run_id=model_ctx.run_id,
                    task_id=model_ctx.task_id,
                    agent_id=model_ctx.agent_id,
                    system_prompt="你是一个质量审查专家。",
                )
                logs.append({"step": "review", "detail": f"model({model_ctx.provider}) => 完成审查分析"})
            except Exception as e:
                logger.warning("MockCriticAgent model call failed: %s", e)

        if tool_ctx:
            await call_tool("mock_api.call", {"endpoint": "system_health"},
                           tool_ctx.session, tool_ctx.run_id, tool_ctx.task_id, tool_ctx.agent_id)
            logs.append({"step": "check_health", "detail": "mock_api.call => success"})
        else:
            await asyncio.sleep(0.2)

        mock = MOCK_OUTPUT["critic_agent"]
        logs.extend([
            {"step": "check_completeness", "detail": "数据完整性 98%"},
            {"step": "check_consistency", "detail": "数据一致性 95%"},
            {"step": "check_accuracy", "detail": "准确性验证通过"},
        ])
        return AgentResult.ok(summary=mock["summary"], output=mock["output"],
                              result=mock["result"], logs=logs, confidence=0.95)


class MockWriterAgent(BaseAgent):
    def __init__(self):
        super().__init__("writer_agent", "mock")

    async def execute(
        self, task_title: str, task_description: str, context: str = "",
        tool_ctx: ToolContext | None = None, model_ctx: ModelContext | None = None,
    ) -> AgentResult:
        logs = []
        mock = MOCK_OUTPUT["writer_agent"]
        report = mock["output"]

        if model_ctx:
            try:
                await call_model(
                    prompt=f"撰写报告：{task_title}\n{task_description}\n\n{report}",
                    provider_name=model_ctx.provider,
                    model_name=model_ctx.model_name,
                    temperature=model_ctx.temperature,
                    session=model_ctx.session,
                    run_id=model_ctx.run_id,
                    task_id=model_ctx.task_id,
                    agent_id=model_ctx.agent_id,
                    system_prompt="你是一个报告撰写专家。",
                )
                logs.append({"step": "draft_report", "detail": f"model({model_ctx.provider}) => 完成报告草稿"})
            except Exception as e:
                logger.warning("MockWriterAgent model call failed: %s", e)

        if tool_ctx:
            await call_tool("markdown.write", {"filename": "analysis_report.md", "content": report},
                           tool_ctx.session, tool_ctx.run_id, tool_ctx.task_id, tool_ctx.agent_id)
            logs.append({"step": "write_report", "detail": "markdown.write => success"})
        else:
            await asyncio.sleep(0.3)

        logs.extend([
            {"step": "collect", "detail": "收集所有任务结果"},
            {"step": "draft", "detail": "生成报告草稿"},
            {"step": "finalize", "detail": "报告定稿"},
        ])
        return AgentResult.ok(summary=mock["summary"], output=report,
                              result=mock["result"], logs=logs, confidence=0.85)


class MockPlannerAgent(BaseAgent):
    def __init__(self):
        super().__init__("planner_agent", "llm")

    async def execute(
        self, task_title: str, task_description: str, context: str = "",
        tool_ctx: ToolContext | None = None, model_ctx: ModelContext | None = None,
    ) -> AgentResult:
        return AgentResult.fail(
            summary="planner_agent 不执行普通任务，仅用于目标拆解。",
            output="planner_agent 不执行普通任务，仅用于目标拆解。",
        )
