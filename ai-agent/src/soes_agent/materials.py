import base64
import re
from io import BytesIO
from zipfile import BadZipFile

from docx import Document
from docx.opc.exceptions import PackageNotFoundError
from docx.table import Table
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from .contracts import StudyMaterial
from .practice_evidence import is_table_of_contents_entry

MAX_TEXT_CHARS = 20_000
MAX_EXTRACTED_CHARS = 4_000_000
CHUNK_CHARS = 2_400
CHAPTER_HEADING = re.compile(r"(?im)^[ \t]*(?:\[Trang \d+\][ \t]*)?chương[ \t]+(\d+)\b")
SECTION_HEADING = re.compile(r"(?im)^[ \t]*(?:\[Trang \d+\][ \t]*)?(?:mục[ \t]+)?(\d+(?:\.\d+){1,3})\.?[ \t]+[^\n]{3,100}$")
PAGE_MARKER = re.compile(r"\[Trang (\d+)\]")


class MaterialTextTooLarge(Exception):
    pass


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
            text_size = 0
            for index, page in enumerate(reader.pages, 1):
                page_text = (page.extract_text() or "").strip()
                if page_text:
                    pages.append(f"[Trang {index}] {page_text}")
                    text_size += len(page_text)
                    if text_size > MAX_EXTRACTED_CHARS:
                        raise MaterialTextTooLarge
            text = "\n".join(pages)
        else:
            if not raw.startswith(b"PK"):
                raise ValueError("Invalid DOCX")
            document = Document(BytesIO(raw))
            blocks = []
            text_size = 0
            for block in document.iter_inner_content():
                if isinstance(block, Table):
                    lines = [" | ".join(cell.text for cell in row.cells) for row in block.rows]
                else:
                    lines = [block.text]
                blocks.extend(lines)
                text_size += sum(map(len, lines))
                if text_size > MAX_EXTRACTED_CHARS:
                    raise MaterialTextTooLarge
            text = "\n".join(blocks)
    except MaterialTextTooLarge as exc:
        raise ValueError("Material text exceeds the size limit") from exc
    except (ValueError, UnicodeError, OSError, KeyError, PdfReadError, BadZipFile, PackageNotFoundError) as exc:
        raise ValueError("Material cannot be read") from exc
    text = text.strip()
    if not text:
        raise ValueError("Material has no readable text")
    if len(text) > MAX_EXTRACTED_CHARS:
        raise ValueError("Material text exceeds the size limit")
    return text


def source_location(text: str, quote: str, mime_type: str) -> str | None:
    """Locate a literal citation in extracted text; never infer a page from the model."""
    words = quote.split()
    if not words:
        return None

    def source_line(position: int) -> str:
        start = text.rfind("\n", 0, position) + 1
        end = text.find("\n", position)
        return text[start:end if end != -1 else len(text)]

    match = next((candidate for candidate in re.finditer(r"\s+".join(map(re.escape, words)), text)
                  if not is_table_of_contents_entry(source_line(candidate.start()))), None)
    if not match:
        return None
    before = text[:match.start()]
    chapter = [item for item in CHAPTER_HEADING.finditer(before)
               if not is_table_of_contents_entry(source_line(item.start()))]
    sections = [item for item in SECTION_HEADING.finditer(before)
                if not is_table_of_contents_entry(source_line(item.start()))]
    labels = []
    if chapter:
        labels.append(f"Chương {chapter[-1].group(1)}")
    if sections and (not chapter or sections[-1].start() > chapter[-1].start()):
        labels.append(f"Mục {sections[-1].group(1)}")
    if mime_type == "application/pdf":
        pages = list(PAGE_MARKER.finditer(before))
        if pages:
            labels.append(f"Trang {pages[-1].group(1)}")
    return " · ".join(labels) or None


def select_material_excerpt(text: str, query: str) -> str:
    if len(text) <= MAX_TEXT_CHARS:
        return text

    chapter_groups = re.findall(r"chương\s+(\d+(?:\s*(?:,|và)\s*\d+)*)", query.casefold())
    requested = list(dict.fromkeys(number for group in chapter_groups for number in re.findall(r"\d+", group)))
    headings = list(CHAPTER_HEADING.finditer(text))
    sections = []
    for chapter in requested:
        matches = [text[heading.start():headings[index + 1].start() if index + 1 < len(headings) else len(text)]
                   for index, heading in enumerate(headings) if heading.group(1) == chapter]
        if matches:
            sections.append(max(matches, key=len))
    if sections:
        budget = MAX_TEXT_CHARS // len(sections) - 20
        return "\n[...]\n".join(_sample_section(section, budget) for section in sections)[:MAX_TEXT_CHARS]

    terms = {word for word in re.findall(r"\w{4,}", query.casefold())
             if word not in {"chương", "muốn", "cần", "luyện", "phần", "trong", "những", "giúp"}}
    chunks = [text[start:start + CHUNK_CHARS] for start in range(0, len(text), CHUNK_CHARS)]
    scored = sorted(range(len(chunks)), key=lambda index: (
        -sum(term in chunks[index].casefold() for term in terms), index))
    chosen = sorted(scored[:MAX_TEXT_CHARS // (CHUNK_CHARS + 8)])
    return "\n[...]\n".join(chunks[index] for index in chosen)[:MAX_TEXT_CHARS]


def _sample_section(section: str, budget: int) -> str:
    if len(section) <= budget:
        return section
    window = budget // 4
    starts = [round(index * (len(section) - window) / 3) for index in range(4)]
    return "\n[...]\n".join(section[start:start + window - 8] for start in starts)
