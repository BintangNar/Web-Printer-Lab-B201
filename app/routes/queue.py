from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from app.utils.print_queue import add_job, get_status

router = APIRouter()

# Endpoint to add a print job
@router.post("/queue/add")
async def add_print_job(
    filename: str = Query(...),
    copies: int = Query(1),
    color: bool = Query(True),
    pages: str = Query(None)
):
    try:
        job = add_job(filename, copies=copies, color=color, pages=pages)
        return {
            "job_id": job.job_id,
            "filename": job.file_path.name,
            "status": job.status
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})

# Endpoint to check current queue status
@router.get("/queue/status")
async def queue_status():
    try:
        return get_status()
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})
