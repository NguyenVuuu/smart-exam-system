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
TOC_PAGE = re.compile(r"(?:\.{3,}|…{2,})\s*(\d{1,4})\s*$")


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

    match = next((candidate for candidate in re.finditer(r"\s+".join(map(re.escape, words)), text)
                  if not is_table_of_contents_entry(_source_line(text, candidate.start()))), None)
    if not match:
        return None
    before = text[:match.start()]
    chapter = [item for item in _body_chapter_headings(text) if item.start() < match.start()]
    labels = []
    pages = list(PAGE_MARKER.finditer(before)) if mime_type == "application/pdf" else []
    toc_pages = _toc_chapter_pages(text) if pages else {}
    body_chapter = chapter[-1] if chapter else None
    chapter_number = body_chapter.group(1) if body_chapter else None
    chapter_start = body_chapter.start() if body_chapter else 0
    if toc_pages and pages:
        page_number = int(pages[-1].group(1))
        chapter_from_page = max(((start, number) for number, start in toc_pages.items()
                                 if start <= page_number), default=None)
        if chapter_from_page:
            page_start = next((page.start() for page in pages
                               if int(page.group(1)) == chapter_from_page[0]), 0)
            if not body_chapter or page_start > chapter_start:
                chapter_number = chapter_from_page[1]
                chapter_start = page_start
    if chapter_number:
        labels.append(f"Chương {chapter_number}")
    sections = [item for item in SECTION_HEADING.finditer(before)
                if item.start() >= chapter_start
                and (not chapter_number or item.group(1).startswith(f"{chapter_number}."))
                and not is_table_of_contents_entry(_source_line(text, item.start()))]
    if sections:
        labels.append(f"Mục {sections[-1].group(1)}")
    if pages:
        labels.append(f"Trang {pages[-1].group(1)}")
    return " · ".join(labels) or None


def select_material_excerpt(text: str, query: str) -> str:
    if len(text) <= MAX_TEXT_CHARS:
        return text

    chapter_groups = re.findall(r"chương\s+(\d+(?:\s*(?:,|và)\s*\d+)*)", query.casefold())
    requested = list(dict.fromkeys(number for group in chapter_groups for number in re.findall(r"\d+", group)))
    headings = _body_chapter_headings(text)
    toc_pages = _toc_chapter_pages(text)
    page_positions = {int(marker.group(1)): marker.start() for marker in PAGE_MARKER.finditer(text)}
    sections = []
    for chapter in requested:
        matches = [text[heading.start():headings[index + 1].start() if index + 1 < len(headings) else len(text)]
                   for index, heading in enumerate(headings) if heading.group(1) == chapter]
        if matches:
            sections.append(max(matches, key=len))
        elif chapter in toc_pages and toc_pages[chapter] in page_positions:
            start_page = toc_pages[chapter]
            next_page = min((page for page in toc_pages.values() if page > start_page), default=None)
            start = page_positions[start_page]
            end = page_positions.get(next_page, len(text)) if next_page else len(text)
            sections.append(text[start:end])
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


def _source_line(text: str, position: int) -> str:
    start = text.rfind("\n", 0, position) + 1
    end = text.find("\n", position)
    return text[start:end if end != -1 else len(text)]


def _body_chapter_headings(text: str) -> list[re.Match]:
    headings = list(CHAPTER_HEADING.finditer(text))
    toc_end = max((heading.start() for heading in headings
                   if is_table_of_contents_entry(_source_line(text, heading.start()))), default=-1)
    return [heading for heading in headings if heading.start() > toc_end]


def _toc_chapter_pages(text: str) -> dict[str, int]:
    pages = {}
    for heading in CHAPTER_HEADING.finditer(text):
        match = TOC_PAGE.search(_source_line(text, heading.start()))
        if match:
            pages.setdefault(heading.group(1), int(match.group(1)))
    return pages
