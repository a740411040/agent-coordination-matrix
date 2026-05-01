import json
import logging
import re
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Agent, ModelCall, CallStatus
from app.llm.router import call_model

logger = logging.getLogger(__name__)

PLANNER_SYSTEM_PROMPT = """你是一个任务规划专家。你的职责是将用户的高层目标拆解为可执行的任务列表。

你需要：
1. 分析用户目标，识别关键步骤
2. 为每个步骤分配最合适的 Agent
3. 定义任务之间的依赖关系
4. 保持任务数量在 3-8 个之间

输出必须是严格的 JSON 格式，不要包含任何其他文字。"""

PLANNER_USER_TEMPLATE = """请根据以下信息，将目标拆解为可执行任务。

## 用户目标
{goal}

## 可用 Agent（只能使用以下 Agent ID）
{agent_list}

## 可用工具
{tool_list}

## 输出格式要求
严格输出以下 JSON 格式，不要包含其他文字：
```json
{{
  "tasks": [
    {{
      "title": "任务标题",
      "description": "任务详细描述",
      "assigned_agent_id": "agent 的 ID（必须是上面列出的 ID 之一）",
      "dependencies": [],
      "expected_output": "期望输出描述",
      "risk_level": "low|medium|high"
    }}
  ]
}}
```

注意：
- task 数量必须在 3-8 个之间
- dependencies 中填入前置任务的索引（从 0 开始）
- assigned_agent_id 必须是上面列出的 Agent ID 之一
- 合理分配任务，确保有数据收集、分析、审查、报告等步骤"""


@dataclass
class LLMPlannedTask:
    title: str
    description: str
    assigned_agent_id: str
    dependencies: list[int]
    expected_output: str
    risk_level: str


def _format_agent_list(agents: list[Agent]) -> str:
    lines = []
    for a in agents:
        tools = a.tools if a.tools else []
        tool_str = f"，可用工具：{', '.join(tools)}" if tools else ""
        lines.append(f"- ID: {a.id} | 名称: {a.name} | 角色: {a.role}{tool_str}")
    return "\n".join(lines)


def _format_tool_list(agents: list[Agent]) -> str:
    all_tools: set[str] = set()
    for a in agents:
        if a.tools:
            all_tools.update(a.tools)
    return "\n".join(f"- {t}" for t in sorted(all_tools)) or "无可用工具"


def _extract_json(text: str) -> dict | None:
    pattern = r"```json\s*([\s\S]*?)\s*```"
    match = re.search(pattern, text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    pattern2 = r"\{[\s\S]*\"tasks\"[\s\S]*\}"
    match2 = re.search(pattern2, text)
    if match2:
        try:
            return json.loads(match2.group(0))
        except json.JSONDecodeError:
            pass

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


def _validate_and_convert(
    data: dict,
    agents_by_id: dict[str, Agent],
) -> list[LLMPlannedTask] | None:
    raw_tasks = data.get("tasks")
    if not isinstance(raw_tasks, list):
        return None

    if not (3 <= len(raw_tasks) <= 8):
        logger.warning("Planner 输出任务数量 %d 不在 3-8 范围内", len(raw_tasks))
        return None

    result: list[LLMPlannedTask] = []
    for i, t in enumerate(raw_tasks):
        if not isinstance(t, dict):
            return None

        title = t.get("title", "").strip()
        description = t.get("description", "").strip()
        agent_id = t.get("assigned_agent_id", "").strip()
        expected_output = t.get("expected_output", "").strip()
        risk_level = t.get("risk_level", "low").strip()
        deps = t.get("dependencies", [])

        if not title or not description:
            return None

        if agent_id not in agents_by_id:
            logger.warning("Planner 输出的 agent_id '%s' 不在可用列表中", agent_id)
            return None

        if not isinstance(deps, list):
            deps = []
        deps = [d for d in deps if isinstance(d, int) and 0 <= d < i]

        if risk_level not in ("low", "medium", "high"):
            risk_level = "low"

        result.append(LLMPlannedTask(
            title=title,
            description=description,
            assigned_agent_id=agent_id,
            dependencies=deps,
            expected_output=expected_output or "无",
            risk_level=risk_level,
        ))

    return result


async def llm_plan(
    goal: str,
    agents: list[Agent],
    session: AsyncSession,
    run_id: str,
    planner_agent_id: str,
    provider: str = "mock",
    model_name: str = "default",
    temperature: float = 0.3,
) -> list[LLMPlannedTask] | None:
    agents_by_id = {a.id: a for a in agents}
    agent_list_str = _format_agent_list(agents)
    tool_list_str = _format_tool_list(agents)

    user_prompt = PLANNER_USER_TEMPLATE.format(
        goal=goal,
        agent_list=agent_list_str,
        tool_list=tool_list_str,
    )

    try:
        result = await call_model(
            prompt=user_prompt,
            provider_name=provider,
            model_name=model_name,
            temperature=temperature,
            session=session,
            run_id=run_id,
            task_id="",
            agent_id=planner_agent_id,
            system_prompt=PLANNER_SYSTEM_PROMPT,
        )
    except Exception as e:
        logger.exception("LLM planner call failed: %s", e)
        return None

    if not result.content:
        logger.warning("LLM planner 返回空内容")
        return None

    parsed = _extract_json(result.content)
    if not parsed:
        logger.warning("LLM planner 返回的内容无法解析为 JSON: %s", result.content[:200])
        return None

    tasks = _validate_and_convert(parsed, agents_by_id)
    if not tasks:
        logger.warning("LLM planner 输出验证失败")
        return None

    logger.info("LLM planner 成功生成 %d 个任务", len(tasks))
    return tasks
