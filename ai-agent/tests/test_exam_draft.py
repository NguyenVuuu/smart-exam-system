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
async def test_topic_suggestion_uses_existing_taxonomy():
    model = FakeModel({"existingCodes": ["LOOP"], "newCode": None,
                       "newName": None, "rationale": "Câu hỏi về vòng lặp"})
    result = await suggest_topic(model, TopicSuggestionRequest(
        title="Vòng lặp for", content="Cho đoạn code for", existingTopics=[{"code": "LOOP", "name": "Vòng lặp"}],
    ))
    assert result.existingCodes == ["LOOP"]
