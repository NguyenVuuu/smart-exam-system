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
