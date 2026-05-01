import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Agent, MatrixCell, Run, RunStatus, Task, TaskStatus
from app.utils.time_utils import utc_now_naive

logger = logging.getLogger(__name__)

TASK_SUMMARY_TEMPLATE = """# {goal} — 最终报告

> 自动生成时间：{timestamp}

## 概览

本次执行共包含 {total} 个任务，{completed} 个已完成，{failed} 个失败，{needs_review} 个需要审查。

---

## 任务结果汇总

{task_sections}

---

## 综合分析

{analysis}

---

## 关键指标

{metrics}

---

_本报告由 Composite Visual AI Agent Coordination System 自动生成_
"""


async def collect_task_summaries(session: AsyncSession, run_id: str) -> list[dict]:
    result = await session.execute(
        select(Task).where(Task.run_id == run_id).order_by(Task.created_at)
    )
    tasks = list(result.scalars().all())

    summaries = []
    for task in tasks:
        cell_result = await session.execute(
            select(MatrixCell).where(
                MatrixCell.run_id == run_id,
                MatrixCell.task_id == task.id,
            )
        )
        cell = cell_result.scalar_one_or_none()

        summaries.append({
            "title": task.title,
            "description": task.description or "",
            "status": task.status.value if task.status else "unknown",
            "summary": cell.summary if cell and cell.summary else "",
            "result_preview": (task.result or "")[:500],
            "agent_name": "",
        })

    agent_ids = {t.assigned_agent_id for t in tasks if t.assigned_agent_id}
    agent_names = {}
    if agent_ids:
        agents_result = await session.execute(
            select(Agent).where(Agent.id.in_(list(agent_ids)))
        )
        for agent in agents_result.scalars().all():
            agent_names[agent.id] = agent.name

    for i, task in enumerate(tasks):
        if task.assigned_agent_id and task.assigned_agent_id in agent_names:
            summaries[i]["agent_name"] = agent_names[task.assigned_agent_id]

    return summaries


def generate_template_report(goal: str, summaries: list[dict]) -> str:
    total = len(summaries)
    completed = sum(1 for s in summaries if s["status"] in ("completed", "success"))
    failed = sum(1 for s in summaries if s["status"] == "failed")
    needs_review = sum(1 for s in summaries if s["status"] == "needs_review")

    task_sections = []
    for i, s in enumerate(summaries, 1):
        status_emoji = {
            "completed": "✅",
            "success": "✅",
            "failed": "❌",
            "needs_review": "⚠️",
            "blocked": "🚫",
        }.get(s["status"], "⏳")

        agent_info = f"（Agent: {s['agent_name']}）" if s["agent_name"] else ""
        section = (
            f"### {i}. {status_emoji} {s['title']}{agent_info}\n\n"
            f"**状态**: {s['status']}\n\n"
        )
        if s["summary"]:
            section += f"**摘要**: {s['summary']}\n\n"
        if s["result_preview"]:
            section += f"**结果预览**:\n\n```\n{s['result_preview']}\n```\n\n"
        task_sections.append(section)

    analysis_parts = []
    if completed == total:
        analysis_parts.append("所有任务均已完成，系统运行正常。")
    elif failed > 0:
        analysis_parts.append(f"有 {failed} 个任务执行失败，建议检查失败任务的日志并考虑重试。")
    if needs_review > 0:
        analysis_parts.append(f"有 {needs_review} 个任务需要人工审查，请查看详情面板。")

    analysis = "\n".join(f"- {p}" for p in analysis_parts) if analysis_parts else "- 无特殊分析"

    metrics_lines = []
    for s in summaries:
        if s["status"] in ("completed", "success"):
            metrics_lines.append(f"| {s['title']} | {s['status']} | 通过 |")
        else:
            metrics_lines.append(f"| {s['title']} | {s['status']} | 未通过 |")

    metrics = "| 任务 | 状态 | 审查 |\n|------|------|------|\n" + "\n".join(metrics_lines) if metrics_lines else "无数据"

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    return TASK_SUMMARY_TEMPLATE.format(
        goal=goal,
        timestamp=now,
        total=total,
        completed=completed,
        failed=failed,
        needs_review=needs_review,
        task_sections="\n".join(task_sections),
        analysis=analysis,
        metrics=metrics,
    )


async def synthesize_report(session: AsyncSession, run: Run) -> str:
    logger.info("Synthesizing final report for run %s", run.id)

    run.status = RunStatus.synthesizing
    run.updated_at = utc_now_naive()
    await session.flush()

    summaries = await collect_task_summaries(session, run.id)

    report = generate_template_report(run.goal, summaries)

    run.final_report = report
    run.status = RunStatus.completed
    run.updated_at = utc_now_naive()
    await session.flush()

    logger.info("Final report generated for run %s (%d chars)", run.id, len(report))
    return report
