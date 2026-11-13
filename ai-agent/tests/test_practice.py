import base64
import logging
import re

import pytest

from soes_agent.contracts import PracticeDraft, PracticeDraftRequest, StudyMaterial
from soes_agent.practice import generate_practice, parse_candidates, review_questions, validate_draft, validate_questions
from soes_agent.practice_evidence import evidence_passages, is_heading_only


SOURCE = "INNER JOIN chỉ trả các hàng có khóa khớp ở hai bảng."


def draft(quote: str = SOURCE) -> PracticeDraft:
    return PracticeDraft(questions=[{
        "stem": "INNER JOIN trả loại hàng nào?",
        "options": ["Các hàng có khóa khớp", "Tất cả hàng bên trái", "Tất cả hàng bên phải", "Không hàng nào"],
        "correctIndex": 0,
        "explanation": "INNER JOIN chỉ lấy các hàng có khóa khớp ở cả hai bảng, nên lựa chọn này đúng. Các lựa chọn lấy toàn bộ một phía hoặc không có hàng nào không phù hợp với điều kiện nối.",
        "supportQuote": quote,
    }])


def numbered_quote(number: int) -> str:
    return f"Phép tính loại {number} trả giá trị {number} khi dữ liệu hợp lệ."


def numbered_question(number: int):
    item = draft().questions[0].model_copy(deep=True)
    item.stem = f"Phép tính loại {number} trả kết quả nào khi dữ liệu hợp lệ?"
    item.options = [f"Giá trị {number}", "Không có kết quả", "Luôn trả lỗi", "Trả toàn bộ đầu vào"]
    item.explanation = (f"Phép tính loại {number} trả giá trị {number} khi dữ liệu đầu vào hợp lệ. "
                        "Các phương án không có kết quả, báo lỗi hoặc trả toàn bộ đầu vào đều trái với quy tắc này.")
    item.supportQuote = numbered_quote(number)
    return item


def test_practice_requires_exact_material_evidence_and_unique_options():
    assert validate_draft(draft(), SOURCE, 1).questions[0].correctIndex == 0
    with pytest.raises(ValueError, match="source quote"):
        validate_draft(draft("Một câu không nằm trong tài liệu."), SOURCE, 1)
    with pytest.raises(ValueError, match="count mismatch"):
        validate_draft(draft(), SOURCE, 2)


def test_practice_does_not_use_table_of_contents_as_evidence():
    contents = "Java và ứng dụng Console................................10"
    source = f"{contents}\nỨng dụng Console thực thi chương trình qua dòng lệnh."
    assert evidence_passages(source) == ["Ứng dụng Console thực thi chương trình qua dòng lệnh."]

    candidate = draft(contents)
    with pytest.raises(ValueError, match="table of contents"):
        validate_draft(candidate, source, 1)


def test_practice_does_not_cite_a_short_section_heading():
    heading = "Khai báo chồng phương thức (overloading method)"
    source = (heading + "\nCác phương thức cùng tên có thể khác số lượng hoặc kiểu tham số. ")
    assert evidence_passages(source) == ["Các phương thức cùng tên có thể khác số lượng hoặc kiểu tham số."]
    candidate = draft(heading).questions[0]
    with pytest.raises(ValueError, match="heading"):
        validate_questions([candidate], source, 1, {id(candidate)})


def test_practice_keeps_wrapped_pdf_prose_without_sentence_punctuation():
    source = ("[Trang 12] CHƯƠNG 3\n"
              "Khai báo chồng phương thức\n"
              "Các phương thức cùng tên có thể nhận\n"
              "số lượng hoặc kiểu tham số khác nhau\n"
              "Trình biên dịch phân biệt các phương thức\n"
              "dựa vào danh sách tham số riêng\n"
              "Chương 4........................15")
    passages = evidence_passages(source)
    assert passages
    assert any("Trình biên dịch" in passage for passage in passages)
    assert "Khai báo chồng phương thức" not in passages
    assert all("Chương 4........................15" not in passage for passage in passages)


def test_short_factual_line_is_not_mistaken_for_a_heading():
    statement = "Lớp con kế thừa thuộc tính của lớp cha"
    assert not is_heading_only(statement)
    assert evidence_passages(statement) == [statement]


def test_practice_uses_distinct_citations_when_source_has_enough_passages():
    first = draft().questions[0]
    second = first.model_copy(deep=True)
    second.stem = "Khi nối hai bảng bằng INNER JOIN, điều kiện nào quyết định các hàng được giữ?"
    accepted, issues = review_questions([first, second], SOURCE, unique_sources=True)
    assert len(accepted) == 1
    assert issues["Duplicate practice source"] == 1


