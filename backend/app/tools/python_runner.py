import asyncio
import tempfile
import os

TIMEOUT_SECONDS = 10


async def python_run(input_data: dict) -> dict:
    code = input_data.get("code", "")
    timeout = input_data.get("timeout", TIMEOUT_SECONDS)
    if not code:
        return {"status": "failed", "output": None, "error": "缺少 code 参数"}
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".py", delete=False, encoding="utf-8"
        ) as f:
            f.write(code)
            tmp_path = f.name
        try:
            proc = await asyncio.create_subprocess_exec(
                "python", tmp_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            try:
                stdout, stderr = await asyncio.wait_for(
                    proc.communicate(), timeout=timeout
                )
            except asyncio.TimeoutError:
                proc.kill()
                return {
                    "status": "failed",
                    "output": None,
                    "error": f"执行超时（{timeout}秒）",
                }
            stdout_text = stdout.decode("utf-8", errors="replace")[:5000]
            stderr_text = stderr.decode("utf-8", errors="replace")[:2000]
            if proc.returncode != 0:
                return {
                    "status": "failed",
                    "output": {"stdout": stdout_text, "stderr": stderr_text, "returncode": proc.returncode},
                    "error": f"进程退出码 {proc.returncode}",
                }
            return {
                "status": "success",
                "output": {"stdout": stdout_text, "stderr": stderr_text, "returncode": 0},
                "error": None,
            }
        finally:
            os.unlink(tmp_path)
    except Exception as e:
        return {"status": "failed", "output": None, "error": str(e)}
