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
