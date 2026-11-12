"""Check the private HTTP endpoint with synthetic evidence only."""

import os
import argparse
import base64
from pathlib import Path

import httpx
from dotenv import load_dotenv

from soes_agent.contracts import AgentAnswer, PracticeDraft


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--practice", action="store_true", help="Also generate one synthetic practice question")
    arguments = parser.parse_args()
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    secret = os.environ.get("AI_AGENT_SHARED_SECRET")
    if not secret:
        raise RuntimeError("Configure the local agent before running this check")
    response = httpx.post(
        "http://127.0.0.1:8001/v1/student/insights",
        headers={"Authorization": f"Bearer {secret}"},
        json={
            "message": "Tôi nên ôn SQL JOIN thế nào?",
            "analyzedAttemptCount": 2,
            "limitedToRecentAttempts": False,
            "topics": [{
                "topicId": "topic-join", "code": "JOIN", "name": "SQL JOIN",
                "questionCount": 8, "earnedPoints": 3, "possiblePoints": 8,
                "percentage": 38, "sufficientData": True,
            }],
        },
        timeout=60,
    )
    response.raise_for_status()
    answer = AgentAnswer.model_validate(response.json())
    if "topic-join" not in answer.evidenceIds:
        raise RuntimeError("Agent response omitted the supplied evidence ID")
    print("Local agent HTTP smoke check passed")

    if arguments.practice:
        source = (
            "INNER JOIN chỉ trả các hàng có khóa khớp ở hai bảng. "
            "LEFT JOIN giữ toàn bộ hàng ở bảng bên trái. "
            "PRIMARY KEY định danh duy nhất một hàng trong bảng."
        )
        practice_response = httpx.post(
            "http://127.0.0.1:8001/v1/student/practice-draft",
            headers={"Authorization": f"Bearer {secret}"},
            json={
                "count": 1,
                "difficulty": "BASIC",
                "material": {
                    "materialId": "material-sql", "title": "SQL cơ bản",
                    "mimeType": "text/plain",
                    "contentBase64": base64.b64encode(source.encode()).decode(),
                },
            },
            timeout=60,
        )
        practice_response.raise_for_status()
        draft = PracticeDraft.model_validate(practice_response.json())
        if len(draft.questions) != 1:
            raise RuntimeError("Practice response contained the wrong number of questions")
        print("Local practice draft smoke check passed")


if __name__ == "__main__":
    main()
