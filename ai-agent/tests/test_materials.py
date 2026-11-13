import base64
from io import BytesIO

import pytest
from docx import Document

from soes_agent.contracts import PracticeDraftRequest, StudentRequest, StudyMaterial
from soes_agent.materials import extract_material, select_material_excerpt, source_location
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


def test_citation_location_uses_real_page_and_section_markers():
    text = ("[Trang 1] Mục lục\nChương 3........................12\n"
            "[Trang 12] CHƯƠNG 3: Lập trình Java\n"
            "[Trang 13] 3.2. Vòng lặp\nVòng lặp for duyệt các phần tử theo chỉ số.")
    quote = "Vòng lặp for duyệt các phần tử theo chỉ số."
    assert source_location(text, quote, "application/pdf") == "Chương 3 · Mục 3.2 · Trang 13"
    assert source_location(text, quote, "text/plain") == "Chương 3 · Mục 3.2"
    assert source_location(text, "Không có trong tài liệu", "application/pdf") is None


def test_citation_location_does_not_use_table_of_contents_page():
    text = "Java và ứng dụng Console........................10\n[Trang 10] Ứng dụng Console chạy trên dòng lệnh."
    assert source_location(text, "Java và ứng dụng Console", "application/pdf") is None
    assert source_location(text, "Ứng dụng Console chạy trên dòng lệnh.", "application/pdf") == "Trang 10"


@pytest.mark.parametrize("previous_heading", ["", "[Trang 47] CHƯƠNG 3: ĐỐI TƯỢNG\n"])
def test_citation_does_not_carry_section_across_garbled_chapter_heading(previous_heading):
    text = ("[Trang 1] MỤC LỤC\nChương 3: ĐỐI TƯỢNG........47\nChương 4: GIAO DIỆN........82\n"
            + previous_heading +
            "[Trang 72] 3.3.3.5. Khởi tạo đối tượng\nNội dung chương trước.\n"
            "[Trang 82] CChhưươơnngg 44:: GIAO DIỆN\n"
            "[Trang 83] Label và Button là các thành phần giao diện.")
    assert source_location(text, "Label và Button là các thành phần giao diện.",
                           "application/pdf") == "Chương 4 · Trang 83"


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


def test_practice_understands_chapter_range_without_repeated_word():
    text = ("CHƯƠNG 1\n" + "Nền tảng. " * 2500
            + "\nCHƯƠNG 2\n" + "Vòng lặp for duyệt từng phần tử. " * 100
            + "\nCHƯƠNG 3\n" + "Lớp đóng gói dữ liệu và phương thức. " * 100)
    selected = select_material_excerpt(text, "sinh cho tôi các câu ở chương 2 và 3")
    assert "Vòng lặp for" in selected
    assert "Lớp đóng gói" in selected
    assert "Nền tảng" not in selected


def test_practice_uses_toc_page_ranges_when_pdf_chapter_headings_are_garbled():
    text = ("[Trang 1] MỤC LỤC\n"
            "Chương 2: NỀN TẢNG........................21\n"
            "Chương 3: HƯỚNG ĐỐI TƯỢNG...............47\n"
            "Chương 4: GIAO DIỆN.......................82\n"
            "Chương 5: TẬP TIN........................128\n"
            "[Trang 21] " + "Kiến thức nền tảng. " * 1800 + "\n"
            "[Trang 47] CChhưươơnngg  33:: HƯỚNG ĐỐI TƯỢNG\n"
            "Lớp con kế thừa thuộc tính và phương thức của lớp cha.\n"
            "[Trang 48] Nạp chồng phương thức dùng các danh sách tham số khác nhau.\n"
            "[Trang 82] CChhưươơnngg  44:: GIAO DIỆN\n"
            "Giao diện người dùng có thể gồm nút bấm và ô nhập.\n"
            "[Trang 83] Sự kiện bấm nút gọi phương thức xử lý tương ứng.\n"
            "[Trang 128] CChhưươơnngg  55:: TẬP TIN\n"
            "Tập tin lưu dữ liệu cho chương trình.")
    selected = select_material_excerpt(text, "ôn luyện chương 3 và 4")
    assert "Lớp con kế thừa" in selected
    assert "Giao diện người dùng" in selected
    assert "Kiến thức nền tảng" not in selected
    assert "Tập tin lưu dữ liệu" not in selected
    assert source_location(text, "Giao diện người dùng có thể gồm nút bấm và ô nhập.",
                           "application/pdf") == "Chương 4 · Trang 82"


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
            self.verifying = "verdicts" in _schema.get("properties", {})
            return self

        async def ainvoke(self, messages):
            assert quote in messages[1][1]
            if self.verifying:
                return {"verdicts": [{"itemIndex": 0, "answerIndex": 0, "qualityAccepted": True}]}
            return {"questions": [{
                "stem": "INNER JOIN trả loại hàng nào?",
                "options": ["các hàng có khóa khớp", "tất cả hàng trái", "tất cả hàng phải", "không hàng nào"],
                "correctIndex": 0, "explanation": "INNER JOIN chỉ trả các hàng có khóa khớp giữa hai bảng. Các lựa chọn còn lại mô tả những hàng không được đoạn trích xác nhận.",
                "supportQuote": quote,
                "sourceLocation": "Trang 999",
            }]}

    draft = await generate_practice(Model(), PracticeDraftRequest(
        count=1, instruction="ôn chương 3", material=material(text),
    ))
    assert len(draft.questions) == 1
    assert draft.questions[0].sourceLocation == "Chương 3"


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
