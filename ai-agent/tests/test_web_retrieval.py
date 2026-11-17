from types import SimpleNamespace

import pytest

from soes_agent.web_retrieval import retrieve_programming_web
from soes_agent import web_retrieval


@pytest.mark.asyncio
async def test_programming_web_retrieval_requires_grounded_https_sources(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    web_retrieval._grounded_cache.clear()
    calls = []

    class AsyncModels:
        async def generate_content(self, **kwargs):
            calls.append(kwargs)
            chunks = [SimpleNamespace(web=SimpleNamespace(uri=uri)) for uri in (
                "https://docs.oracle.com/java/tutorial/", "http://unsafe.example/page",
                "https://docs.oracle.com/java/tutorial/",
            )]
            return SimpleNamespace(text="Vòng lặp for duyệt các phần tử của mảng theo chỉ số. " * 2,
                                   candidates=[SimpleNamespace(grounding_metadata=SimpleNamespace(grounding_chunks=chunks))])

    class Client:
        def __init__(self, **_kwargs):
            self.aio = SimpleNamespace(models=AsyncModels(), aclose=self.close)

        async def close(self):
            calls.append("closed")

    monkeypatch.setattr("soes_agent.web_retrieval.genai.Client", Client)
    content, urls = await retrieve_programming_web("mảng và vòng lặp", "JAVA", "gemini-test")
    assert "Vòng lặp for" in content
    assert urls == ["https://docs.oracle.com/java/tutorial/"]
    assert "mảng và vòng lặp" in calls[0]["contents"]
    assert calls[0]["model"] == "gemini-test"
    assert calls[-1] == "closed"
    assert await retrieve_programming_web("mảng và vòng lặp", "JAVA", "gemini-test") == (content, urls)
    assert len([call for call in calls if isinstance(call, dict)]) == 1
    web_retrieval._grounded_cache.clear()


@pytest.mark.asyncio
async def test_web_quota_error_skips_immediate_retries(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(web_retrieval, "monotonic", lambda: 1000.0)
    web_retrieval._quota_retry_after.clear()
    calls = 0

    class QuotaError(Exception):
        code = 429

    class AsyncModels:
        async def generate_content(self, **_kwargs):
            nonlocal calls
            calls += 1
            raise QuotaError()

    class Client:
        def __init__(self, **_kwargs):
            self.aio = SimpleNamespace(models=AsyncModels(), aclose=self.close)

        async def close(self):
            pass

    monkeypatch.setattr("soes_agent.web_retrieval.genai.Client", Client)
    assert await retrieve_programming_web("vòng lặp", "JAVA", "gemini-test") == ("", [])
    assert await retrieve_programming_web("vòng lặp", "JAVA", "gemini-test") == ("", [])
    assert calls == 1
    web_retrieval._quota_retry_after.clear()
