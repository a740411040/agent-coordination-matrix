from fastapi import APIRouter, HTTPException

from app.config import settings
from app.schemas import ProviderStatus

router = APIRouter(prefix="/api/providers", tags=["providers"])

_PROVIDER_DEFINITIONS = [
    {
        "id": "mock",
        "name": "Mock Provider",
        "requires_api_key": False,
        "description": "Local mock provider for demo mode — always available, returns simulated responses",
    },
    {
        "id": "rule",
        "name": "Rule Provider",
        "requires_api_key": False,
        "description": "Rule-based provider — pattern-matching responses, no external API needed",
    },
    {
        "id": "mimo",
        "name": "MiMo",
        "requires_api_key": True,
        "description": "MiMo OpenAI-compatible provider — requires MIMO_API_KEY and MIMO_BASE_URL",
    },
    {
        "id": "openai_compatible",
        "name": "OpenAI Compatible",
        "requires_api_key": True,
        "description": "Any OpenAI-compatible API (OpenAI, DeepSeek, etc.) — requires OPENAI_API_KEY and OPENAI_BASE_URL",
    },
]


def _check_configured(provider_id: str) -> bool:
    if provider_id == "mock":
        return True
    if provider_id == "rule":
        return True
    if provider_id == "mimo":
        return bool(settings.MIMO_API_KEY and settings.MIMO_BASE_URL)
    if provider_id == "openai_compatible":
        return bool(settings.OPENAI_API_KEY and settings.OPENAI_BASE_URL)
    return False


@router.get("", response_model=list[ProviderStatus])
async def list_providers():
    result = []
    for p in _PROVIDER_DEFINITIONS:
        result.append(ProviderStatus(
            id=p["id"],
            name=p["name"],
            configured=_check_configured(p["id"]),
            requires_api_key=p["requires_api_key"],
            description=p["description"],
        ))
    return result


@router.post("/{provider_id}/test")
async def test_provider(provider_id: str):
    valid_ids = {p["id"] for p in _PROVIDER_DEFINITIONS}
    if provider_id not in valid_ids:
        raise HTTPException(status_code=404, detail=f"Provider '{provider_id}' not found")

    configured = _check_configured(provider_id)
    if configured:
        return {
            "provider": provider_id,
            "configured": True,
            "message": "Provider is configured and ready",
        }
    return {
        "provider": provider_id,
        "configured": False,
        "message": "Provider is not configured — set the required environment variables on the backend",
    }
