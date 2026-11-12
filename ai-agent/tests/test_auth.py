import base64
import logging

from fastapi.testclient import TestClient
from langchain_google_genai.chat_models import GoogleAPIError, GoogleRateLimitError

from soes_agent import main


app = main.app


def test_rejects_requests_without_service_secret(monkeypatch):
    monkeypatch.setenv("AI_AGENT_SHARED_SECRET", "test-secret")
    response = TestClient(app).post("/v1/student/insights", json={})
    assert response.status_code == 401


def test_health_does_not_require_model_configuration():
    assert TestClient(app).get("/health").json() == {"status": "ok"}


def test_provider_outage_returns_retryable_status_without_details(monkeypatch):
    async def unavailable(_model, _request):
        raise GoogleAPIError(503, {"error": "provider-internal-detail"})

    monkeypatch.setenv("AI_AGENT_SHARED_SECRET", "test-secret")
    monkeypatch.setattr(main, "get_model", lambda: object())
    monkeypatch.setattr(main, "run_student", unavailable)
    response = TestClient(app).post("/v1/student/insights",
        headers={"authorization": "Bearer test-secret"},
        json={"message": "test", "analyzedAttemptCount": 0,
              "limitedToRecentAttempts": False, "topics": []})
    assert response.status_code == 503
    assert "provider-internal-detail" not in response.text


def test_provider_quota_returns_retryable_status_without_details(monkeypatch):
    async def exhausted(_model, _request):
        raise GoogleRateLimitError("provider-internal-detail")

    monkeypatch.setenv("AI_AGENT_SHARED_SECRET", "test-secret")
    monkeypatch.setattr(main, "get_model", lambda: object())
    monkeypatch.setattr(main, "run_student", exhausted)
    response = TestClient(app).post("/v1/student/insights",
        headers={"authorization": "Bearer test-secret"},
        json={"message": "test", "analyzedAttemptCount": 0,
              "limitedToRecentAttempts": False, "topics": []})
    assert response.status_code == 503
    assert "provider-internal-detail" not in response.text


def test_workflow_log_contains_metadata_only(monkeypatch, caplog):
    monkeypatch.setenv("AI_AGENT_SHARED_SECRET", "test-secret")
    with caplog.at_level(logging.INFO, logger="soes_agent.main"):
        response = TestClient(app).post("/v1/student/insights", json={"message": "private-prompt"})
    assert response.status_code == 401
    assert "status=401" in caplog.text
    assert "private-prompt" not in caplog.text
    assert "test-secret" not in caplog.text


def test_authorized_practice_response_uses_validated_source(monkeypatch):
    quote = "INNER JOIN trả các hàng có khóa khớp."

    class Model:
        def with_structured_output(self, _schema):
            return self

        async def ainvoke(self, _messages):
            return {"questions": [{
                "stem": "INNER JOIN trả loại hàng nào?",
                "options": ["Các hàng có khóa khớp", "Hàng bên trái", "Hàng bên phải", "Không hàng nào"],
                "correctIndex": 0,
                "explanation": "Tài liệu mô tả các hàng có khóa khớp.",
                "supportQuote": quote,
            }]}

    monkeypatch.setenv("AI_AGENT_SHARED_SECRET", "test-secret")
    monkeypatch.setattr(main, "get_model", lambda: Model())
    response = TestClient(app).post("/v1/student/practice-draft",
        headers={"authorization": "Bearer test-secret"},
        json={"count": 1, "material": {
            "materialId": "material-1", "title": "SQL", "mimeType": "text/plain",
            "contentBase64": base64.b64encode(quote.encode()).decode(),
        }})
    assert response.status_code == 200
    assert response.json()["questions"][0]["supportQuote"] == quote
