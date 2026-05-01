import httpx

ALLOWED_METHODS = {"GET", "POST"}
TIMEOUT_SECONDS = 15


async def http_request(input_data: dict) -> dict:
    url = input_data.get("url", "")
    method = (input_data.get("method", "GET") or "GET").upper()
    headers = input_data.get("headers") or {}
    body = input_data.get("body")
    if not url:
        return {"status": "failed", "output": None, "error": "缺少 url 参数"}
    if method not in ALLOWED_METHODS:
        return {"status": "failed", "output": None, "error": f"不支持的方法: {method}，仅允许 GET/POST"}
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS, follow_redirects=True) as client:
            if method == "GET":
                resp = await client.get(url, headers=headers)
            else:
                resp = await client.post(url, headers=headers, content=body)
            body_text = resp.text[:5000]
            return {
                "status": "success",
                "output": {
                    "status_code": resp.status_code,
                    "headers": dict(resp.headers),
                    "body": body_text,
                },
                "error": None,
            }
    except httpx.TimeoutException:
        return {"status": "failed", "output": None, "error": f"请求超时（{TIMEOUT_SECONDS}秒）"}
    except Exception as e:
        return {"status": "failed", "output": None, "error": str(e)}
