from fastapi.testclient import TestClient
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import ValidationError
import pytest

from soes_agent import main
from soes_agent.contracts import QuestionDraftRequest
from soes_agent import question_generation
from soes_agent.question_generation import generate_question_draft


REQUEST = {
    "model": "gemini-3.5-flash-lite",
    "systemInstruction": "Chỉ dùng tài liệu.",
    "prompt": "Tạo một câu hỏi.",
    "contents": [{"type": "text", "text": "Nội dung môn học"}],
    "responseSchema": {"type": "object", "properties": {"questions": {"type": "array"}}},
    "timeoutSeconds": 60,
    "maxOutputTokens": 4096,
}


def test_question_endpoint_requires_service_secret(monkeypatch):
    monkeypatch.setenv("AI_AGENT_SHARED_SECRET", "test-secret")
    assert TestClient(main.app).post("/v1/teacher/question-draft", json=REQUEST).status_code == 401


def test_question_endpoint_uses_selected_model(monkeypatch):
    class Model:
        def with_structured_output(self, _schema, *, method):
            assert method == "function_calling"
            return self

        async def ainvoke(self, _messages):
            return {"questions": [{"title": "Câu hỏi"}]}

    def selected_model(timeout_seconds, max_output_tokens, model_name):
        assert (timeout_seconds, max_output_tokens, model_name) == (60, 4096, REQUEST["model"])
        return Model()

    monkeypatch.setenv("AI_AGENT_SHARED_SECRET", "test-secret")
    monkeypatch.setattr(main, "get_model", selected_model)
    response = TestClient(main.app).post("/v1/teacher/question-draft", json=REQUEST,
        headers={"authorization": "Bearer test-secret"})
    assert response.status_code == 200
    assert response.json()["questions"][0]["title"] == "Câu hỏi"


def test_question_source_shape_and_timeout_are_bounded():
    with pytest.raises(ValidationError):
        QuestionDraftRequest.model_validate({**REQUEST, "contents": [{"type": "image", "text": "bad"}]})
    with pytest.raises(ValidationError):
        QuestionDraftRequest.model_validate({**REQUEST, "timeoutSeconds": 181})


@pytest.mark.asyncio
async def test_draft_uses_document_and_structured_output():
    class Model:
        def with_structured_output(self, schema, *, method):
            assert schema["parameters"] == REQUEST["responseSchema"]
            assert schema["name"] == "generate_questions"
            assert method == "function_calling"
            return self

        async def ainvoke(self, messages):
            assert isinstance(messages[0], SystemMessage)
            assert isinstance(messages[1], HumanMessage)
            assert messages[1].content[-1]["text"] == REQUEST["prompt"]
            return {"questions": [{"title": "Câu hỏi"}]}

    request = QuestionDraftRequest.model_validate({
        **REQUEST, "contents": [{"type": "document", "data": "YWJj", "mime_type": "application/pdf"}],
    })
    result = await generate_question_draft(Model(), request)
    assert result["questions"][0]["title"] == "Câu hỏi"


@pytest.mark.asyncio
async def test_teacher_generation_retrieves_from_text_and_pdf(monkeypatch):
    seen = []

    async def retrieve(text, query, *, title):
        seen.append((text, query, title))
        return "Đoạn tài liệu đã chọn"

    monkeypatch.setattr(question_generation, "retrieve_material", retrieve)
    monkeypatch.setattr(question_generation, "_extract_text", lambda _raw, _mime: "Nội dung PDF")
    request = QuestionDraftRequest.model_validate({
        **REQUEST,
        "contents": [{"type": "text", "text": "Nội dung TXT"},
                     {"type": "document", "data": "YWJj", "mime_type": "application/pdf"}],
    })

    parts = await question_generation._source_parts(request)

    assert "Nội dung TXT" in seen[0][0]
    assert "Nội dung PDF" in seen[0][0]
    assert parts == [{"type": "text", "text": "Đoạn tài liệu đã chọn"}]


@pytest.mark.asyncio
async def test_exam_extraction_keeps_original_document(monkeypatch):
    async def unexpected(*_args, **_kwargs):
        raise AssertionError("Exam extraction must not use retrieval")

    monkeypatch.setattr(question_generation, "retrieve_material", unexpected)
    request = QuestionDraftRequest.model_validate({
        **REQUEST, "extraction": True,
        "contents": [{"type": "document", "data": "YWJj", "mime_type": "application/pdf"}],
    })

    assert await question_generation._source_parts(request) == [
        {"type": "media", "data": "YWJj", "mime_type": "application/pdf"}]
from soes_agent.question_generation import _retrieval_query


def test_short_teacher_prompt_retrieves_requested_topic():
    prompt = ("Môn học: Lập trình Java. Nguồn: giáo trình.\n"
              "Sinh 5 câu mới từ tài liệu.\n"
              "Yêu cầu bổ sung (không đổi số lượng): vòng lặp\n"
              "KIỂM TRA TRƯỚC KHI TRẢ: đúng dạng và độ khó.")
    assert _retrieval_query(prompt) == "vòng lặp"
    assert _retrieval_query("Môn học: Lập trình Java. Nguồn: giáo trình.") == ""
