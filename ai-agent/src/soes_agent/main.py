import os
import logging
from hmac import compare_digest
from pathlib import Path
from time import perf_counter

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_genai.chat_models import GoogleAPIError, GoogleRateLimitError

from .contracts import AgentAnswer, ExamMatrixProposal, ExamMatrixRequest, PracticeDraft, PracticeDraftRequest, StudentRequest, TeacherRequest
from .practice import generate_practice
from .workflows import propose_exam_matrix, run_student, run_teacher

load_dotenv(Path(__file__).resolve().parents[2] / '.env')
app = FastAPI(title="SOES AI Agent", docs_url=None, redoc_url=None)
logger = logging.getLogger(__name__)


@app.exception_handler(GoogleRateLimitError)
@app.exception_handler(GoogleAPIError)
async def model_unavailable(_request: Request, _error: GoogleAPIError | GoogleRateLimitError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": "AI model is temporarily unavailable"})


@app.middleware("http")
async def log_agent_request(request: Request, call_next):
    started = perf_counter()
    status = 500
    try:
        response = await call_next(request)
        status = response.status_code
        return response
    finally:
        if request.url.path.startswith("/v1/"):
            logger.info("AI workflow=%s status=%s elapsed_ms=%s model=%s",
                        request.url.path, status, round((perf_counter() - started) * 1000),
                        os.environ.get("AI_AGENT_MODEL", "gemini-3.5-flash"))


def require_service(authorization: str = Header(default="")) -> None:
    secret = os.environ.get("AI_AGENT_SHARED_SECRET", "")
    if not secret or not compare_digest(authorization, f"Bearer {secret}"):
        raise HTTPException(status_code=401, detail="Unauthorized")


def get_model() -> ChatGoogleGenerativeAI:
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Model is not configured")
    return ChatGoogleGenerativeAI(
        model=os.environ.get("AI_AGENT_MODEL", "gemini-3.5-flash"),
        api_key=api_key,
        thinking_level="low",
        timeout=50,
        max_retries=1,
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
