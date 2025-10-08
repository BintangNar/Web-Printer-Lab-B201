from pathlib import Path
import pypdf

def PDFmerge(pdfs: list[Path], output: Path):
    writer = pypdf.PdfWriter()

    for pdf in pdfs:
        reader = pypdf.PdfReader(pdf)
        for page in reader.pages:
            writer.add_page(page)

    with open(output, 'wb') as f:
        writer.write(f)

    return output


def PDFsplit(pdf: Path, split: list[int], output_dir: Path):
    reader = pypdf.PdfReader(pdf)
    start = 0
    end = split[0]

    outputs = []

    for i in range(len(split) + 1):
        writer = pypdf.PdfWriter()
        output_pdf = output_dir / f"{Path(pdf).stem}_part{i+1}.pdf"

        for page in range(start, end):
            writer.add_page(reader.pages[page])

        with open(output_pdf, 'wb') as f:
            writer.write(f)

        outputs.append(output_pdf)

        start = end
        try:
            end = split[i + 1]
        except IndexError:
            end = len(reader.pages)

    return outputs
