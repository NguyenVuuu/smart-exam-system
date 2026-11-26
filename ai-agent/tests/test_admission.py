from threading import BoundedSemaphore

import pytest
from fastapi import HTTPException

from soes_agent import main


@pytest.mark.asyncio
async def test_service_admission_rejects_overload_and_releases_slot(monkeypatch):
    monkeypatch.setenv("AI_AGENT_SHARED_SECRET", "test-secret")
    monkeypatch.setattr(main, "_request_slots", BoundedSemaphore(1))
    first = main.require_service("Bearer test-secret")
    await anext(first)
    rejected = main.require_service("Bearer test-secret")
    with pytest.raises(HTTPException) as error:
        await anext(rejected)
    assert error.value.status_code == 503
    await first.aclose()

    unauthorized = main.require_service("Bearer wrong")
    with pytest.raises(HTTPException) as error:
        await anext(unauthorized)
    assert error.value.status_code == 401

    retry = main.require_service("Bearer test-secret")
    await anext(retry)
    await retry.aclose()
