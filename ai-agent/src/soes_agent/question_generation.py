import asyncio
import base64
import re

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from .contracts import QuestionDraftRequest
from .instruction_verification import extract_teacher_requirement, verify_instruction_fulfillment
from .materials import extract_source_bytes
from .performance import measure_stage
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

    async def convert(index: int, part) -> tuple[str | None, dict | None]:
        if part.type == "text":
            return part.text or "", None
        if part.mime_type == "application/pdf":
            try:
                raw = base64.b64decode(part.data or "", validate=True)
                extracted = await asyncio.to_thread(extract_source_bytes, raw, "application/pdf")
                return f"\n--- Tài liệu {index} ---\n{extracted}\n", None
            except (ValueError, UnicodeError):
                # Scanned PDFs need the model's native document reader.
                pass
        return None, _original_part(part)

    converted = await asyncio.gather(*(
        convert(index, part) for index, part in enumerate(request.contents, 1)
    ))
    text_sources: list[str] = []
    media: list[dict] = []
    for text, part in converted:
        if text is not None:
            text_sources.append(text)
        if part is not None:
            media.append(part)
    if text_sources:
        with measure_stage("question.retrieve", len(text_sources)):
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
    source_evidence = "\n".join(part.get("text", "") for part in parts if part.get("type") == "text")
    parts.append({"type": "text", "text": request.prompt})
    requirement = extract_teacher_requirement(request.prompt)
    output_tool = {
        "name": "generate_questions",
        "description": "Return the requested exam question drafts.",
        "parameters": request.responseSchema,
    }
    structured = model.with_structured_output(output_tool, method="function_calling")
    correction = ""
    for attempt in range(2):
        with measure_stage("question.generate"):
            result = await structured.ainvoke([
                SystemMessage(content=request.systemInstruction),
                HumanMessage(content=[*parts, *([{"type": "text", "text": correction}] if correction else [])]),
            ])
        if not isinstance(result, dict) or not isinstance(result.get("questions"), list):
            raise ValueError("Question model returned an invalid draft")
        questions = result["questions"]
        for q in questions:
            if isinstance(q, dict) and "title" in q and isinstance(q["title"], str):
                title = q["title"].strip()
                if len(title) > 200:
                    q["title"] = title[:197].rsplit(" ", 1)[0] + "..." if " " in title[:197] else title[:197] + "..."
        with measure_stage("question.verify", len(questions)):
            verified = await verify_instruction_fulfillment(
                model, requirement, questions, evidence=source_evidence,
            )
        if questions and len(verified) == len(questions):
            return result
        if attempt == 0 and len(verified) < len(questions):
            rejected = ", ".join(str(index + 1) for index in range(len(questions)) if index not in verified)
            correction = (f"Yêu cầu sửa bắt buộc: câu {rejected} ở bản trước chưa bám sát yêu cầu bổ sung "
                          "hoặc chưa đủ chính xác về nội dung/đáp án. Hãy thay bằng câu mới tập trung trực tiếp "
                          "vào đúng yêu cầu; tự kiểm tra độc lập đáp án, lời giải và test case trước khi trả. "
                          "Giữ đúng số lượng, dạng câu và schema đã cấu hình.")
            continue
    raise ValueError("Generated questions did not satisfy the requested topic and quality checks")
