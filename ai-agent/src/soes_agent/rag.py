"""Authorized, content-addressed retrieval for course material.

The caller must provide the source on every request. The local index stores only
embeddings, never document text, and cannot be queried by material ID alone.
"""

import asyncio
import hashlib
import logging
import math
import os
import re
import sqlite3
import struct
import time
import weakref
from collections import Counter
from pathlib import Path

from langchain_google_genai import GoogleGenerativeAIEmbeddings

from .materials import MAX_TEXT_CHARS, requested_chapter_text


logger = logging.getLogger(__name__)
CHUNK_SIZE = 2000
CHUNK_OVERLAP = 180
INDEX_TTL_SECONDS = 7 * 24 * 3600
INDEX_PATH = Path(__file__).resolve().parents[2] / ".cache" / "rag.sqlite3"
_locks: weakref.WeakValueDictionary[str, asyncio.Lock] = weakref.WeakValueDictionary()
GENERIC_QUERY_TERMS = {
    "ôn", "tập", "câu", "hỏi", "bài", "giúp", "tôi", "em", "cho", "tạo", "sinh",
    "nội", "dung", "kiến", "thức", "trong", "tài", "liệu", "môn", "học", "chủ",
    "đề", "các", "một", "vài", "luyện", "chương", "phần", "theo", "bạn",
    "tổng", "hợp", "giải", "thích", "kiểm", "tra", "về", "của", "được",
    "trọng", "tâm", "muốn", "hãy", "thêm", "những", "nào", "như", "thế",
}


def _is_broad_query(query: str) -> bool:
    return not any(term not in GENERIC_QUERY_TERMS for term in _terms(query))


def _spread_indices(count: int, budget: int) -> list[int]:
    size = min(count, budget)
    if size <= 1:
        return [0]
    return [round(index * (count - 1) / (size - 1)) for index in range(size)]


def _chunks(text: str) -> list[str]:
    if len(text) <= CHUNK_SIZE:
        return [text]
    step = CHUNK_SIZE - CHUNK_OVERLAP
    return [text[start:start + CHUNK_SIZE] for start in range(0, len(text), step)]


def _terms(value: str) -> Counter[str]:
    return Counter(re.findall(r"\w{3,}", value.casefold()))


def _lexical_scores(chunks: list[str], query: str) -> list[float]:
    terms = _terms(query)
    if not terms:
        return [0.0] * len(chunks)
    documents = [_terms(chunk) for chunk in chunks]
    frequencies = Counter(word for document in documents for word in document)
    return [sum((1 + math.log(count)) * math.log(1 + (len(chunks) + 1) / (frequencies[word] + 1))
                for word, count in document.items() if word in terms) for document in documents]


def _cosine(left: list[float], right: list[float]) -> float:
    if len(left) != len(right) or not left:
        return 0.0
    numerator = sum(a * b for a, b in zip(left, right))
    denominator = math.sqrt(sum(a * a for a in left) * sum(b * b for b in right))
    return numerator / denominator if denominator else 0.0


def _index_key(text: str, model: str) -> str:
    return hashlib.sha256((model + "\0" + text).encode()).hexdigest()


def _read_vectors(key: str, count: int, path: Path) -> list[list[float]] | None:
    if not path.exists():
        return None
    try:
        with sqlite3.connect(path) as connection:
            rows = connection.execute(
                "SELECT ordinal, vector FROM rag_vectors WHERE content_hash = ? AND created_at > ? ORDER BY ordinal",
                (key, int(time.time()) - INDEX_TTL_SECONDS),
            ).fetchall()
    except sqlite3.OperationalError:
        return None
    if len(rows) != count or any(index != ordinal for index, (ordinal, _) in enumerate(rows)):
        return None
    return [list(struct.unpack(f"<{len(blob) // 4}f", blob)) for _, blob in rows]


