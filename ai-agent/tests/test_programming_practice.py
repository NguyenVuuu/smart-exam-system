import base64

import pytest

from soes_agent.contracts import ProgrammingPracticeQuestion, ProgrammingPracticeRequest, StudyMaterial
from soes_agent.programming_practice import generate_programming_practice, validate_programming_questions


SOURCE = "Vòng lặp for lặp qua các phần tử của một mảng theo chỉ số."


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
    assert len(validate_programming_questions([question()], SOURCE, request()).questions) == 1
    invalid = question().model_copy(update={"supportQuote": "Kiến thức không có trong tài liệu"})
    with pytest.raises(ValueError, match="invalid"):
        validate_programming_questions([invalid], SOURCE, request())
    invalid = question().model_copy(update={"language": "C"})
    with pytest.raises(ValueError, match="invalid"):
        validate_programming_questions([invalid], SOURCE, request())


@pytest.mark.asyncio
async def test_programming_practice_uses_selected_material_and_requested_count():
    class Model:
        def with_structured_output(self, _schema, *, method):
            assert method == "function_calling"
            return self

        async def ainvoke(self, messages):
            assert SOURCE in messages[1][1]
            assert "Tạo đúng 1 bài viết mã" in messages[1][1]
            return {"questions": [question().model_dump()]}

    result = await generate_programming_practice(Model(), request())
    assert result.questions[0].language == "JAVA"
