import pytest
import pytest_asyncio
from sqlalchemy import select

from app.models import ModelCall
from app.llm.router import call_model, get_provider
from app.llm.providers.mock_provider import MockProvider


@pytest.mark.asyncio
async def test_get_provider_returns_mock(db_session):
    provider = get_provider("mock")
    assert isinstance(provider, MockProvider)
    assert provider.provider_name == "mock"


@pytest.mark.asyncio
async def test_get_provider_fallback_to_mock(db_session):
    provider = get_provider("nonexistent")
    assert isinstance(provider, MockProvider)


@pytest.mark.asyncio
async def test_mock_provider_generate():
    provider = MockProvider()
    result = await provider.generate(
        prompt="分析数据趋势",
        model_name="default",
        temperature=0.7,
    )
    assert result.content
    assert "数据" in result.content
    assert result.usage.input_tokens > 0
    assert result.usage.output_tokens > 0


@pytest.mark.asyncio
async def test_call_model_records_model_call(db_session, seed_run, seed_agents):
    tasks_result = await db_session.execute(select(ModelCall).where(ModelCall.run_id == seed_run.id))
    before_count = len(list(tasks_result.scalars().all()))

    result = await call_model(
        prompt="分析数据",
        provider_name="mock",
        model_name="default",
        temperature=0.7,
        session=db_session,
        run_id=seed_run.id,
        task_id="test-task-id",
        agent_id=list(seed_agents.values())[0].id,
    )

    assert result.content
    assert "数据" in result.content

    call_result = await db_session.execute(
        select(ModelCall).where(ModelCall.run_id == seed_run.id)
    )
    calls = list(call_result.scalars().all())
    assert len(calls) == before_count + 1

    mc = calls[-1]
    assert mc.provider == "mock"
    assert mc.model == "default"
    assert mc.status.value == "success"
    assert mc.input_summary
    assert mc.output


@pytest.mark.asyncio
async def test_call_model_with_code_prompt(db_session, seed_run, seed_agents):
    result = await call_model(
        prompt="write code script",
        provider_name="mock",
        model_name="default",
        temperature=0.7,
        session=db_session,
        run_id=seed_run.id,
        task_id="test-task-2",
        agent_id=list(seed_agents.values())[0].id,
    )

    assert result.content
    assert result.usage.output_tokens > 0
