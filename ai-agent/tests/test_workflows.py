import pytest

from soes_agent.contracts import AgentAnswer, ExamMatrixRequest, StudentRequest
from soes_agent.workflows import add_evidence_scope, build_evidence, percentages_are_grounded, propose_exam_matrix, run_student


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


def test_teacher_evidence_requires_enough_students_and_topic_responses():
    from soes_agent.contracts import TeacherRequest

    request = TeacherRequest(
        message="Lớp nào yếu?", analyzedAttemptCount=5, limitedToRecentAttempts=False,
        questions=[], topics=[], classes=[
            {"courseOfferingId": "class-1", "code": "SE01", "studentCount": 4,
             "sufficientData": False, "topics": []},
            {"courseOfferingId": "class-2", "code": "SE02", "studentCount": 5,
             "sufficientData": True, "topics": [{
                 "topicId": "join", "code": "JOIN", "name": "JOIN",
                 "questionCount": 2, "earnedPoints": 0, "possiblePoints": 2,
                 "percentage": 0, "sufficientData": False,
             }]},
        ],
    )
    evidence = build_evidence({"request": request.model_dump()})["evidence"]
    assert evidence["classes"] == []


def test_rejects_percentages_not_supported_by_the_evidence():
    evidence = build_evidence({"request": StudentRequest(
        message="Tôi yếu gì?", analyzedAttemptCount=1, limitedToRecentAttempts=False,
        topics=[{
            "topicId": "join", "code": "JOIN", "name": "SQL JOIN",
            "questionCount": 5, "earnedPoints": 3, "possiblePoints": 10,
            "percentage": 30, "sufficientData": True,
        }],
    ).model_dump()})["evidence"]
    answer = AgentAnswer(summary="JOIN đạt 30%", actions=[], evidenceIds=["join"])
    assert percentages_are_grounded(answer, evidence)
    assert not percentages_are_grounded(answer.model_copy(update={"summary": "JOIN đạt 80%"}), evidence)


def test_teacher_class_answer_includes_verified_sample_size():
    evidence = {
        "limitedToRecentAttempts": True,
        "classes": [{"courseOfferingId": "class-1", "code": "SE01", "studentCount": 8}],
    }
    answer = AgentAnswer(summary="SE01 cần ôn JOIN", actions=[], evidenceIds=["class-1"])
    scoped = add_evidence_scope(answer, evidence)
    assert "SE01: 8 sinh viên" in scoped.caveat
    assert "gần đây" in scoped.caveat


@pytest.mark.asyncio
async def test_model_percentage_without_evidence_is_not_shown():
    class Model:
        def with_structured_output(self, _schema, *, method):
            return self

        async def ainvoke(self, _messages):
            return {"summary": "JOIN đạt 80%", "actions": [], "evidenceIds": ["join"]}

    answer = await run_student(Model(), StudentRequest(
        message="Tôi yếu gì?", analyzedAttemptCount=1, limitedToRecentAttempts=False,
        topics=[{
            "topicId": "join", "code": "JOIN", "name": "SQL JOIN",
            "questionCount": 5, "earnedPoints": 3, "possiblePoints": 10,
            "percentage": 30, "sufficientData": True,
        }],
    ))
    assert "80%" not in answer.summary
    assert answer.evidenceIds == []


@pytest.mark.asyncio
async def test_empty_results_never_call_the_model():
    class Model:
        def with_structured_output(self, _schema, *, method):
            assert method == "function_calling"
            return self

        async def ainvoke(self, _messages):
            raise AssertionError("Model should not be called without evidence")

    answer = await run_student(Model(), StudentRequest(
        message="Tôi cần ôn gì?", analyzedAttemptCount=0,
        limitedToRecentAttempts=False, topics=[],
    ))
    assert answer.actions == []
    assert "Chưa có dữ liệu" in answer.summary


@pytest.mark.asyncio
async def test_insufficient_topic_sample_is_not_sent_to_model():
    class Model:
        def with_structured_output(self, _schema, *, method):
            assert method == "function_calling"
            return self

        async def ainvoke(self, _messages):
            raise AssertionError("Insufficient data must not reach the model")

    answer = await run_student(Model(), StudentRequest(
        message="Tôi yếu gì?", analyzedAttemptCount=1, limitedToRecentAttempts=False,
        topics=[{
            "topicId": "join", "code": "JOIN", "name": "SQL joins",
            "questionCount": 1, "earnedPoints": 0, "possiblePoints": 1,
            "percentage": 0, "sufficientData": False,
        }],
    ))
    assert answer.evidenceIds == []
    assert answer.actions == []


@pytest.mark.asyncio
async def test_discards_model_citations_not_present_in_evidence():
    class Model:
        def with_structured_output(self, _schema, *, method):
            assert method == "function_calling"
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
        def with_structured_output(self, _schema, *, method):
            assert method == "function_calling"
            return self

        async def ainvoke(self, _messages):
            return {"easyCount": 2, "mediumCount": 1, "hardCount": 0, "rationale": "Phù hợp số câu hiện có."}

    proposal = await propose_exam_matrix(Model(), ExamMatrixRequest(
        message="Tạo đề 3 câu", desiredCount=3, format="OBJECTIVE",
        availableEasy=2, availableMedium=1, availableHard=0,
    ))
    assert proposal.easyCount + proposal.mediumCount + proposal.hardCount == 3