def test_practice_rejects_unsupported_or_ambiguous_answer():
    unsupported = draft()
    unsupported.questions[0].correctIndex = 1
    with pytest.raises(ValueError, match="uniquely supported"):
        validate_draft(unsupported, SOURCE, 1)

    ambiguous = draft()
    ambiguous.questions[0].options[1] = "INNER JOIN"
    with pytest.raises(ValueError, match="uniquely supported"):
        validate_draft(ambiguous, SOURCE, 1)


@pytest.mark.parametrize("stem", [
    "Trong chương 2 của tài liệu, nội dung nào được đề cập?",
    "Theo mục 2.6, tài liệu giới thiệu kiến thức nào?",
    "Giáo trình trình bày INNER JOIN ở trang nào?",
])
def test_practice_rejects_questions_about_document_structure(stem):
    candidate = draft()
    candidate.questions[0].stem = stem
    with pytest.raises(ValueError, match="document structure"):
        validate_draft(candidate, SOURCE, 1)


def test_practice_rejects_placeholder_options():
    candidate = draft()
    candidate.questions[0].options[1] = "class ... end"
    with pytest.raises(ValueError, match="placeholder"):
        validate_draft(candidate, SOURCE, 1)


def test_practice_keeps_only_valid_unique_candidates():
    rejected = draft()
    rejected.questions[0].correctIndex = 1
    valid = draft()
    result = validate_draft(PracticeDraft(questions=[
        rejected.questions[0], valid.questions[0], valid.questions[0],
    ]), SOURCE, 1)
    assert len(result.questions) == 1
    assert result.questions[0].correctIndex == 0


def test_practice_rejects_reworded_duplicate_from_same_evidence():
    first = draft().questions[0]
    second = first.model_copy(deep=True)
    second.stem = "Những hàng nào được INNER JOIN giữ lại?"
    with pytest.raises(ValueError, match="Duplicate practice content"):
        validate_draft(PracticeDraft(questions=[first, second]), SOURCE, 2)


def test_practice_rejects_same_java_history_question_with_different_quote():
    first = numbered_question(1)
    first.stem = "Java chính thức ra đời và được giới thiệu vào năm nào?"
    first.options = ["1995", "1993", "1994", "1996"]
    first.supportQuote = "Java được giới thiệu chính thức vào năm 1995."
    second = first.model_copy(deep=True)
    second.stem = "Ngôn ngữ lập trình Java ra đời và được giới thiệu chính thức vào năm nào?"
    second.options = ["Năm 1993", "Năm 1995", "Năm 1994", "Năm 1996"]
    second.correctIndex = 1
    second.supportQuote = "Năm 1995 đánh dấu thời điểm Java được giới thiệu chính thức."
    source = first.supportQuote + "\n" + second.supportQuote

    with pytest.raises(ValueError, match="Duplicate practice content"):
        validate_questions([first, second], source, 2, {id(first), id(second)})


def test_practice_rejects_reworded_same_editor_concept():
    quote = "Công cụ soạn thảo mã nguồn Java giúp viết và chỉnh sửa chương trình Java."
    first = draft().questions[0].model_copy(deep=True)
    first.stem = "Công cụ soạn thảo mã nguồn Java gắn liền với nội dung nào?"
    first.options = ["Soạn thảo mã nguồn Java", "Biên dịch mã nguồn C", "Quản lý bộ nhớ C++", "Thiết kế giao diện Python"]
    first.supportQuote = quote
    second = first.model_copy(deep=True)
    second.stem = "Nội dung nào sau đây mô tả đúng về công cụ soạn thảo mã nguồn Java?"
    second.options = ["Là công cụ soạn thảo mã nguồn Java", "Là trình biên dịch mã máy",
                      "Là phần mềm quản lý cơ sở dữ liệu", "Là công cụ thiết kế web"]
    with pytest.raises(ValueError, match="Duplicate practice content"):
        validate_questions([first, second], quote, 2, {id(first), id(second)})


def test_practice_rejects_accentless_vietnamese_question_or_options():
    candidate = draft()
    candidate.questions[0].stem = "Cong cu soan thao ma nguon Java gan lien voi noi dung nao?"
    with pytest.raises(ValueError, match="missing Vietnamese diacritics"):
        validate_draft(candidate, SOURCE, 1)

    candidate = draft()
    candidate.questions[0].explanation = (
        "Cac hang co khoa khop giua hai bang la dap an dung vi day la dieu kien noi. "
        "Nhung lua chon khac khong phu hop voi quy tac nay."
    )
    with pytest.raises(ValueError, match="missing Vietnamese diacritics"):
        validate_draft(candidate, SOURCE, 1)

    candidate = draft()
    candidate.questions[0].options = ["Cac hang co khoa khop", "Tat ca hang ben trai",
                                       "Tat ca hang ben phai", "Khong co hang nao"]
    with pytest.raises(ValueError, match="missing Vietnamese diacritics"):
        validate_draft(candidate, SOURCE, 1)


