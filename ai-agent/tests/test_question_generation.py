from fastapi.testclient import TestClient
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import ValidationError
import pytest

from soes_agent import main
from soes_agent.contracts import QuestionDraftRequest
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
