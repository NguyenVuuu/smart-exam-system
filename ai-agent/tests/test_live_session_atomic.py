"""Execute the backend's actual Lua against an isolated in-memory Redis fixture."""
import json
import re
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import fakeredis


SOURCE = (Path(__file__).resolve().parents[2] / "be/soes-be/src/modules/proctoring-live/live-session.store.ts").read_text(encoding="utf-8-sig")
CREATE = re.search(r"const createScript = `([\s\S]*?)`", SOURCE).group(1)
CHANGE = re.search(r"const changeScript = `([\s\S]*?)`", SOURCE).group(1)
PREFIX = "proctoring:live:session:"
POINTER = "proctoring:live:attempt:schedule:attempt:WEBCAM"


def create(client, identity="one", teacher="teacher"):
    state = dict(id=identity, attemptId="attempt", scheduleId="schedule", teacherId=teacher,
                 streamType="WEBCAM", status="REQUESTED", createdAt=1, updatedAt=1,
                 offer=None, answer=None, studentCandidates=[], teacherCandidates=[])
    return client.eval(CREATE, 2, PREFIX + identity, POINTER, json.dumps(state), PREFIX, teacher, 1, identity)


def change(client, action, value=None, identity="one", actor=None):
    return client.eval(CHANGE, 1, PREFIX + identity, json.dumps(actor or {"teacherId": "teacher"}),
                       action, json.dumps(value), 2, "proctoring:live:attempt:")


def test_only_one_teacher_can_claim_a_stream_and_same_teacher_reuses_request():
    client = fakeredis.FakeRedis(decode_responses=True)
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda teacher: create(client, teacher, teacher), ["a", "b"]))
    assert results.count("CONFLICT") == 1
    owner = json.loads(next(value for value in results if value != "CONFLICT"))
    reused = json.loads(create(client, "replacement", owner["teacherId"]))
    assert reused["id"] == owner["id"]


def test_candidates_are_not_lost_and_ended_session_cannot_be_revived():
    client = fakeredis.FakeRedis(decode_responses=True)
    create(client)
    assert change(client, "ANSWER", {"sdp": "too early"}) is None
    assert change(client, "OFFER", {"sdp": "offer"}, actor={"attemptId": "attempt", "scheduleId": "schedule"})
    assert change(client, "ANSWER", {"sdp": "answer"})
    with ThreadPoolExecutor(max_workers=10) as pool:
        list(pool.map(lambda index: change(client, "STUDENT_CANDIDATE", {"candidate": str(index)}), range(50)))
    state = json.loads(client.get(PREFIX + "one"))
    assert len(state["studentCandidates"]) == 50
    change(client, "STUDENT_CANDIDATE", {"candidate": "1"})
    assert len(json.loads(client.get(PREFIX + "one"))["studentCandidates"]) == 50
    assert change(client, "TOUCH", actor={"teacherId": "other"}) is None
    change(client, "END")
    assert change(client, "STUDENT_CANDIDATE", {"candidate": "late"}) is None
    assert client.get(POINTER) is None
    create(client, "new")
    change(client, "END")
    assert client.get(POINTER) == "new"


def test_touch_only_extends_ttl_and_candidate_storage_has_a_bound():
    client = fakeredis.FakeRedis(decode_responses=True)
    create(client)
    before = client.get(PREFIX + "one")
    change(client, "TOUCH")
    assert client.get(PREFIX + "one") == before
    for index in range(256):
        assert change(client, "TEACHER_CANDIDATE", {"candidate": str(index)})
    assert change(client, "TEACHER_CANDIDATE", {"candidate": "overflow"}) == "CANDIDATE_LIMIT"
