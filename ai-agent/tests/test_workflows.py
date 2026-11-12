import pytest

from soes_agent.contracts import ExamMatrixRequest, StudentRequest
from soes_agent.workflows import build_evidence, propose_exam_matrix, run_student


def test_evidence_contains_only_numeric_metrics():
    request = StudentRequest(
        message="Tôi cần ôn gì?", analyzedAttemptCount=1, limitedToRecentAttempts=False,
        topics=[{
            "topicId": "join", "code": "JOIN", "name": "SQL joins",
            "questionCount": 5, "earnedPoints": 2, "possiblePoints": 10,
            "percentage": 20, "sufficientData": True,
        }],
    )
    evidence = build_evidence({"request": request.model_dump()})["evidence"]
    assert "message" not in evidence
    assert evidence["topics"][0]["percentage"] == 20


@pytest.mark.asyncio
async def test_empty_results_never_call_the_model():
    class Model:
        def with_structured_output(self, _schema):
            return self

        async def ainvoke(self, _messages):
            raise AssertionError("Model should not be called without evidence")

    answer = await run_student(Model(), StudentRequest(
        message="Tôi cần ôn gì?", analyzedAttemptCount=0,
        limitedToRecentAttempts=False, topics=[],
    ))
    assert answer.actions == []
    assert "Chưa có kết quả" in answer.summary


@pytest.mark.asyncio
async def test_discards_model_citations_not_present_in_evidence():
    class Model:
        def with_structured_output(self, _schema):
            return self

        async def ainvoke(self, _messages):
            return {
                "summary": "Ôn lại JOIN.", "actions": ["Luyện thêm JOIN."],
                "evidenceIds": ["join", "other-user-topic"], "caveat": None,
            }

    answer = await run_student(Model(), StudentRequest(
        message="Tôi cần ôn gì?", analyzedAttemptCount=1,
        limitedToRecentAttempts=False,
        topics=[{
            "topicId": "join", "code": "JOIN", "name": "SQL joins",
            "questionCount": 5, "earnedPoints": 2, "possiblePoints": 10,
            "percentage": 20, "sufficientData": True,
        }],
    ))
    assert answer.evidenceIds == ["join"]


@pytest.mark.asyncio
async def test_matrix_workflow_returns_only_a_proposal():
    class Model:
        def with_structured_output(self, _schema):
            return self

        async def ainvoke(self, _messages):
            return {"easyCount": 2, "mediumCount": 1, "hardCount": 0, "rationale": "Phù hợp số câu hiện có."}

    proposal = await propose_exam_matrix(Model(), ExamMatrixRequest(
        message="Tạo đề 3 câu", desiredCount=3, format="OBJECTIVE",
        availableEasy=2, availableMedium=1, availableHard=0,
    ))
    assert proposal.easyCount + proposal.mediumCount + proposal.hardCount == 3
