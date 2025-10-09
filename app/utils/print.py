from pathlib import Path
import subprocess

import subprocess

def print_pdf(file_path: str, copies: int = 1, color: bool = True, pages: str = None):
    printer_name = "HP_LaserJet"  # Replace with your printer name
    cmd = ["lp", "-d", printer_name, "-n", str(copies)]

    if not color:
        cmd += ["-o", "ColorModel=Gray"]

    if pages:
        cmd += ["-P", pages]

    cmd.append(file_path)

    try:
        subprocess.run(cmd, check=True)
        return "Printed successfully"
    except subprocess.CalledProcessError as e:
        return f"Printing failed: {e}"
