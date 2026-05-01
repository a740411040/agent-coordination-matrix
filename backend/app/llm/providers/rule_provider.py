from app.llm.base import BaseProvider, ModelResponse, ModelUsage


RULE_RESPONSES = {
    "quality": "质量审查通过：完整性 98%，一致性 95%，无异常。",
    "review": "审核结果：合格。所有指标在正常范围内。",
}


class RuleProvider(BaseProvider):
    provider_name = "rule"

    async def generate(
        self,
        prompt: str,
        model_name: str,
        temperature: float,
        system_prompt: str = "",
    ) -> ModelResponse:
        prompt_lower = prompt.lower()
        content = "规则引擎：输入已处理。"
        for key, resp in RULE_RESPONSES.items():
            if key in prompt_lower:
                content = resp
                break
        return ModelResponse(
            content=content,
            parsed=None,
            usage=ModelUsage(input_tokens=len(prompt.split()), output_tokens=len(content.split())),
            raw={"provider": "rule", "model": model_name},
        )
