import os
from hmac import compare_digest

from fastapi import Depends, FastAPI, Header, HTTPException
from langchain_google_genai import ChatGoogleGenerativeAI

from .contracts import AgentAnswer, ExamMatrixProposal, ExamMatrixRequest, PracticeDraft, PracticeDraftRequest, StudentRequest, TeacherRequest
from .practice import generate_practice
from .workflows import propose_exam_matrix, run_student, run_teacher

app = FastAPI(title="SOES AI Agent", docs_url=None, redoc_url=None)


def require_service(authorization: str = Header(default="")) -> None:
    secret = os.environ.get("AI_AGENT_SHARED_SECRET", "")
    if not secret or not compare_digest(authorization, f"Bearer {secret}"):
        raise HTTPException(status_code=401, detail="Unauthorized")


def get_model() -> ChatGoogleGenerativeAI:
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Model is not configured")
    return ChatGoogleGenerativeAI(
        model=os.environ.get("AI_AGENT_MODEL", "gemini-2.5-flash"),
        api_key=api_key,
        temperature=0,
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/student/insights", response_model=AgentAnswer, dependencies=[Depends(require_service)])
async def student_insights(request: StudentRequest) -> AgentAnswer:
    try:
        return await run_student(get_model(), request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/v1/teacher/insights", response_model=AgentAnswer, dependencies=[Depends(require_service)])
async def teacher_insights(request: TeacherRequest) -> AgentAnswer:
    return await run_teacher(get_model(), request)


@app.post("/v1/student/practice-draft", response_model=PracticeDraft, dependencies=[Depends(require_service)])
async def student_practice_draft(request: PracticeDraftRequest) -> PracticeDraft:
    try:
        return await generate_practice(get_model(), request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/v1/teacher/exam-matrix", response_model=ExamMatrixProposal, dependencies=[Depends(require_service)])
async def teacher_exam_matrix(request: ExamMatrixRequest) -> ExamMatrixProposal:
    return await propose_exam_matrix(get_model(), request)
