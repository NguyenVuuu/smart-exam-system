import base64
from io import BytesIO
from zipfile import BadZipFile

from docx import Document
from docx.opc.exceptions import PackageNotFoundError
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from .contracts import StudyMaterial

MAX_TEXT_CHARS = 20_000


def extract_material(material: StudyMaterial) -> str:
    try:
        raw = base64.b64decode(material.contentBase64, validate=True)
        if not raw or len(raw) > 3 * 1024 * 1024:
            raise ValueError("Material size is unsupported")
        if material.mimeType == "text/plain":
            text = raw.decode("utf-8-sig")
        elif material.mimeType == "application/pdf":
            if not raw.startswith(b"%PDF-"):
                raise ValueError("Invalid PDF")
            reader = PdfReader(BytesIO(raw), strict=True)
            if reader.is_encrypted:
                raise ValueError("Encrypted PDF")
            pages = []
            for index, page in enumerate(reader.pages, 1):
                if index > 40:
                    break
                page_text = (page.extract_text() or "").strip()
                if page_text:
                    pages.append(f"[Trang {index}] {page_text}")
            text = "\n".join(pages)
        else:
            if not raw.startswith(b"PK"):
                raise ValueError("Invalid DOCX")
            document = Document(BytesIO(raw))
            text = "\n".join(paragraph.text for paragraph in document.paragraphs)
    except (ValueError, UnicodeError, OSError, KeyError, PdfReadError, BadZipFile, PackageNotFoundError) as exc:
        raise ValueError("Material cannot be read") from exc
    text = text.strip()
    if not text:
        raise ValueError("Material has no readable text")
    return text[:MAX_TEXT_CHARS]