def _write_vectors(key: str, vectors: list[list[float]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path, timeout=30) as connection:
        connection.execute("CREATE TABLE IF NOT EXISTS rag_vectors (content_hash TEXT NOT NULL, "
                           "ordinal INTEGER NOT NULL, vector BLOB NOT NULL, created_at INTEGER NOT NULL, "
                           "PRIMARY KEY (content_hash, ordinal))")
        connection.execute("DELETE FROM rag_vectors WHERE created_at <= ?", (int(time.time()) - INDEX_TTL_SECONDS,))
        connection.execute("DELETE FROM rag_vectors WHERE content_hash = ?", (key,))
        now = int(time.time())
        connection.executemany(
            "INSERT INTO rag_vectors VALUES (?, ?, ?, ?)",
            [(key, index, struct.pack(f"<{len(vector)}f", *vector), now)
             for index, vector in enumerate(vectors)],
        )


def _select(chunks: list[str], lexical: list[float], semantic: list[float] | None,
            groups: list[int] | None = None, broad: bool = False) -> str:
    budget = MAX_TEXT_CHARS // (CHUNK_SIZE + 8)
    if broad or (semantic is None and not any(lexical)):
        if groups is None:
            indices = _spread_indices(len(chunks), budget)
        else:
            indices = []
            group_ids = sorted(set(groups))
            for group_id in group_ids:
                group_indices = [index for index, value in enumerate(groups) if value == group_id]
                quota = max(1, budget // len(group_ids))
                indices.extend(group_indices[index] for index in _spread_indices(len(group_indices), quota))
            indices = sorted(indices[:budget])
        return "\n[...]\n".join(chunks[index] for index in indices)[:MAX_TEXT_CHARS]
    lexical_rank = sorted(range(len(chunks)), key=lambda index: (-lexical[index], index))
    semantic_rank = (sorted(range(len(chunks)), key=lambda index: (-semantic[index], index))
                     if semantic is not None else [])
    ranks = {index: 1 / (60 + position) for position, index in enumerate(lexical_rank, 1)
             if lexical[index] > 0}
    for position, index in enumerate(semantic_rank, 1):
        ranks[index] = ranks.get(index, 0) + 1 / (60 + position)
    if not ranks:
        ranks = {index: 1 / (60 + position) for position, index in enumerate(lexical_rank, 1)}
    ranked = sorted(ranks, key=lambda index: (-ranks[index], index))
    chosen: set[int] = set()
    if groups:
        group_ids = set(groups)
        quota = max(1, budget // len(group_ids))
        for group_id in group_ids:
            chosen.update([index for index in ranked if groups[index] == group_id][:quota])
    chosen.update([index for index in ranked if index not in chosen][:budget - len(chosen)])
    chosen = sorted(chosen)
    return "\n[...]\n".join(chunks[index] for index in chosen)[:MAX_TEXT_CHARS]


async def retrieve_material(text: str, query: str, *, title: str = "",
                            embeddings=None, index_path: Path = INDEX_PATH) -> str:
    """Fuse keyword and vector rankings; keep chapter constraints and lexical fallback."""
    if len(text) <= MAX_TEXT_CHARS:
        return text
    scoped = requested_chapter_text(text, query)
    groups = None
    if scoped:
        text = scoped
        if len(text) <= MAX_TEXT_CHARS:
            return text

    if scoped:
        chapter_chunks = [_chunks(section) for section in scoped.split("\n[...]\n")]
        chunks = [chunk for section in chapter_chunks for chunk in section]
        groups = [index for index, section in enumerate(chapter_chunks) for _ in section]
    else:
        chunks = _chunks(text)
    lexical = _lexical_scores(chunks, query)
    broad = _is_broad_query(query)
    if broad:
        return _select(chunks, lexical, None, groups, broad=True)
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if embeddings is None and not api_key:
        return _select(chunks, lexical, None, groups)
    model = os.environ.get("AI_AGENT_EMBEDDING_MODEL", "gemini-embedding-001")
    key = _index_key(title + "\0" + "\0".join(chunks), model)
    lock = _locks.setdefault(key, asyncio.Lock())
    try:
        async with lock:
            vectors = await asyncio.to_thread(_read_vectors, key, len(chunks), index_path)
            cache_hit = vectors is not None
            if vectors is None:
                embedder = embeddings or GoogleGenerativeAIEmbeddings(model=model, api_key=api_key)
                vectors = await embedder.aembed_documents(chunks, batch_size=32,
                                                           task_type="RETRIEVAL_DOCUMENT", titles=[title] * len(chunks))
                if len(vectors) != len(chunks):
                    raise ValueError("Incomplete material embedding")
                await asyncio.to_thread(_write_vectors, key, vectors, index_path)
            else:
                embedder = embeddings or GoogleGenerativeAIEmbeddings(model=model, api_key=api_key)
        query_vector = await embedder.aembed_query(query, task_type="RETRIEVAL_QUERY")
        semantic = [_cosine(query_vector, vector) for vector in vectors]
        logger.info("RAG retrieval chunks=%s index=%s", len(chunks), "hit" if cache_hit else "miss")
        return _select(chunks, lexical, semantic, groups)
    except Exception as exc:
        logger.warning("RAG vector retrieval unavailable category=%s; using keyword retrieval", type(exc).__name__)
        return _select(chunks, lexical, None, groups)
