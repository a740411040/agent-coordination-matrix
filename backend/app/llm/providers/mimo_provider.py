import httpx
import logging

from app.config import settings
from app.llm.base import BaseProvider, ModelResponse, ModelUsage

logger = logging.getLogger(__name__)

MIMO_TIMEOUT = 60


class MiMoProvider(BaseProvider):
    provider_name = "mimo"

    async def generate(
        self,
        prompt: str,
        model_name: str,
        temperature: float,
        system_prompt: str = "",
    ) -> ModelResponse:
        api_key = settings.MIMO_API_KEY
        base_url = settings.MIMO_BASE_URL

        if not api_key or not base_url:
            raise ValueError(
                "MiMo API 配置缺失。请设置 MIMO_API_KEY 和 MIMO_BASE_URL 环境变量。"
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

        async with httpx.AsyncClient(timeout=MIMO_TIMEOUT) as client:
            # TODO: MiMo API 的实际端点可能不同，这里先按 OpenAI-compatible 格式实现
            # 如果 MiMo 的接口路径不是 /v1/chat/completions，需要修改
            url = f"{base_url.rstrip('/')}/chat/completions"
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
