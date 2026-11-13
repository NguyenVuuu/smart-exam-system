import base64
from io import BytesIO

import pytest
from docx import Document

from soes_agent.contracts import PracticeDraftRequest, StudentRequest, StudyMaterial
from soes_agent.materials import extract_material, select_material_excerpt
from soes_agent.practice import generate_practice
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


def test_reads_docx_tables_after_paragraphs():
    document = Document()
    document.add_paragraph("CHƯƠNG 1")
    table = document.add_table(rows=1, cols=2)
    table.cell(0, 0).text = "Khái niệm"
    table.cell(0, 1).text = "Kế thừa"
    output = BytesIO()
    document.save(output)
    content = StudyMaterial(
        materialId="docx-1", title="Bài giảng", mimeType="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        contentBase64=base64.b64encode(output.getvalue()).decode(),
    )
    assert "Khái niệm | Kế thừa" in extract_material(content)


def test_later_chapters_are_available_for_practice():
    text = ("CHƯƠNG 1\n" + "Kiến thức cơ bản. " * 1500
            + "\nCHƯƠNG 3\n" + "Lớp có thuộc tính và phương thức. " * 100
            + "\nCHƯƠNG 4\n" + "Kế thừa cho phép lớp con dùng lại mã. " * 100)
    full_text = extract_material(material(text))
    selected = select_material_excerpt(full_text, "tôi cần luyện chương 3 và chương 4")
    assert len(full_text) > 20_000
    assert "Lớp có thuộc tính" in selected
    assert "Kế thừa cho phép" in selected
    assert len(selected) <= 20_000


@pytest.mark.asyncio
async def test_material_can_support_an_answer_without_released_exam_results():
    class Model:
        def with_structured_output(self, _schema, *, method):
            assert method == "function_calling"
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
async def test_tutoring_uses_requested_later_chapter():
    text = "CHƯƠNG 1\n" + "Nền tảng. " * 2500 + "\nCHƯƠNG 4\nKế thừa giúp tái sử dụng mã."

    class Model:
        def with_structured_output(self, _schema, *, method):
            return self

        async def ainvoke(self, messages):
            assert "Kế thừa giúp tái sử dụng mã" in messages[1][1]
            return {"summary": "Chương 4 nói về kế thừa.", "actions": [],
                    "evidenceIds": ["course-note-1"]}

    answer = await run_student(Model(), StudentRequest(
        message="Giải thích chương 4", analyzedAttemptCount=0,
        limitedToRecentAttempts=False, topics=[], material=material(text),
    ))
    assert answer.evidenceIds == ["course-note-1"]


@pytest.mark.asyncio
async def test_practice_uses_requested_later_chapter():
    quote = "INNER JOIN trả các hàng có khóa khớp."
    text = "CHƯƠNG 1\n" + "Nền tảng. " * 2500 + "\nCHƯƠNG 3\n" + quote

    class Model:
        def with_structured_output(self, _schema, *, method):
            return self

        async def ainvoke(self, messages):
            assert quote in messages[1][1]
            return {"questions": [{
                "stem": "INNER JOIN trả loại hàng nào?",
                "options": ["các hàng có khóa khớp", "tất cả hàng trái", "tất cả hàng phải", "không hàng nào"],
                "correctIndex": 0, "explanation": "INNER JOIN chỉ trả các hàng có khóa khớp giữa hai bảng. Các lựa chọn còn lại mô tả những hàng không được đoạn trích xác nhận.",
                "supportQuote": quote,
            }]}

    draft = await generate_practice(Model(), PracticeDraftRequest(
        count=1, instruction="ôn chương 3", material=material(text),
    ))
    assert len(draft.questions) == 1


@pytest.mark.asyncio
async def test_uncited_material_answer_is_not_shown():
    class Model:
        def with_structured_output(self, _schema, *, method):
            assert method == "function_calling"
            return self

        async def ainvoke(self, _messages):
            return {"summary": "Bạn trượt môn này.", "actions": [], "evidenceIds": [], "caveat": None}

    answer = await run_student(Model(), StudentRequest(
        message="Tôi có trượt môn không?", analyzedAttemptCount=0,
        limitedToRecentAttempts=False, topics=[], material=material("Bài giảng JOIN"),
    ))
    assert "trượt" not in answer.summary
    assert answer.evidenceIds == []
