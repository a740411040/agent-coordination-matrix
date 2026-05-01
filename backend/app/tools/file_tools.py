import os
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent.parent / "outputs"
WORKSPACE.mkdir(parents=True, exist_ok=True)


def _safe_path(path: str) -> Path:
    target = (WORKSPACE / path).resolve()
    if not str(target).startswith(str(WORKSPACE.resolve())):
        raise ValueError(f"路径越界: {path}")
    return target


async def file_read(input_data: dict) -> dict:
    path = input_data.get("path", "")
    if not path:
        return {"status": "failed", "output": None, "error": "缺少 path 参数"}
    try:
        target = _safe_path(path)
        if not target.exists():
            return {"status": "failed", "output": None, "error": f"文件不存在: {path}"}
        content = target.read_text(encoding="utf-8", errors="replace")
        size = target.stat().st_size
        return {
            "status": "success",
            "output": {"path": path, "content": content[:10000], "size": size},
            "error": None,
        }
    except Exception as e:
        return {"status": "failed", "output": None, "error": str(e)}


async def file_write(input_data: dict) -> dict:
    path = input_data.get("path", "")
    content = input_data.get("content", "")
    if not path:
        return {"status": "failed", "output": None, "error": "缺少 path 参数"}
    try:
        target = _safe_path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        return {
            "status": "success",
            "output": {"path": path, "bytes_written": len(content.encode("utf-8"))},
            "error": None,
        }
    except Exception as e:
        return {"status": "failed", "output": None, "error": str(e)}
