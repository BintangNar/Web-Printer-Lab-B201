from pathlib import Path
from fastapi.responses import JSONResponse
import subprocess

def print_pdf(file_path: str, copies: int = 1, color: bool = True):
    try:
        cmd = [
            "lp",
            "-d", "MyPrinter",
            "-n", str(copies),
            file_path
        ]
        subprocess.run(cmd, check=True)
        return {"status": "success", "message": "File sent to printer"}
    except subprocess.CalledProcessError as e:
        return {"status": "error", "message": str(e)}

