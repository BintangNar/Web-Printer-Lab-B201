from pathlib import Path
import pypdf

base_path = Path(__file__).resolve().parent.parent.parent
processed_dir = base_path/"processed"
processed_dir.mkdir(exist_ok=True)

def PDFmerge(pdfs: list[Path], output_name: str= "merged.pdf"):
    writer = pypdf.PdfWriter()

    for pdf in pdfs:
        reader = pypdf.PdfReader(pdf)
        for page in reader.pages:
            writer.add_page(page)

    output_path = processed_dir /output_name

    with open(output_path, 'wb') as f:
        writer.write(f)

    return output_path


def PDFsplit(pdf: Path, ranges: str):
    reader = pypdf.PdfReader(pdf)
    outputs = []

    # Parse ranges string into list of (start, end) tuples
    range_pairs = []
    for part in ranges.split(","):
        if "-" in part:
            start, end = map(int, part.split("-"))
        else:
            start = end = int(part)
        range_pairs.append((start, end))

    # Split PDF based on given ranges
    for i, (start, end) in enumerate(range_pairs):
        writer = pypdf.PdfWriter()
        output_pdf = processed_dir / f"{pdf.stem}_part{i+1}.pdf"

        # pypdf uses zero-based indexing for pages
        for page_num in range(start - 1, end):
            writer.add_page(reader.pages[page_num])

        with open(output_pdf, "wb") as f:
            writer.write(f)

        outputs.append(output_pdf)

    return outputs
