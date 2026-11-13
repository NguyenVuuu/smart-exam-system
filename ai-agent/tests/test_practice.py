import base64

import pytest

from soes_agent.contracts import PracticeDraft, PracticeDraftRequest, StudyMaterial
from soes_agent.practice import generate_practice, validate_draft


SOURCE = "INNER JOIN chỉ trả các hàng có khóa khớp ở hai bảng."


def draft(quote: str = SOURCE) -> PracticeDraft:
    return PracticeDraft(questions=[{
        "stem": "INNER JOIN trả loại hàng nào?",
        "options": ["Các hàng có khóa khớp", "Tất cả hàng bên trái", "Tất cả hàng bên phải", "Không hàng nào"],
        "correctIndex": 0,
        "explanation": "Tài liệu nêu INNER JOIN chỉ trả các hàng có khóa khớp.",
        "supportQuote": quote,
    }])


def test_practice_requires_exact_material_evidence_and_unique_options():
    assert validate_draft(draft(), SOURCE, 1).questions[0].correctIndex == 0
    with pytest.raises(ValueError, match="source quote"):
        validate_draft(draft("Một câu không nằm trong tài liệu."), SOURCE, 1)
    with pytest.raises(ValueError, match="count mismatch"):
        validate_draft(draft(), SOURCE, 2)


def test_practice_rejects_unsupported_or_ambiguous_answer():
    unsupported = draft()
    unsupported.questions[0].correctIndex = 1
    with pytest.raises(ValueError, match="uniquely supported"):
        validate_draft(unsupported, SOURCE, 1)

    ambiguous = draft()
    ambiguous.questions[0].options[1] = "INNER JOIN"
    with pytest.raises(ValueError, match="uniquely supported"):
        validate_draft(ambiguous, SOURCE, 1)


def test_practice_keeps_only_valid_unique_candidates():
    rejected = draft()
    rejected.questions[0].correctIndex = 1
    valid = draft()
    result = validate_draft(PracticeDraft(questions=[
        rejected.questions[0], valid.questions[0], valid.questions[0],
    ]), SOURCE, 1)
    assert len(result.questions) == 1
    assert result.questions[0].correctIndex == 0


@pytest.mark.asyncio
async def test_generation_uses_selected_material_only():
    class Model:
        def with_structured_output(self, _schema, *, method):
            assert method == "function_calling"
            return self

        async def ainvoke(self, messages):
            assert SOURCE in messages[1][1]
            assert "Tạo 1 câu ứng viên" in messages[1][1]
            assert "Mức độ: ADVANCED" in messages[1][1]
            assert "Chủ đề cần ưu tiên: SQL JOIN" in messages[1][1]
            return draft().model_dump()

    request = PracticeDraftRequest(count=1, difficulty="ADVANCED",
        focusTopic={"code": "JOIN", "name": "SQL JOIN"}, material=StudyMaterial(
        materialId="material-1", title="JOIN", mimeType="text/plain",
        contentBase64=base64.b64encode(SOURCE.encode()).decode(),
    ))
    result = await generate_practice(Model(), request)
    assert len(result.questions) == 1
