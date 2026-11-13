import base64
from sys import getsizeof

import pytest

from soes_agent import material_cache, materials
from soes_agent.material_cache import MaterialTextCache
from soes_agent.contracts import StudyMaterial


def material(text: str) -> StudyMaterial:
    return StudyMaterial(materialId="same-id", title="Notes", mimeType="text/plain",
                         contentBase64=base64.b64encode(text.encode()).decode())


def test_cache_expires_without_extending_lifetime_on_read(monkeypatch):
    now = [0.0]
    monkeypatch.setattr(material_cache, "monotonic", lambda: now[0])
    cache = MaterialTextCache(ttl_seconds=10)
    cache.put("file", "content")
    now[0] = 9
    assert cache.get("file") == "content"
    now[0] = 10
    assert cache.get("file") is None


def test_cache_evicts_least_recently_read_entry():
    cache = MaterialTextCache(max_entries=2)
    cache.put("a", "a")
    cache.put("b", "b")
    assert cache.get("a") == "a"
    cache.put("c", "c")
    assert cache.get("b") is None
    assert cache.get("a") == "a"


def test_cache_bounds_memory_and_accounts_for_replacements():
    size = getsizeof("abc")
    cache = MaterialTextCache(max_bytes=size * 2)
    cache.put("a", "abc")
    cache.put("a", "def")
    cache.put("b", "ghi")
    assert cache.get("a") == "def"
    cache.put("c", "jkl")
    assert cache.get("b") is None
    cache.put("huge", "x" * 1000)
    assert cache.get("huge") is None


def test_extraction_cache_uses_content_and_mime_not_material_id(monkeypatch):
    monkeypatch.setattr(materials, "_text_cache", MaterialTextCache())
    original = materials._extract_text
    calls = []

    def extract(raw, mime_type):
        calls.append(mime_type)
        return original(raw, mime_type)

    monkeypatch.setattr(materials, "_extract_text", extract)
    first = material("First version")
    assert materials.extract_material(first) == "First version"
    assert materials.extract_material(first) == "First version"
    assert len(calls) == 1
    assert materials.extract_material(material("Second version")) == "Second version"
    assert len(calls) == 2
    with pytest.raises(ValueError, match="cannot be read"):
        materials.extract_material(first.model_copy(update={"mimeType": "application/pdf"}))
    with pytest.raises(ValueError, match="cannot be read"):
        materials.extract_material(first.model_copy(update={"contentBase64": "invalid"}))


def test_failed_extraction_is_not_cached(monkeypatch):
    monkeypatch.setattr(materials, "_text_cache", MaterialTextCache())
    calls = []

    def fail(_raw, _mime_type):
        calls.append(True)
        raise ValueError("invalid file")

    monkeypatch.setattr(materials, "_extract_text", fail)
    for _ in range(2):
        with pytest.raises(ValueError):
            materials.extract_material(material("broken file"))
    assert len(calls) == 2
