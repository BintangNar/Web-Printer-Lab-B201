from fastapi import APIRouter, UploadFile, File, Query
from fastapi.responses import JSONResponse, FileResponse
import shutil
from pathlib import Path
from app.utils.print import print_pdf
from app.utils import pdfprocessing

router = APIRouter()

dirUPLOAD = Path("upload")
dirUPLOAD.mkdir(exist_ok=True)
processed_dir = Path("processed")
processed_dir.mkdir(exist_ok=True)

#upload
@router.post("/uploadFile")
async def upload_file(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith(".pdf"):
            return JSONResponse(status_code=400, content={"message": "only files in pdf format allowed"})
        
        safe_name = Path(file.filename).name
        file_path = dirUPLOAD / safe_name

        with open(file_path,"wb") as saved_file :
            shutil.copyfileobj(file.file, saved_file)
        return {"filename": safe_name, "path": f"/upload/{safe_name}"}
    
    except Exception as e:
        return JSONResponse(status_code=500, content={"message":str(e)})

#print    
@router.post("/printFile")
async def print_file(
    filename: str = Query(...),
    copies: int = Query(1),
    color: bool = Query(True),
    pages: str = Query(None)
):
    try:
        file_path = dirUPLOAD / filename
        if not file_path.exists():
            return JSONResponse(status_code=404, content={"message": "File not found"})

        pages = pages or ""

        print(f"📄 Simulated print: {file_path.name}, Copies: {copies}, Color: {color}, Pages: {pages}")

        result = {"status": "queued", "message": "Print job added to queue"}

        return {"filename": filename, "actions": {"print": result}}

    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})

    
#merge
@router.post("/mergeFile")
async def merge(data: dict):
    try:
        files = data.get("files", [])
        pdf_paths = [dirUPLOAD / f for f in files]

        output_path = pdfprocessing.PDFmerge(pdf_paths, "merged.pdf")

        return {
            "merged_file": str(output_path),
            "download_url": f"/download/{output_path.name}"
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"message": str(e)})
    
#split
@router.post("/splitFile")
async def split_file(filename: str = Query(...), ranges: str = Query(...)):
    try:
        file_path = dirUPLOAD / filename
        if not file_path.exists():
            return JSONResponse(status_code=404, content={"message": "file not found"})

        outputs = pdfprocessing.PDFsplit(file_path, ranges)
        download_urls = [f"/download/{Path(o).name}" for o in outputs]

        return {
            "split_files": [o.name for o in outputs],
            "download_urls": download_urls
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})

#download
@router.get("/download/{filename}")
async def download_file(filename: str):
    file_path = processed_dir / filename
    if not file_path.exists():  # <-- corrected
        return JSONResponse(status_code=404, content={"message":"file not found"})
    return FileResponse(file_path, filename=filename)