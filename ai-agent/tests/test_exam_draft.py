import pytest

from soes_agent.contracts import ExamDraftRequest, TopicSuggestionRequest
from soes_agent.exam_draft import propose_exam_draft, suggest_topic


class FakeModel:
    def __init__(self, response):
        self.responses = response if isinstance(response, list) else [response]
        self.messages = None
        self.calls = 0

    def with_structured_output(self, _schema, *, method, include_raw=False):
        assert method == "function_calling"
        self.include_raw = include_raw
        return self

    async def ainvoke(self, messages):
        self.messages = messages
        response = self.responses[self.calls]
        self.calls += 1
        return {"parsed": response, "parsing_error": None} if self.include_raw else response


@pytest.mark.asyncio
async def test_exam_draft_passes_only_candidate_metadata():
    model = FakeModel({"questionIds": ["q1"], "rationale": "Phù hợp chủ đề"})
    result = await propose_exam_draft(model, ExamDraftRequest(
        message="Câu vòng lặp", desiredCount=1, format="OBJECTIVE",
        candidates=[{"id": "q1", "title": "Vòng lặp", "content": "Tính tổng",
                     "type": "SINGLE_CHOICE", "difficulty": "EASY", "topics": ["LOOP"]}],
    ))
    assert result.questionIds == ["q1"]
    assert "q1" in model.messages[1][1]


@pytest.mark.asyncio
async def test_exam_draft_retries_empty_model_selection():
    model = FakeModel([None,
                       {"questionIds": ["q1"], "rationale": "Phù hợp chủ đề"}])
    result = await propose_exam_draft(model, ExamDraftRequest(
        message="Câu vòng lặp", desiredCount=1, format="OBJECTIVE",
        candidates=[{"id": "q1", "title": "Vòng lặp", "content": "Tính tổng",
                     "type": "SINGLE_CHOICE", "difficulty": "EASY", "topics": ["LOOP"]}],
    ))
    assert result.questionIds == ["q1"]
    assert model.calls == 2


@pytest.mark.asyncio
async def test_exam_draft_rejects_repeated_empty_model_selection():
    model = FakeModel([{"questionIds": [], "rationale": ""}] * 2)
    with pytest.raises(ValueError, match="enough valid questions"):
        await propose_exam_draft(model, ExamDraftRequest(
            message="Câu vòng lặp", desiredCount=1, format="OBJECTIVE",
            candidates=[{"id": "q1", "title": "Vòng lặp", "content": "Tính tổng",
                         "type": "SINGLE_CHOICE", "difficulty": "EASY", "topics": ["LOOP"]}],
        ))
    assert model.calls == 2


@pytest.mark.asyncio
async def test_exam_draft_completes_short_selection_with_matching_difficulty():
    model = FakeModel({"questionIds": ["q1", "q2"], "rationale": "Ưu tiên câu dễ"})
    result = await propose_exam_draft(model, ExamDraftRequest(
        message="Chỉ chọn câu dễ và trung bình", desiredCount=3, format="OBJECTIVE",
        candidates=[
            {"id": "q1", "title": "Câu 1", "content": "Nội dung 1", "type": "SINGLE_CHOICE", "difficulty": "EASY", "topics": []},
            {"id": "q2", "title": "Câu 2", "content": "Nội dung 2", "type": "SINGLE_CHOICE", "difficulty": "MEDIUM", "topics": []},
            {"id": "q3", "title": "Câu 3", "content": "Nội dung 3", "type": "SINGLE_CHOICE", "difficulty": "HARD", "topics": []},
            {"id": "q4", "title": "Câu 4", "content": "Nội dung 4", "type": "SINGLE_CHOICE", "difficulty": "EASY", "topics": []},
        ],
    ))
    assert result.questionIds == ["q1", "q2", "q4"]
    assert "bổ sung 1 câu" in result.rationale


@pytest.mark.asyncio
async def test_exam_draft_completion_preserves_mixed_format_and_topic_target():
    model = FakeModel({"questionIds": ["q1", "q2"], "rationale": "Câu phù hợp"})
    result = await propose_exam_draft(model, ExamDraftRequest(
        message="Đề hỗn hợp về vòng lặp", desiredCount=3, format="MIXED",
        topicTargets={"LOOP": 1},
        candidates=[
            {"id": "q1", "title": "Câu 1", "content": "Nội dung 1", "type": "SINGLE_CHOICE", "difficulty": "EASY", "topics": []},
            {"id": "q2", "title": "Câu 2", "content": "Nội dung 2", "type": "SINGLE_CHOICE", "difficulty": "MEDIUM", "topics": []},
            {"id": "q3", "title": "Câu 3", "content": "Nội dung 3", "type": "PROGRAMMING", "difficulty": "MEDIUM", "topics": ["LOOP"]},
            {"id": "q4", "title": "Câu 4", "content": "Nội dung 4", "type": "PROGRAMMING", "difficulty": "HARD", "topics": []},
        ],
    ))
    assert result.questionIds == ["q1", "q2", "q3"]


@pytest.mark.asyncio
async def test_topic_suggestion_uses_existing_taxonomy():
    model = FakeModel({"existingCodes": ["LOOP"], "newCode": None,
                       "newName": None, "rationale": "Câu hỏi về vòng lặp"})
    result = await suggest_topic(model, TopicSuggestionRequest(
        title="Vòng lặp for", content="Cho đoạn code for", existingTopics=[{"code": "LOOP", "name": "Vòng lặp"}],
    ))
    assert result.existingCodes == ["LOOP"]
