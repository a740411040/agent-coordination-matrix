import httpx
import logging

from app.config import settings
from app.llm.base import BaseProvider, ModelResponse, ModelUsage

logger = logging.getLogger(__name__)

OPENAI_TIMEOUT = 60


class OpenAICompatibleProvider(BaseProvider):
    provider_name = "openai_compatible"

    async def generate(
        self,
        prompt: str,
        model_name: str,
        temperature: float,
        system_prompt: str = "",
    ) -> ModelResponse:
        api_key = settings.OPENAI_API_KEY
        base_url = settings.OPENAI_BASE_URL

        if not api_key:
            raise ValueError(
                "OpenAI API Key 缺失。请设置 OPENAI_API_KEY 环境变量。"
            )

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        body = {
            "model": model_name,
            "messages": messages,
            "temperature": temperature,
        }

        url = f"{base_url.rstrip('/')}/chat/completions"

        async with httpx.AsyncClient(timeout=OPENAI_TIMEOUT) as client:
            resp = await client.post(url, json=body, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        choice = data.get("choices", [{}])[0]
        content = choice.get("message", {}).get("content", "")
        usage_data = data.get("usage", {})

        return ModelResponse(
            content=content,
            parsed=None,
            usage=ModelUsage(
                input_tokens=usage_data.get("prompt_tokens", 0),
                output_tokens=usage_data.get("completion_tokens", 0),
            ),
            raw=data,
        )
