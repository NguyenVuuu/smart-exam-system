from fastapi.testclient import TestClient

from soes_agent.main import app


def test_rejects_requests_without_service_secret(monkeypatch):
    monkeypatch.setenv("AI_AGENT_SHARED_SECRET", "test-secret")
    response = TestClient(app).post("/v1/student/insights", json={})
    assert response.status_code == 401


def test_health_does_not_require_model_configuration():
    assert TestClient(app).get("/health").json() == {"status": "ok"}
