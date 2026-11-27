import pytest

from soes_agent.rag import retrieve_material
from soes_agent import rag


def test_document_token_cache_preserves_scores_and_is_bounded():
    rag._document_terms.cache_clear()
    chunks = ["Vòng lặp xử lý mảng phần tử", "Kế thừa và đối tượng"]
    first = rag._lexical_scores(chunks, "vòng lặp mảng")
    second = rag._lexical_scores(chunks, "vòng lặp mảng")
    assert first == second
    assert first[0] > first[1]
    assert rag._document_terms.cache_info().hits == 2
    for index in range(200):
        rag._document_terms(f"unique document {index}")
    assert rag._document_terms.cache_info().currsize == 128


class FakeEmbeddings:
    def __init__(self):
        self.document_calls = 0
        self.query_calls = 0

    async def aembed_documents(self, texts, **_kwargs):
        self.document_calls += 1
        return [[1.0, 0.0] if "ĐÓNG GÓI ĐẶC BIỆT" in text else [0.0, 1.0] for text in texts]

    async def aembed_query(self, _query, **_kwargs):
        self.query_calls += 1
        return [1.0, 0.0]


@pytest.mark.asyncio
async def test_semantic_retrieval_reuses_content_addressed_index(tmp_path):
    text = "\n".join(["Nội dung cơ bản. " * 125 for _ in range(15)]
                     + ["ĐÓNG GÓI ĐẶC BIỆT. " * 125]
                     + ["Nội dung mở rộng. " * 125 for _ in range(15)])
    embeddings = FakeEmbeddings()
    index = tmp_path / "rag.sqlite3"

    first = await retrieve_material(text, "khái niệm đối tượng", embeddings=embeddings, index_path=index)
    second = await retrieve_material(text, "khái niệm đối tượng", embeddings=embeddings, index_path=index)

    assert "ĐÓNG GÓI ĐẶC BIỆT" in first
    assert first == second
    assert embeddings.document_calls == 1
    assert embeddings.query_calls == 2
    assert "ĐÓNG GÓI ĐẶC BIỆT".encode() not in index.read_bytes()


@pytest.mark.asyncio
async def test_chapter_scope_uses_requested_chapter(monkeypatch, tmp_path):
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    text = "CHƯƠNG 1\n" + "Nền tảng. " * 3000 + "\nCHƯƠNG 3\n" + "Kế thừa lớp cha. " * 200

    result = await retrieve_material(text, "ôn chương 3", index_path=tmp_path / "missing.sqlite3")

    assert "Kế thừa lớp cha" in result
    assert "Nền tảng" not in result
    assert len(result) <= 20_000


@pytest.mark.asyncio
async def test_long_chapter_request_covers_each_chapter(monkeypatch, tmp_path):
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    text = ("CHƯƠNG 1\n" + "Nền tảng. " * 3000
            + "\nCHƯƠNG 2\n" + "VÒNG LẶP FOR duyệt dãy. " * 1500 + "CUỐI CHƯƠNG HAI"
            + "\nCHƯƠNG 3\n" + "LỚP ĐỐI TƯỢNG có phương thức. " * 1500 + "CUỐI CHƯƠNG BA")

    result = await retrieve_material(text, "ôn chương 2 và 3", index_path=tmp_path / "missing.sqlite3")

    assert "VÒNG LẶP FOR" in result
    assert "LỚP ĐỐI TƯỢNG" in result
    assert "CUỐI CHƯƠNG HAI" in result
    assert "CUỐI CHƯƠNG BA" in result
    assert "Nền tảng" not in result


@pytest.mark.asyncio
async def test_vector_failure_keeps_keyword_retrieval(tmp_path):
    class BrokenEmbeddings:
        async def aembed_documents(self, *_args, **_kwargs):
            raise RuntimeError("provider unavailable")

    text = "Nền tảng. " * 3000 + "\nINNER JOIN ghép các hàng có khóa khớp."
    result = await retrieve_material(text, "INNER JOIN", embeddings=BrokenEmbeddings(),
                                     index_path=tmp_path / "rag.sqlite3")
    assert "INNER JOIN ghép" in result


@pytest.mark.asyncio
async def test_embedding_quota_error_uses_keyword_retrieval_during_cooldown(monkeypatch, tmp_path):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    rag._embedding_quota_retry_after.clear()
    calls = 0

    class QuotaError(Exception):
        code = 429

    class QuotaEmbeddings:
        def __init__(self, **_kwargs):
            pass

        async def aembed_documents(self, *_args, **_kwargs):
            nonlocal calls
            calls += 1
            raise RuntimeError("quota") from QuotaError()

    monkeypatch.setattr(rag, "GoogleGenerativeAIEmbeddings", QuotaEmbeddings)
    text = "Nền tảng. " * 3000 + "\nINNER JOIN ghép các hàng có khóa khớp."
    for _ in range(2):
        result = await retrieve_material(text, "INNER JOIN", index_path=tmp_path / "rag.sqlite3")
        assert "INNER JOIN ghép" in result
    assert calls == 1
    rag._embedding_quota_retry_after.clear()


@pytest.mark.asyncio
async def test_short_generic_request_covers_distant_parts_without_embeddings(tmp_path):
    class UnexpectedEmbeddings:
        async def aembed_documents(self, *_args, **_kwargs):
            raise AssertionError("Generic retrieval should not request embeddings")

    text = "\n".join(f"PHẦN {index}: " + f"Kiến thức {index}. " * 140 for index in range(40))
    result = await retrieve_material(text, "ôn tập", embeddings=UnexpectedEmbeddings(),
                                     index_path=tmp_path / "rag.sqlite3")

    assert "PHẦN 0" in result
    assert "Kiến thức 39" in result
    assert len(result) <= 20_000


@pytest.mark.asyncio
async def test_chat_retrieval_respects_smaller_context_budget(tmp_path):
    class UnexpectedEmbeddings:
        async def aembed_documents(self, *_args, **_kwargs):
            raise AssertionError("Generic retrieval should not request embeddings")

    text = "\n".join(f"PHẦN {index}: " + f"Kiến thức {index}. " * 140 for index in range(40))
    result = await retrieve_material(text, "ôn tập", embeddings=UnexpectedEmbeddings(),
                                     index_path=tmp_path / "rag.sqlite3", max_chars=12_000)

    assert len(result) <= 12_000
    assert "PHẦN 0" in result
    assert "Kiến thức 39" in result


@pytest.mark.asyncio
async def test_unmatched_short_paraphrase_falls_back_to_broad_coverage(monkeypatch, tmp_path):
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    text = "\n".join(f"ĐOẠN {index}: " + f"Giải thích {index}. " * 140 for index in range(40))

    result = await retrieve_material(text, "khái niệm hoàn toàn khác", index_path=tmp_path / "missing.sqlite3")

    assert "ĐOẠN 0" in result
    assert "Giải thích 39" in result
