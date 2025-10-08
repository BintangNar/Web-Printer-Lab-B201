from fastapi import APIRouter, UploadFile, File, Query
from fastapi.responses import JSONResponse
import shutil
from pathlib import Path
from app.utils.print import print_pdf
from app.utils import pdfprocessing

router = APIRouter()

dirUPLOAD = Path("upload")
dirUPLOAD.mkdir(exist_ok=True)

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
async def print_file(filename:str = Query(...)):
    try:
        file_path = dirUPLOAD /filename
        if not file_path.exists():
            return JSONResponse(status_code=404, content={"message": "file not found"})
        
        result = print_pdf(str(file_path),copies=1, color=True)
        return {"filename": filename, "actions":{"print":result}}
    except Exception as e:
        return JSONResponse(status_code=500, content={"message":str(e)})
    
#merge
@router.post("/mergeFile")
async def merge(files: list[str] = Query(...)):
    try:
        output = pdfprocessing.PDFmerge(files)
        return {"merged_file": Path(output).name, "Path":f"/upload/{Path(output).name}"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"message":str(e)})

#split
@router.post("/splitFile")
async def split(filename: str = Query(...), start_page: int = Query(...), end_page: int = Query(...)):
    try:
        output = pdfprocessing.PDFsplit(filename, start_page, end_page)
        return {"split_file": Path(output).name, "path":f"/upload/{Path(output).name}"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"message":str(e)})