def test_practice_rejects_missing_code_context_and_copied_code_option():
    array_source = "int nums[] = {99, -10, 100123, 18, -978};"
    array_question = numbered_question(1)
    array_question.stem = "Trong đoạn mã khai báo mảng số nguyên, phần tử đầu tiên của mảng nums có giá trị là bao nhiêu?"
    array_question.options = ["99", "-10", "18", "-978"]
    array_question.supportQuote = array_source
    with pytest.raises(ValueError, match="lacks context"):
        validate_draft(PracticeDraft(questions=[array_question]), array_source, 1)

    print_source = 'System.out.println("str1 != str2");'
    copied = numbered_question(1)
    copied.stem = "Đoạn mã Java nào in thông báo về hai chuỗi?"
    copied.options = [print_source, "System.out.println(str1);", "System.out.println(str2);", "System.out.println(true);"]
    copied.supportQuote = print_source
    with pytest.raises(ValueError, match="copies a code example"):
        validate_draft(PracticeDraft(questions=[copied]), print_source, 1)


def test_practice_removes_internal_evidence_id_from_explanation():
    candidate = draft()
    candidate.questions[0].explanation += " Đoạn nguồn EVIDENCE_0007 cho thấy điều này."
    result = validate_draft(candidate, SOURCE, 1)
    assert "EVIDENCE_" not in result.questions[0].explanation


def test_candidate_parser_skips_malformed_items_without_losing_valid_answers():
    result = parse_candidates({'questions': [{'stem': 'short'}, draft().questions[0].model_dump()]})
    assert len(result) == 1
    assert result[0].correctIndex == 0


class VerifiedFixtureModel:
    """Fixture knowledge has answer zero; generated drafts may deliberately disagree."""
    def with_structured_output(self, schema, *, method):
        assert method == "json_schema"
        if "verdicts" in schema.get("properties", {}):
            return self.Verifier()
        return self

    class Verifier:
        async def ainvoke(self, messages):
            indexes = re.findall(r"^Câu (\d+):", messages[1][1], re.MULTILINE)
            return {"verdicts": [{"itemIndex": int(index), "answerIndex": 0,
                                  "qualityAccepted": True} for index in indexes]}


@pytest.mark.asyncio
async def test_prefilter_removes_bad_candidates_before_model_verification(caplog):
    class Model(VerifiedFixtureModel):
        async def ainvoke(self, _messages):
            valid = draft().questions[0]
            meta = valid.model_copy(update={"stem": "Trong chương 3 có mục nào?"})
            missing = valid.model_copy(update={"supportQuote": "Not present in the material"})
            return {"questions": [q.model_dump() for q in [meta, missing, valid, valid]]}

        class Verifier(VerifiedFixtureModel.Verifier):
            async def ainvoke(self, messages):
                assert messages[1][1].count("Nguồn:") == 1
                assert "Trong chương" not in messages[1][1]
                assert "Not present" not in messages[1][1]
                return await super().ainvoke(messages)

    request = PracticeDraftRequest(count=1, material=StudyMaterial(
        materialId="material-1", title="JOIN", mimeType="text/plain",
        contentBase64=base64.b64encode(SOURCE.encode()).decode(),
    ))
    with caplog.at_level(logging.INFO):
        result = await generate_practice(Model(), request)
    assert len(result.questions) == 1
    assert "stage=practice.verify count=1" in caplog.text
    assert "stage=practice.generate" in caplog.text
    assert SOURCE not in caplog.text
    assert result.questions[0].stem not in caplog.text


@pytest.mark.asyncio
@pytest.mark.parametrize("count, expected_candidates", [(5, 8), (20, 24)])
async def test_generation_limits_initial_candidate_budget(count, expected_candidates):
    class Model(VerifiedFixtureModel):
        generated = 0
        requests = []

        async def ainvoke(self, messages):
            size = int(re.search(r"Tạo (\d+) câu ứng viên", messages[1][1]).group(1))
            self.requests.append(size)
            start = self.generated + 1
            self.generated += size
            return {"questions": [numbered_question(n).model_dump()
                                  for n in range(start, self.generated + 1)]}

    model = Model()
    request = PracticeDraftRequest(count=count, material=StudyMaterial(
        materialId="material-1", title="Rules", mimeType="text/plain",
        contentBase64=base64.b64encode("\n".join(numbered_quote(n) for n in range(1, 30)).encode()).decode(),
    ))
    result = await generate_practice(model, request)
    assert len(result.questions) == count
    assert sum(model.requests) == expected_candidates


