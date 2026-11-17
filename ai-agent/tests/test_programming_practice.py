import base64

import pytest

from soes_agent.contracts import ProgrammingPracticeQuestion, ProgrammingPracticeRequest, StudyMaterial
from soes_agent.programming_practice import generate_programming_practice, review_programming_questions


SOURCE = "Vòng lặp for lặp qua các phần tử của một mảng theo chỉ số."


@pytest.fixture(autouse=True)
def isolate_external_review(monkeypatch):
    async def no_web(*_args):
        return "", []

    async def accept_instruction(_model, _instruction, items, **_kwargs):
        return set(range(len(items)))

    monkeypatch.setattr("soes_agent.programming_practice.retrieve_programming_web", no_web)
    monkeypatch.setattr("soes_agent.programming_practice.verify_instruction_fulfillment", accept_instruction)


def request(count: int = 1) -> ProgrammingPracticeRequest:
    return ProgrammingPracticeRequest(
        count=count,
        language="JAVA",
        instruction="Viết chương trình Java dùng vòng lặp for",
        material=StudyMaterial(
            materialId="material-1", title="Java", mimeType="text/plain",
            contentBase64=base64.b64encode(SOURCE.encode()).decode(),
        ),
    )


def question() -> ProgrammingPracticeQuestion:
    return ProgrammingPracticeQuestion(
        stem="Cho một số nguyên dương n. In lần lượt các số từ 1 đến n, cách nhau bằng dấu cách. "
             "Đầu vào gồm một số n; đầu ra là một dòng chứa các số theo thứ tự tăng dần.",
        language="JAVA",
        starterCode="public class Main { public static void main(String[] args) { } }",
        referenceSolution="import java.util.*; class Main { public static void main(String[] args) { Scanner s = new Scanner(System.in); int n = s.nextInt(); for (int i=1;i<=n;i++) System.out.print(i + \" \" ); } }",
        testCases=[{"input": "1", "expectedOutput": "1 "}, {"input": "3", "expectedOutput": "1 2 3 "}],
        explanation="Đọc n rồi dùng vòng lặp for để duyệt từng số từ 1 đến n. "
                    "Sau mỗi lần lặp, ghi số hiện tại và một dấu cách ra đầu ra chuẩn.",
        supportQuote=SOURCE,
    )


def test_programming_practice_requires_matching_language_and_source():
    accepted, issues = review_programming_questions([question()], SOURCE, request())
    assert len(accepted) == 1
    assert not issues
    invalid = question().model_copy(update={"supportQuote": "Kiến thức không có trong tài liệu"})
    accepted, issues = review_programming_questions([invalid], SOURCE, request())
    assert not accepted
    assert issues["Programming practice source quote is invalid"] == 1
    invalid = question().model_copy(update={"language": "C"})
    accepted, issues = review_programming_questions([invalid], SOURCE, request())
    assert not accepted
    assert issues["Programming practice language mismatch"] == 1
    contents = "Vòng lặp for trong Java........................12"
    invalid = question().model_copy(update={"supportQuote": contents})
    accepted, issues = review_programming_questions([invalid], SOURCE + "\n" + contents, request())
    assert not accepted
    assert issues["Programming practice source quote is invalid"] == 1
    excluded_request = request().model_copy(update={"excludedStems": [question().stem]})
    accepted, issues = review_programming_questions([question()], SOURCE, excluded_request)
    assert not accepted
    assert issues["Duplicate programming practice question"] == 1


@pytest.mark.asyncio
async def test_programming_practice_uses_selected_material_and_requested_count():
    class Model:
        def with_structured_output(self, _schema, *, method):
            assert method == "function_calling"
            return self

        async def ainvoke(self, messages):
            assert SOURCE in messages[1][1]
            assert "Tạo đúng 2 bài viết mã" in messages[1][1]
            return {"questions": [question().model_copy(update={"supportQuote": "EVIDENCE_0001"}).model_dump()]}

    result = await generate_programming_practice(Model(), request())
    assert result.questions[0].language == "JAVA"
    assert result.questions[0].supportQuote == SOURCE


