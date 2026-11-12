import json
from typing import Any, TypedDict

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, START, StateGraph

from .contracts import AgentAnswer, StudentRequest, TeacherRequest


class AgentState(TypedDict, total=False):
    request: dict[str, Any]
    evidence: dict[str, Any]
    answer: dict[str, Any]


def build_evidence(state: AgentState) -> AgentState:
    request = state["request"]
    return {"evidence": {
        "analyzedAttemptCount": request["analyzedAttemptCount"],
        "limitedToRecentAttempts": request["limitedToRecentAttempts"],
        "topics": request["topics"],
        "questions": request.get("questions", []),
    }}


def create_workflow(model: ChatGoogleGenerativeAI, role: str):
    structured = model.with_structured_output(AgentAnswer)

    async def explain(state: AgentState) -> AgentState:
        if not state["evidence"]["analyzedAttemptCount"]:
            return {"answer": AgentAnswer(
                summary="Chưa có kết quả đủ điều kiện để phân tích.",
                actions=[], evidenceIds=[], caveat="Chỉ phân tích kết quả đã công bố và được phép xem lại.",
            ).model_dump()}
        response = await structured.ainvoke([
            ("system", (
                "Bạn là trợ lý học tập của hệ thống thi SOES. Chỉ dùng dữ liệu thống kê "
                "được cung cấp. Không suy đoán điểm, đáp án, câu hỏi hoặc thông tin cá nhân. "
                "Chỉ dẫn các topicId hoặc questionId thật trong evidenceIds. "
                "Nếu sufficientData=false hoặc signal=INSUFFICIENT_DATA, nói rõ chưa đủ dữ liệu. "
                "Nếu limitedToRecentAttempts=true, nói rõ đây chỉ là mẫu gần đây. "
                "Đề xuất hành động ngắn, cụ thể bằng tiếng Việt. "
                f"Vai trò hiện tại: {role}."
            )),
            ("human", json.dumps({
                "request": state["request"]["message"],
                "evidence": state["evidence"],
            }, ensure_ascii=False)),
        ])
        answer = AgentAnswer.model_validate(response)
        allowed = {item["topicId"] for item in state["evidence"]["topics"]}
        allowed.update(item["questionId"] for item in state["evidence"]["questions"])
        answer.evidenceIds = [item for item in answer.evidenceIds if item in allowed]
        return {"answer": answer.model_dump()}

    graph = StateGraph(AgentState)
    graph.add_node("prepare_evidence", build_evidence)
    graph.add_node("explain", explain)
    graph.add_edge(START, "prepare_evidence")
    graph.add_edge("prepare_evidence", "explain")
    graph.add_edge("explain", END)
    return graph.compile()


async def run_student(model: ChatGoogleGenerativeAI, request: StudentRequest) -> AgentAnswer:
    graph = create_workflow(model, "sinh viên")
    result = await graph.ainvoke({"request": request.model_dump()})
    return AgentAnswer.model_validate(result["answer"])


async def run_teacher(model: ChatGoogleGenerativeAI, request: TeacherRequest) -> AgentAnswer:
    graph = create_workflow(model, "giảng viên")
    result = await graph.ainvoke({"request": request.model_dump()})
    return AgentAnswer.model_validate(result["answer"])
