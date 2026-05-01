import random
from datetime import datetime, timezone


MOCK_DATA = {
    "user_stats": {
        "total_users": 12580,
        "active_today": 3421,
        "new_this_week": 487,
        "churn_rate": 0.032,
    },
    "sales_summary": {
        "revenue": 1_250_000,
        "orders": 8432,
        "avg_order_value": 148.2,
        "top_category": "电子产品",
    },
    "system_health": {
        "cpu_usage": 42.3,
        "memory_usage": 67.8,
        "disk_usage": 55.1,
        "uptime_hours": 1872,
    },
}


async def mock_api_call(input_data: dict) -> dict:
    endpoint = input_data.get("endpoint", "")
    if not endpoint:
        return {"status": "failed", "output": None, "error": "缺少 endpoint 参数"}
    endpoint_clean = endpoint.strip("/").lower()
    if endpoint_clean in MOCK_DATA:
        data = MOCK_DATA[endpoint_clean]
    else:
        data = {
            "endpoint": endpoint,
            "message": "模拟 API 响应",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "random_value": round(random.uniform(0, 100), 2),
        }
    return {
        "status": "success",
        "output": data,
        "error": None,
    }