@pytest.mark.asyncio
async def test_programming_practice_accepts_grounded_web_when_course_material_has_no_topic(monkeypatch):
    web_source = "Vòng lặp for trong Java duyệt lần lượt từng giá trị từ điểm bắt đầu đến điểm kết thúc."

    async def grounded_web(_topic, _language, model_name):
        assert model_name == "gemini-3.6-flash"
        return web_source, ["https://docs.oracle.com/javase/tutorial/java/nutsandbolts/for.html"]

    monkeypatch.setattr("soes_agent.programming_practice.retrieve_programming_web", grounded_web)

    class Model:
        model = "gemini-3.6-flash"

        def with_structured_output(self, _schema, *, method):
            return self

        async def ainvoke(self, messages):
            assert web_source in messages[1][1]
            return {"questions": [question().model_copy(update={"supportQuote": "EVIDENCE_0001"}).model_dump()]}

    result = await generate_programming_practice(Model(), request())
    assert result.questions[0].supportQuote == web_source
    assert result.questions[0].sourceUrls == ["https://docs.oracle.com/javase/tutorial/java/nutsandbolts/for.html"]


@pytest.mark.asyncio
async def test_programming_practice_replaces_invalid_candidate_without_discarding_valid_one():
    second = question().model_copy(update={
        "stem": "Cho số nguyên dương n. In tổng các số từ 1 đến n bằng vòng lặp for. "
                "Đầu vào là n; đầu ra là tổng trên một dòng. Ví dụ n bằng 3 thì in 6.",
    })

    class Model:
        calls = 0

        def with_structured_output(self, _schema, *, method):
            return self

        async def ainvoke(self, messages):
            self.calls += 1
            if self.calls == 1:
                assert "Tạo đúng 4 bài viết mã" in messages[1][1]
                invalid = second.model_copy(update={"supportQuote": "Nguồn không tồn tại"})
                return {"questions": [question().model_copy(update={"supportQuote": "EVIDENCE_0001"}).model_dump(),
                                      invalid.model_dump()]}
            assert "Tạo đúng 2 bài viết mã" in messages[1][1]
            assert question().stem in messages[1][1]
            return {"questions": [second.model_copy(update={"supportQuote": "EVIDENCE_0001"}).model_dump()]}

    model = Model()
    result = await generate_programming_practice(model, request(2))
    assert len(result.questions) == 2
    assert model.calls == 2


@pytest.mark.asyncio
async def test_programming_practice_retries_schema_invalid_candidate():
    class Model:
        calls = 0

        def with_structured_output(self, _schema, *, method):
            return self

        async def ainvoke(self, _messages):
            self.calls += 1
            candidate = question().model_copy(update={"supportQuote": "EVIDENCE_0001"}).model_dump()
            if self.calls == 1:
                candidate.pop("testCases")
            return {"questions": [candidate]}

    model = Model()
    result = await generate_programming_practice(model, request())
    assert len(result.questions) == 1
    assert model.calls == 2


@pytest.mark.asyncio
async def test_programming_practice_returns_valid_partial_batch_for_caller_replenishment():
    second = question().model_copy(update={
        "stem": "Cho một dãy số nguyên và sử dụng vòng lặp để tính tổng các phần tử trong dãy. "
                "Đầu vào gồm số phần tử và các giá trị; đầu ra là tổng được in trên một dòng.",
    })

    class Model:
        calls = 0

        def with_structured_output(self, _schema, *, method):
            return self

        async def ainvoke(self, _messages):
            self.calls += 1
            invalid = second.model_copy(update={"supportQuote": "EVIDENCE_0001"}).model_dump()
            invalid["testCases"] = invalid["testCases"][:1]
            return {"questions": [
                question().model_copy(update={"supportQuote": "EVIDENCE_0001"}).model_dump(),
                invalid,
            ]}

    model = Model()
    result = await generate_programming_practice(model, request(2))
    assert len(result.questions) == 1
    assert result.questions[0].stem == question().stem
    assert model.calls == 3
