import threading
import time 
from collections import deque
from pathlib import Path
from app.utils.print import print_pdf

class PrintJob:
    def __init__(self, job_id, file_path, copies = 1, color = True, pages = None):
        self.job_id = job_id
        self.file_path = Path(file_path)
        self.copies = copies
        self.color = color
        self.pages = pages
        self.status = "queued"

queue = deque()
current_job = None
job_counter = 1
lock = threading.Lock()

def add_job(file_path, copies=1, color= True, pages= None):
    global job_counter
    with lock:
        job = PrintJob(job_counter,file_path, copies, color, pages)
        queue.append(job)
        job_counter += 1
    return job

def get_status():
    with lock:
        queued = [{"job_id": job.job_id, "filename": job.file_path.name, "status": job.status} for job in queue]
    return {"current": current_job.job_id if current_job else None, "queue": queued}

def process_queue():
    global current_job
    while True:
        if queue:
            with lock:
                current_job = queue.popleft()
                current_job.status = "printing"
            result = print_pdf(str(current_job.file_path), current_job.copies, current_job.color)
            current_job.status = "done" if result["status"] == "success" else "error"
            current_job = None
        time.sleep(2)

threading.Thread(target=process_queue, daemon=True).start()