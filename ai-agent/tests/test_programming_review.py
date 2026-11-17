import json

import pytest

from soes_agent.contracts import ProgrammingReviewRequest
from soes_agent.programming_review import review_programming_submission


@pytest.mark.asyncio
async def test_programming_review_uses_judge_summary_without_hidden_cases():
    class Model:
        def with_structured_output(self, schema, *, method):
            assert schema.__name__ == "ProgrammingReview"
            assert method == "function_calling"
            return self

        async def ainvoke(self, messages):
            system, human = messages
            assert "Không suy đoán input" in system[1]
            payload = json.loads(human[1])
            assert payload["passedTestCases"] == 1
            assert payload["failureStatuses"] == ["WRONG_ANSWER: 1"]
            assert "expectedOutput" not in payload
            assert payload["sourceCode"] == "int main() { return 0; }"
            return {
                "summary": "Một test chưa đạt.",
                "suggestions": ["Kiểm tra điều kiện biên trong vòng lặp."],
                "caveat": "Giảng viên cần rà soát; điểm Judge không thay đổi.",
            }

    answer = await review_programming_submission(Model(), ProgrammingReviewRequest(
        questionTitle="Tính tổng", questionContent="Nhập n và tính tổng.", language="C",
        sourceCode="int main() { return 0; }", submissionStatus="WRONG_ANSWER",
        passedTestCases=1, totalTestCases=2, failureStatuses=["WRONG_ANSWER: 1"],
    ))
    assert answer.summary == "Một test chưa đạt."


@pytest.mark.asyncio
async def test_programming_review_cannot_recommend_changing_judge_score():
    class Model:
        def with_structured_output(self, _schema, *, method):
            return self

        async def ainvoke(self, _messages):
            return {
                "summary": "Nên tăng điểm cho bài này.",
                "suggestions": ["Cộng điểm vì mã có vẻ đúng."],
                "caveat": "Giảng viên xem lại.",
            }

    answer = await review_programming_submission(Model(), ProgrammingReviewRequest(
        questionTitle="Tính tổng", questionContent="Nhập n và tính tổng.", language="C",
        sourceCode="int main() { return 0; }", submissionStatus="WRONG_ANSWER",
        passedTestCases=1, totalTestCases=2, failureStatuses=["WRONG_ANSWER: 1"],
    ))
    assert answer.summary.startswith("Judge ghi nhận 1/2")
    assert answer.suggestions == []
    assert "điểm Judge không thay đổi" in answer.caveat


@pytest.mark.asyncio
async def test_review_receives_only_explicit_public_failure_and_compiler_evidence():
    class Model:
        def with_structured_output(self, _schema, *, method):
            return self

        async def ainvoke(self, messages):
            payload = json.loads(messages[1][1])
            assert payload["publicTestFailures"] == [{
                "input": "2", "expectedOutput": "4", "actualOutput": "3",
                "status": "WRONG_ANSWER", "errorMessage": None,
            }]
            assert payload["compilerOutput"] is None
            assert "test case ẩn" in messages[0][1]
            return {"summary": "Ví dụ công khai cho ra 3 thay vì 4.",
                    "suggestions": ["Kiểm tra phép tính với đầu vào 2."],
                    "caveat": "Giảng viên cần rà soát; điểm Judge không thay đổi."}

    answer = await review_programming_submission(Model(), ProgrammingReviewRequest(
        questionTitle="Bình phương", questionContent="Đọc n và in n*n", language="C",
        sourceCode="int main() { return 0; }", submissionStatus="WRONG_ANSWER",
        passedTestCases=0, totalTestCases=2, failureStatuses=["WRONG_ANSWER: 2"],
        publicTestFailures=[{"input": "2", "expectedOutput": "4", "actualOutput": "3",
                             "status": "WRONG_ANSWER", "errorMessage": None}],
    ))
    assert "3 thay vì 4" in answer.summary


@pytest.mark.asyncio
async def test_algorithm_and_complexity_need_exact_code_evidence():
    source = "for (int i = 0; i < n; i++) { sum += values[i]; }"

    class Model:
        def with_structured_output(self, _schema, *, method):
            return self

        async def ainvoke(self, _messages):
            return {
                "summary": "Judge ghi nhận 2/2 test đạt.",
                "approach": "Duyệt mảng một lượt để tính tổng.",
                "approachEvidence": "sum += values[i];",
                "timeComplexity": "O(n)",
                "timeComplexityEvidence": "for (int i = 0; i < n; i++)",
                "spaceComplexity": "O(n)",
                "spaceComplexityEvidence": "int[] copy = new int[n];",
                "complexityReasoning": "n là số phần tử; vòng lặp duyệt n lần.",
                "suggestions": ["Đặt tên biến sum rõ nghĩa."],
                "caveat": "Giảng viên cần rà soát; điểm Judge không thay đổi.",
            }

    answer = await review_programming_submission(Model(), ProgrammingReviewRequest(
        questionTitle="Tính tổng", questionContent="Tính tổng n phần tử.", language="JAVA",
        sourceCode=source, submissionStatus="ACCEPTED", passedTestCases=2,
        totalTestCases=2, failureStatuses=[],
    ))
    assert answer.approach == "Duyệt mảng một lượt để tính tổng."
    assert answer.timeComplexity == "O(n)"
    assert answer.spaceComplexity is None
    assert answer.spaceComplexityEvidence is None
