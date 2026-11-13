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

# Ẩn cảnh báo vô hại của Google GenAI về schema $defs
logging.getLogger("langchain_google_genai._function_utils").setLevel(logging.ERROR)

from .contracts import AgentAnswer, ExamDraftProposal, ExamDraftRequest, PracticeDraft, PracticeDraftRequest, ProgrammingPracticeDraft, ProgrammingPracticeRequest, ProgrammingReview, ProgrammingReviewRequest, QuestionDraftRequest, StudentRequest, TeacherRequest, TopicSuggestion, TopicSuggestionRequest
from .exam_draft import propose_exam_draft, suggest_topic
from .practice import generate_practice
from .programming_practice import generate_programming_practice
from .programming_review import review_programming_submission
from .question_generation import generate_question_draft
from .workflows import run_student, run_teacher

load_dotenv(Path(__file__).resolve().parents[2] / '.env')
app = FastAPI(title="SOES AI Agent", docs_url=None, redoc_url=None)
logger = logging.getLogger(__name__)


@app.exception_handler(GoogleRateLimitError)
async def model_rate_limited(_request: Request, _error: GoogleRateLimitError) -> JSONResponse:
    logger.warning("AI provider rate limited category=%s code=%s",
                   type(_error).__name__, getattr(_error, "code", ""))
    return JSONResponse(status_code=429, content={"detail": "AI model rate limit reached"})


@app.exception_handler(GoogleAPIError)
async def model_unavailable(_request: Request, _error: GoogleAPIError) -> JSONResponse:
    logger.warning("AI provider unavailable category=%s code=%s",
                   type(_error).__name__, getattr(_error, "code", ""))
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
                        getattr(request.state, "model", os.environ.get("AI_AGENT_MODEL", "gemini-3.5-flash-lite")))


def require_service(authorization: str = Header(default="")) -> None:
    secret = os.environ.get("AI_AGENT_SHARED_SECRET", "")
    if not secret or not compare_digest(authorization, f"Bearer {secret}"):
        raise HTTPException(status_code=401, detail="Unauthorized")


def get_model(timeout_seconds: int = 60, max_output_tokens: int | None = None,
              model_name: str | None = None) -> ChatGoogleGenerativeAI:
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Model is not configured")

    selected_model = model_name or os.environ.get("AI_AGENT_MODEL", "gemini-3.5-flash-lite")

    return ChatGoogleGenerativeAI(
        model=selected_model,
        api_key=api_key,
        thinking_level="low",
        timeout=timeout_seconds,
        max_retries=3,
        max_output_tokens=max_output_tokens,
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/student/insights", response_model=AgentAnswer, dependencies=[Depends(require_service)])
async def student_insights(request: StudentRequest, http_request: Request) -> AgentAnswer:
    http_request.state.model = request.model or os.environ.get("AI_AGENT_MODEL", "gemini-3.5-flash-lite")
    try:
        return await run_student(get_model(model_name=request.model), request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/v1/teacher/insights", response_model=AgentAnswer, dependencies=[Depends(require_service)])
async def teacher_insights(request: TeacherRequest, http_request: Request) -> AgentAnswer:
    http_request.state.model = request.model or os.environ.get("AI_AGENT_MODEL", "gemini-3.5-flash-lite")
    return await run_teacher(get_model(model_name=request.model), request)


@app.post("/v1/student/practice-draft", response_model=PracticeDraft, dependencies=[Depends(require_service)])
async def student_practice_draft(request: PracticeDraftRequest, http_request: Request) -> PracticeDraft:
    http_request.state.model = request.model or os.environ.get("AI_AGENT_MODEL", "gemini-3.5-flash-lite")
    try:
        return await generate_practice(get_model(model_name=request.model), request)
    except ValueError as exc:
        reason = str(exc)
        allowed_reasons = {
            "Material cannot be read", "Material has no readable text",
            "Material has no usable evidence", "Material text exceeds the size limit",
            "Practice question count mismatch", "Practice question asks about document structure",
            "Practice question is missing Vietnamese diacritics", "Practice question lacks context",
            "Practice option contains a placeholder", "Duplicate practice content", "Duplicate practice source",
            "Practice question lacks a source quote",
            "Practice question cites a table of contents entry", "Practice question cites a heading",
            "Practice question copies a code example",
            "Practice answer is not uniquely supported by its source quote",
            "Not enough valid practice questions",
            "Practice explanation is too short",
        }
        reason = reason if reason in allowed_reasons else "Practice draft validation failed"
        logger.warning("Practice draft rejected reason=%s error_type=%s", reason, type(exc).__name__)
        raise HTTPException(status_code=422, detail=reason) from exc


@app.post("/v1/student/programming-practice-draft", response_model=ProgrammingPracticeDraft,
          dependencies=[Depends(require_service)])
async def student_programming_practice_draft(request: ProgrammingPracticeRequest,
                                             http_request: Request) -> ProgrammingPracticeDraft:
    http_request.state.model = request.model or os.environ.get("AI_AGENT_MODEL", "gemini-3.5-flash-lite")
    try:
        return await generate_programming_practice(get_model(model_name=request.model), request)
    except ValueError as exc:
        logger.warning("Programming practice draft rejected reason=%s", str(exc))
        raise HTTPException(status_code=422, detail="Could not create verified programming practice") from exc


@app.post("/v1/teacher/exam-draft", response_model=ExamDraftProposal, dependencies=[Depends(require_service)])
async def teacher_exam_draft(request: ExamDraftRequest, http_request: Request) -> ExamDraftProposal:
    http_request.state.model = request.model or os.environ.get("AI_AGENT_MODEL", "gemini-3.5-flash-lite")
    try:
        return await propose_exam_draft(get_model(model_name=request.model), request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="AI could not select enough valid exam questions") from exc


@app.post("/v1/teacher/topic-suggestion", response_model=TopicSuggestion, dependencies=[Depends(require_service)])
async def teacher_topic_suggestion(request: TopicSuggestionRequest, http_request: Request) -> TopicSuggestion:
    http_request.state.model = request.model or os.environ.get("AI_AGENT_MODEL", "gemini-3.5-flash-lite")
    return await suggest_topic(get_model(model_name=request.model), request)


@app.post("/v1/teacher/programming-review", response_model=ProgrammingReview, dependencies=[Depends(require_service)])
async def teacher_programming_review(request: ProgrammingReviewRequest, http_request: Request) -> ProgrammingReview:
    http_request.state.model = request.model or os.environ.get("AI_AGENT_MODEL", "gemini-3.5-flash-lite")
    return await review_programming_submission(get_model(model_name=request.model), request)


@app.post("/v1/teacher/question-draft", dependencies=[Depends(require_service)])
async def teacher_question_draft(request: QuestionDraftRequest, http_request: Request) -> dict:
    http_request.state.model = request.model
    try:
        return await generate_question_draft(
            get_model(request.timeoutSeconds, request.maxOutputTokens, request.model), request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Invalid question draft") from exc