@pytest.mark.asyncio
async def test_generation_recovers_when_model_returns_malformed_candidate():
    class Model(VerifiedFixtureModel):
        calls = 0

        async def ainvoke(self, _messages):
            self.calls += 1
            return {'questions': [{'stem': 'short'}]} if self.calls == 1 else draft().model_dump()

    model = Model()
    request = PracticeDraftRequest(count=1, material=StudyMaterial(
        materialId='material-1', title='JOIN', mimeType='text/plain',
        contentBase64=base64.b64encode(SOURCE.encode()).decode(),
    ))
    result = await generate_practice(model, request)
    assert model.calls == 2
    assert len(result.questions) == 1


@pytest.mark.asyncio
async def test_generation_uses_selected_material_only():
    class Model(VerifiedFixtureModel):
        async def ainvoke(self, messages):
            assert SOURCE in messages[1][1]
            assert "Mục tiêu toàn bài là 1 câu" in messages[1][1]
            assert "Tạo 1 câu ứng viên" in messages[1][1]
            assert "Mức độ: ADVANCED" in messages[1][1]
            assert "Chủ đề cần ưu tiên: SQL JOIN" in messages[1][1]
            assert "Yêu cầu ôn tập của sinh viên: tập trung vào INNER JOIN" in messages[1][1]
            return draft().model_dump()

    request = PracticeDraftRequest(count=1, difficulty="ADVANCED",
        focusTopic={"code": "JOIN", "name": "SQL JOIN"},
        instruction="tập trung vào INNER JOIN", material=StudyMaterial(
        materialId="material-1", title="JOIN", mimeType="text/plain",
        contentBase64=base64.b64encode(SOURCE.encode()).decode(),
    ))
    result = await generate_practice(Model(), request)
    assert len(result.questions) == 1


@pytest.mark.asyncio
async def test_generation_retries_unverified_answer_once():
    class Model(VerifiedFixtureModel):
        calls = 0

        async def ainvoke(self, messages):
            self.calls += 1
            if self.calls == 1:
                bad = draft()
                bad.questions[0].correctIndex = 1
                return bad.model_dump()
            assert any("Bản nháp trước chưa đạt" in content for _, content in messages)
            return draft().model_dump()

    model = Model()
    request = PracticeDraftRequest(count=1, material=StudyMaterial(
        materialId="material-1", title="JOIN", mimeType="text/plain",
        contentBase64=base64.b64encode(SOURCE.encode()).decode(),
    ))
    result = await generate_practice(model, request)
    assert model.calls == 2
    assert result.questions[0].correctIndex == 0


@pytest.mark.asyncio
async def test_generation_keeps_verified_questions_across_attempts():
    class Model(VerifiedFixtureModel):
        calls = 0

        async def ainvoke(self, _messages):
            self.calls += 1
            start = (self.calls - 1) * 3 + 1
            questions = [numbered_question(number) for number in range(start, start + 3)]
            if self.calls <= 2:
                questions[-1].correctIndex = 1
            return PracticeDraft(questions=questions).model_dump()

    model = Model()
    request = PracticeDraftRequest(count=5, material=StudyMaterial(
        materialId="material-1", title="JOIN", mimeType="text/plain",
        contentBase64=base64.b64encode("\n".join(numbered_quote(n) for n in range(1, 10)).encode()).decode(),
    ))
    result = await generate_practice(model, request)
    assert model.calls == 3
    assert len(result.questions) == 5
    assert result.questions[0].stem.startswith("Phép tính loại 1")


@pytest.mark.asyncio
async def test_generation_replenishes_large_draft_with_verified_questions():
    class Model(VerifiedFixtureModel):
        calls = 0

        async def ainvoke(self, _messages):
            self.calls += 1
            questions = []
            for number in range((self.calls - 1) * 10 + 1, self.calls * 10 + 1):
                item = numbered_question(number)
                if self.calls <= 4 and number % 3 != 0:
                    item.correctIndex = 1
                questions.append(item)
            return PracticeDraft(questions=questions).model_dump()

    model = Model()
    request = PracticeDraftRequest(count=20, material=StudyMaterial(
        materialId='material-1', title='JOIN', mimeType='text/plain',
        contentBase64=base64.b64encode("\n".join(numbered_quote(n) for n in range(1, 61)).encode()).decode(),
    ))
    result = await generate_practice(model, request)
    assert len(result.questions) == 20
    assert model.calls == 6


