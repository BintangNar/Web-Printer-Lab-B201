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


def PDFsplit(pdf: Path, split: list[int]):
    reader = pypdf.PdfReader(pdf)
    outputs = []
    start = 0

    for i, end in enumerate(split + [len(reader.pages)]):
        writer = pypdf.PdfWriter()
        output_pdf = processed_dir / f"{pdf.stem}_part{i+1}.pdf"

        for page in range(start, end):
            writer.add_page(reader.pages[page])

        with open(output_pdf, 'wb') as f:
            writer.write(f)

        outputs.append(output_pdf)
        start = end

    return outputs

