from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from app.routes.upload import router as upload_router
from app.routes.queue import router as queue_router

app = FastAPI()

app.include_router(upload_router)
app.include_router(queue_router)

frontend_dir = Path(__file__).resolve().parent.parent / "static"

app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

@app.get("/")
async def serve_frontend():
    index_path = frontend_dir / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"message": "Frontend not found"}