@pytest.mark.asyncio
async def test_generation_replaces_document_meta_questions_with_new_concepts():
    class Model(VerifiedFixtureModel):
        calls = 0
        repair_prompt = ""

        async def ainvoke(self, messages):
            self.calls += 1
            prompt = messages[1][1]
            if "Bản nháp trước chưa đạt" in prompt:
                self.repair_prompt = prompt
                questions = [numbered_question(number) for number in range(9, 13)]
            else:
                start = (self.calls - 1) * 2 + 1
                questions = [numbered_question(number) for number in range(start, start + 2)]
                meta = numbered_question(start + 12)
                meta.stem = f"Trong chương {start} của tài liệu có mục nào?"
                questions.append(meta)
            return {"questions": [question.model_dump() for question in questions]}

    model = Model()
    request = PracticeDraftRequest(count=12, material=StudyMaterial(
        materialId="material-1", title="Quy tắc", mimeType="text/plain",
        contentBase64=base64.b64encode(
            "\n".join(numbered_quote(number) for number in range(1, 30)).encode()
        ).decode(),
    ))
    result = await generate_practice(model, request)
    assert len(result.questions) == 12
    assert model.calls == 5
    assert "còn thiếu 4 câu hợp lệ" in model.repair_prompt
    assert "Practice question asks about document structure: 4" in model.repair_prompt
    assert all("chương" not in question.stem for question in result.questions)


@pytest.mark.asyncio
@pytest.mark.parametrize("literal_quote", [False, True])
async def test_generation_accepts_paraphrased_answer_only_after_independent_check(literal_quote):
    class Model:
        schema = ""
        verified = False

        def with_structured_output(self, schema, *, method):
            assert method == "json_schema"
            self.schema = "verdicts" if "verdicts" in schema.get("properties", {}) else "questions"
            if self.schema == "questions":
                assert schema["$defs"]["PracticeQuestion"]["properties"]["supportQuote"]["enum"] == ["EVIDENCE_0001"]
            return self

        async def ainvoke(self, messages):
            if self.schema == "verdicts":
                self.verified = True
                assert "correctIndex" not in str(messages)
                return {"verdicts": [{"itemIndex": 0, "answerIndex": 0, "qualityAccepted": True}]}
            item = draft().questions[0].model_copy(deep=True)
            item.options[0] = "Chỉ các bản ghi có giá trị liên kết trùng nhau"
            item.supportQuote = SOURCE if literal_quote else "EVIDENCE_0001"
            return PracticeDraft(questions=[item]).model_dump()

    model = Model()
    request = PracticeDraftRequest(count=1, material=StudyMaterial(
        materialId="material-1", title="JOIN", mimeType="text/plain",
        contentBase64=base64.b64encode(SOURCE.encode()).decode(),
    ))
    result = await generate_practice(model, request)
    assert model.verified
    assert result.questions[0].supportQuote == SOURCE
    assert result.questions[0].options[0] == "Chỉ các bản ghi có giá trị liên kết trùng nhau"


@pytest.mark.asyncio
@pytest.mark.parametrize("literal_quote", [False, True])
@pytest.mark.parametrize("paraphrase, quality_accepted, answer_index", [
    (False, True, 1), (True, True, 1), (False, False, 0),
])
async def test_generation_rejects_answer_when_independent_check_disagrees(
    paraphrase, quality_accepted, answer_index, literal_quote,
):
    class Model:
        schema = ""

        def with_structured_output(self, schema, *, method):
            self.schema = "verdicts" if "verdicts" in schema.get("properties", {}) else "questions"
            return self

        async def ainvoke(self, _messages):
            if self.schema == "verdicts":
                return {"verdicts": [{"itemIndex": 0, "answerIndex": answer_index,
                                      "qualityAccepted": quality_accepted}]}
            item = draft().questions[0].model_copy(deep=True)
            if paraphrase:
                item.options[0] = "Chỉ các bản ghi có giá trị liên kết trùng nhau"
            item.supportQuote = SOURCE if literal_quote else "EVIDENCE_0001"
            return PracticeDraft(questions=[item]).model_dump()

    request = PracticeDraftRequest(count=1, material=StudyMaterial(
        materialId="material-1", title="JOIN", mimeType="text/plain",
        contentBase64=base64.b64encode(SOURCE.encode()).decode(),
    ))
    with pytest.raises(ValueError, match="count mismatch"):
        await generate_practice(Model(), request)
