from pathlib import Path
from datetime import datetime, timezone

WORKSPACE = Path(__file__).resolve().parent.parent.parent / "outputs"
WORKSPACE.mkdir(parents=True, exist_ok=True)


async def markdown_write(input_data: dict) -> dict:
    filename = input_data.get("filename", "")
    content = input_data.get("content", "")
    if not filename:
        filename = f"report_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.md"
    if not filename.endswith(".md"):
        filename += ".md"
    if not content:
        return {"status": "failed", "output": None, "error": "缺少 content 参数"}
    try:
        target = (WORKSPACE / filename).resolve()
        if not str(target).startswith(str(WORKSPACE.resolve())):
            return {"status": "failed", "output": None, "error": f"路径越界: {filename}"}
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        return {
            "status": "success",
            "output": {"filename": filename, "bytes_written": len(content.encode("utf-8"))},
            "error": None,
        }
    except Exception as e:
        return {"status": "failed", "output": None, "error": str(e)}
