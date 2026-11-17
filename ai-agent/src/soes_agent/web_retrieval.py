"""Grounded web evidence for programming practice, without sending course files to search."""

import asyncio
import logging
import os
from collections import OrderedDict
from time import monotonic
from urllib.parse import urlparse

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)
_quota_retry_after: dict[str, float] = {}
_grounded_cache: OrderedDict[tuple[str, str, str], tuple[float, str, list[str]]] = OrderedDict()
WEB_CACHE_SECONDS = 600
WEB_CACHE_MAX_ENTRIES = 64


async def retrieve_programming_web(topic: str, language: str, model_name: str) -> tuple[str, list[str]]:
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key or not topic.strip():
        return "", []
    cache_key = (topic.strip().casefold(), language, model_name)
    cached = _grounded_cache.get(cache_key)
    if cached and cached[0] > monotonic():
        _grounded_cache.move_to_end(cache_key)
        logger.info("Programming web retrieval cache=hit")
        return cached[1], list(cached[2])
    if cached:
        del _grounded_cache[cache_key]
    if _quota_retry_after.get(model_name, 0) > monotonic():
        logger.info("Programming web retrieval quota cooldown model=%s", model_name)
        return "", []
    client = None
    try:
        client = genai.Client(api_key=api_key)
        response = await asyncio.wait_for(client.aio.models.generate_content(
            model=model_name,
            contents=(f"Tìm nguồn kỹ thuật đáng tin cậy về {topic[:500]} trong {language}. "
                      "Tóm tắt các quy tắc và ví dụ thuật toán cần để ra bài tập lập trình console. "
                      "Ưu tiên tài liệu chính thức và ví dụ đúng cú pháp; không sao chép nguyên đề bài. "
                      "Chỉ dùng kết quả tìm kiếm thực tế, trả lời bằng tiếng Việt có dấu."),
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                temperature=0.2,
            ),
        ), timeout=30)
        grounding = getattr(response.candidates[0], "grounding_metadata", None) if response.candidates else None
        urls = []
        for chunk in getattr(grounding, "grounding_chunks", None) or []:
            uri = getattr(getattr(chunk, "web", None), "uri", "") or ""
            parsed = urlparse(uri)
            if parsed.scheme == "https" and parsed.hostname and uri not in urls:
                urls.append(uri[:500])
        content = (response.text or "").strip()
        if not urls or len(content) < 80:
            logger.warning("Programming web retrieval returned no grounded source")
            return "", []
        logger.info("Programming web retrieval grounded_sources=%s chars=%s", len(urls), len(content))
        result = content[:20000], urls[:5]
        _grounded_cache[cache_key] = (monotonic() + WEB_CACHE_SECONDS, *result)
        if len(_grounded_cache) > WEB_CACHE_MAX_ENTRIES:
            _grounded_cache.popitem(last=False)
        return result
    except Exception as exc:
        code = getattr(exc, "code", None)
        if code == 429:
            _quota_retry_after[model_name] = monotonic() + 60
        logger.warning("Programming web retrieval unavailable category=%s code=%s", type(exc).__name__, code)
        return "", []
    finally:
        if client is not None:
            try:
                await client.aio.aclose()
            except Exception as exc:
                logger.warning("Programming web retrieval cleanup failed category=%s", type(exc).__name__)
