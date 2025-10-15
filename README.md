# B201 Lab Web Printer
An online printing sevices from B201 Telematics and Smart Multimedia Laboratory of Computer Engineering Institut Teknologi Sepuluh Nopember

## Functions
- Print your pdf in colored or monochrome!
- Merge or Split your pdf!

## Tech Stack
- **Backend:** Python with FastAPI
- **Frontend:** ~~HTML / CSS / JavaScript~~
- **PDF Handling:** PyPDF
- **Printing:** CUPS (on Raspberry Pi)

## Installation
1. Clone this repository
2. Create a virtual environment (recommended)
```bash
# On Windows
python -m venv venv
.\venv\Scripts\activate

# On Linux/Mac
python3 -m venv venv
source venv/bin/activate
```
3. install depedencies
```bash
pip install -r requirements.txt
```
4. create a folder to store uploaded file and processed file
```bash
mkdir upload processed
```
5. Connect the Raspberry Pi to the printer \
**IMPORTANT**: Make sure to have CUPS installed in Raspberry Pi and your printer is connected to the Raspberry Pi via USB
6. Start the FastAPI server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
## Team Members
- Bintang Narindra (backend)
- Ernita Kartika Weni (frontend)
- Andriy Shevtian (frontend)
