import asyncio
import base64
import re

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from .contracts import QuestionDraftRequest
from .materials import _extract_text
from .rag import retrieve_material


def _retrieval_query(prompt: str) -> str:
    """Use the teacher's topic, not the long output and validation instructions."""
    request = re.search(r"^Yêu cầu bổ sung[^\n]*?:\s*(.*)$", prompt, re.MULTILINE)
    if request and request.group(1).strip():
        return request.group(1).strip()
    return ""


async def _source_parts(request: QuestionDraftRequest) -> list[dict]:
    if request.extraction:
        return [_original_part(part) for part in request.contents]

    text_sources: list[str] = []
    media: list[dict] = []
    for index, part in enumerate(request.contents, 1):
        if part.type == "text":
            text_sources.append(part.text or "")
        elif part.mime_type == "application/pdf":
            try:
                raw = base64.b64decode(part.data or "", validate=True)
                extracted = await asyncio.to_thread(_extract_text, raw, "application/pdf")
                text_sources.append(f"\n--- Tài liệu {index} ---\n{extracted}\n")
            except (ValueError, UnicodeError):
                # Scanned PDFs need the model's native document reader.
                media.append(_original_part(part))
        else:
            media.append(_original_part(part))
    if text_sources:
        source = await retrieve_material("\n".join(text_sources), _retrieval_query(request.prompt),
                                         title="Tài liệu môn học")
        media.insert(0, {"type": "text", "text": source})
    return media


def _original_part(part) -> dict:
    return {"type": "text", "text": part.text} if part.type == "text" else {
        "type": "media", "data": part.data, "mime_type": part.mime_type,
    }


async def generate_question_draft(model: ChatGoogleGenerativeAI, request: QuestionDraftRequest) -> dict:
    parts = await _source_parts(request)
    parts.append({"type": "text", "text": request.prompt})
    output_tool = {
        "name": "generate_questions",
        "description": "Return the requested exam question drafts.",
        "parameters": request.responseSchema,
    }
    structured = model.with_structured_output(output_tool, method="function_calling")
    result = await structured.ainvoke([
        SystemMessage(content=request.systemInstruction),
        HumanMessage(content=parts),
    ])
    if not isinstance(result, dict):
        raise ValueError("Question model returned an invalid draft")
    return result
