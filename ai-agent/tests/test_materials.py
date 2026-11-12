import base64

import pytest

from soes_agent.contracts import StudentRequest, StudyMaterial
from soes_agent.materials import extract_material
from soes_agent.workflows import run_student


def material(text: str) -> StudyMaterial:
    return StudyMaterial(
        materialId="course-note-1", title="Bài giảng JOIN", mimeType="text/plain",
        contentBase64=base64.b64encode(text.encode()).decode(),
    )


def test_reads_plain_text_and_rejects_empty_material():
    assert extract_material(material("INNER JOIN kết hợp các hàng khớp.")) == "INNER JOIN kết hợp các hàng khớp."
    with pytest.raises(ValueError, match="no readable text"):
        extract_material(material("  "))


@pytest.mark.asyncio
async def test_material_can_support_an_answer_without_released_exam_results():
    class Model:
        def with_structured_output(self, _schema):
            return self

        async def ainvoke(self, messages):
            assert "INNER JOIN" in messages[1][1]
            assert "contentBase64" not in messages[1][1]
            return {
                "summary": "Tài liệu mô tả INNER JOIN.", "actions": ["Ôn cách kết hợp các hàng khớp."],
                "evidenceIds": ["course-note-1"], "caveat": "Không có kết quả thi để phân tích điểm yếu.",
            }

    answer = await run_student(Model(), StudentRequest(
        message="Tôi nên ôn gì?", analyzedAttemptCount=0,
        limitedToRecentAttempts=False, topics=[],
        material=material("INNER JOIN kết hợp các hàng khớp."),
    ))
    assert answer.evidenceIds == ["course-note-1"]


@pytest.mark.asyncio
async def test_uncited_material_answer_is_not_shown():
    class Model:
        def with_structured_output(self, _schema):
            return self

        async def ainvoke(self, _messages):
            return {"summary": "Bạn trượt môn này.", "actions": [], "evidenceIds": [], "caveat": None}

    answer = await run_student(Model(), StudentRequest(
        message="Tôi có trượt môn không?", analyzedAttemptCount=0,
        limitedToRecentAttempts=False, topics=[], material=material("Bài giảng JOIN"),
    ))
    assert "trượt" not in answer.summary
    assert answer.evidenceIds == []
