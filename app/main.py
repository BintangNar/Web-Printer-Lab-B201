from fastapi import FastAPI
from app.routes.upload import router as upload_router
from app.routes.queue import router as queue_router

app = FastAPI()

app.include_router(upload_router)
app.include_router(queue_router)

@app.get("/")
async def root():
    return {"message": "Ini percobaan"}
