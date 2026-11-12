from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from .contracts import QuestionDraftRequest


async def generate_question_draft(model: ChatGoogleGenerativeAI, request: QuestionDraftRequest) -> dict:
    parts = [
        {"type": "text", "text": part.text} if part.type == "text" else
        {"type": "media", "data": part.data, "mime_type": part.mime_type}
        for part in request.contents
    ]
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
