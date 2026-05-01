import logging
import time

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ModelCall, CallStatus
from app.llm.base import BaseProvider, ModelResponse
from app.llm.providers.mock_provider import MockProvider
from app.llm.providers.rule_provider import RuleProvider
from app.llm.providers.mimo_provider import MiMoProvider
from app.llm.providers.openai_compatible_provider import OpenAICompatibleProvider

logger = logging.getLogger(__name__)

_PROVIDERS: dict[str, BaseProvider] = {
    "mock": MockProvider(),
    "rule": RuleProvider(),
    "mimo": MiMoProvider(),
    "openai_compatible": OpenAICompatibleProvider(),
}


def get_provider(provider_name: str) -> BaseProvider:
    p = _PROVIDERS.get(provider_name)
    if p is None:
        logger.warning("未知 provider '%s'，回退到 mock", provider_name)
        return _PROVIDERS["mock"]
    return p


async def call_model(
    prompt: str,
    provider_name: str,
    model_name: str,
    temperature: float,
    session: AsyncSession,
    run_id: str,
    task_id: str,
    agent_id: str,
    system_prompt: str = "",
) -> ModelResponse:
    provider = get_provider(provider_name)
    start = time.monotonic()
    error_msg = None

    try:
        result = await provider.generate(
            prompt=prompt,
            model_name=model_name,
            temperature=temperature,
            system_prompt=system_prompt,
        )
        status = CallStatus.success
    except Exception as e:
        logger.exception("Model call failed: provider=%s model=%s", provider_name, model_name)
        error_msg = str(e)
        result = ModelResponse(content="", raw={"error": error_msg})
        status = CallStatus.error

    elapsed_ms = int((time.monotonic() - start) * 1000)

    mc = ModelCall(
        run_id=run_id,
        task_id=task_id,
        agent_id=agent_id,
        provider=provider.provider_name,
        model=model_name,
        input_summary=prompt[:500] if prompt else "",
        output=result.content[:2000] if result.content else "",
        input_tokens=result.usage.input_tokens,
        output_tokens=result.usage.output_tokens,
        status=status,
        error=error_msg,
    )
    session.add(mc)
    await session.flush()
    return result
