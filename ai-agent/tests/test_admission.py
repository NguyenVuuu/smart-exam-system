from threading import BoundedSemaphore
import asyncio

import pytest
from fastapi import HTTPException, Request

from soes_agent import main


@pytest.mark.asyncio
async def test_service_admission_rejects_overload_and_releases_slot(monkeypatch):
    monkeypatch.setenv("AI_AGENT_SHARED_SECRET", "test-secret")
    monkeypatch.setattr(main, "_request_slots", BoundedSemaphore(1))
    request = Request({"type": "http", "headers": []})
    first = main.require_service(request, "Bearer test-secret")
    await anext(first)
    rejected = main.require_service(request, "Bearer test-secret")
    with pytest.raises(HTTPException) as error:
        await anext(rejected)
    assert error.value.status_code == 503
    await first.aclose()

    unauthorized = main.require_service(request, "Bearer wrong")
    with pytest.raises(HTTPException) as error:
        await anext(unauthorized)
    assert error.value.status_code == 401

    retry = main.require_service(request, "Bearer test-secret")
    await anext(retry)
    await retry.aclose()


@pytest.mark.asyncio
async def test_disconnected_client_cancels_work_and_releases_capacity(monkeypatch):
    monkeypatch.setenv("AI_AGENT_SHARED_SECRET", "test-secret")
    slots = BoundedSemaphore(1)
    monkeypatch.setattr(main, "_request_slots", slots)

    async def disconnected():
        return {"type": "http.disconnect"}

    request = Request({"type": "http", "headers": []}, disconnected)

    async def work():
        dependency = main.require_service(request, "Bearer test-secret")
        try:
            await anext(dependency)
            await asyncio.sleep(10)
        finally:
            await dependency.aclose()

    task = asyncio.create_task(work())
    with pytest.raises(asyncio.CancelledError):
        await asyncio.wait_for(task, 2)
    assert slots.acquire(blocking=False)
    slots.release()
