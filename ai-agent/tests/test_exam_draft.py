import pytest

from soes_agent.contracts import ExamDraftRequest, TopicSuggestionRequest
from soes_agent.exam_draft import propose_exam_draft, suggest_topic


class FakeModel:
    def __init__(self, response):
        self.response = response
        self.messages = None

    def with_structured_output(self, _schema, *, method):
        assert method == "function_calling"
        return self

    async def ainvoke(self, messages):
        self.messages = messages
        return self.response


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
async def test_topic_suggestion_uses_existing_taxonomy():
    model = FakeModel({"existingCodes": ["LOOP"], "newCode": None,
                       "newName": None, "rationale": "Câu hỏi về vòng lặp"})
    result = await suggest_topic(model, TopicSuggestionRequest(
        title="Vòng lặp for", content="Cho đoạn code for", existingTopics=[{"code": "LOOP", "name": "Vòng lặp"}],
    ))
    assert result.existingCodes == ["LOOP"]
