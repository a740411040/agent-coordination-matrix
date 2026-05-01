import asyncio

from app.llm.base import BaseProvider, ModelResponse, ModelUsage


MOCK_REPLIES = {
    "data": "根据分析，数据包含 1250 条记录，3 个字段。建议关注 Q3 的增长趋势。",
    "code": "代码执行完成。生成了趋势图、分布图和对比图共 3 张图表。",
    "critic": "审查通过：数据完整性 98%，一致性 95%，准确性达标。",
    "report": "# 分析报告\n\n## 摘要\n本次分析覆盖 1250 条记录。\n\n## 关键发现\n- Q3 增速最快\n- 整体呈上升趋势",
}


class MockProvider(BaseProvider):
    provider_name = "mock"

    async def generate(
        self,
        prompt: str,
        model_name: str,
        temperature: float,
        system_prompt: str = "",
    ) -> ModelResponse:
        await asyncio.sleep(0.1)
        prompt_lower = prompt.lower()
        content = MOCK_REPLIES.get("data")
        for key, reply in MOCK_REPLIES.items():
            if key in prompt_lower:
                content = reply
                break
        return ModelResponse(
            content=content,
            parsed=None,
            usage=ModelUsage(input_tokens=len(prompt.split()), output_tokens=len(content.split())),
            raw={"provider": "mock", "model": model_name, "temperature": temperature},
        )
