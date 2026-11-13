from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, model_validator


class TopicMetric(BaseModel):
    topicId: str = Field(min_length=1, max_length=100)
    subjectId: str | None = Field(default=None, max_length=100)
    code: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=150)
    questionCount: int = Field(ge=0)
    earnedPoints: float = Field(ge=0)
    possiblePoints: float = Field(ge=0)
    percentage: int = Field(ge=0, le=100)
    sufficientData: bool
    needsPractice: bool = False


class QuestionMetric(BaseModel):
    questionId: str = Field(min_length=1, max_length=100)
    title: str | None = Field(default=None, max_length=300)
    exposureCount: int = Field(ge=0)
    respondentCount: int = Field(ge=0)
    averagePercentage: int = Field(ge=0, le=100)
    signal: Literal["INSUFFICIENT_DATA", "VERY_HARD", "VERY_EASY", "NORMAL"]


class ClassMetric(BaseModel):
    courseOfferingId: str = Field(min_length=1, max_length=100)
    code: str = Field(min_length=1, max_length=100)
    studentCount: int = Field(ge=0)
    sufficientData: bool
    topics: list[TopicMetric] = Field(max_length=100)


class StudyMaterial(BaseModel):
    materialId: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=150)
    mimeType: Literal[
        "application/pdf", "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    contentBase64: str = Field(min_length=1, max_length=4_200_000)


class ModelSelection(BaseModel):
    model: str | None = Field(default=None, max_length=100, pattern=r"^[A-Za-z0-9._/-]+$")


class ConversationTurn(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    summary: str = Field(max_length=1500)


class StudentRequest(ModelSelection):
    message: str = Field(min_length=1, max_length=500)
    analyzedAttemptCount: int = Field(ge=0)
    limitedToRecentAttempts: bool
    topics: list[TopicMetric] = Field(max_length=100)
    material: StudyMaterial | None = None
    history: list[ConversationTurn] = Field(default_factory=list, max_length=6)


class TeacherRequest(ModelSelection):
    message: str = Field(min_length=1, max_length=500)
    analyzedAttemptCount: int = Field(ge=0)
    limitedToRecentAttempts: bool
    questions: list[QuestionMetric] = Field(max_length=500)
    topics: list[TopicMetric] = Field(max_length=100)
    classes: list[ClassMetric] = Field(default_factory=list, max_length=50)
    history: list[ConversationTurn] = Field(default_factory=list, max_length=6)


class ExamCandidate(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    title: str = Field(max_length=180)
    content: str = Field(max_length=300)
    type: Literal["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "PROGRAMMING"]
    difficulty: Literal["EASY", "MEDIUM", "HARD"]
    topics: list[str] = Field(max_length=10)


class ExamDraftRequest(ModelSelection):
    message: str = Field(min_length=1, max_length=1000)
    desiredCount: int = Field(ge=1, le=100)
    format: Literal["OBJECTIVE", "PROGRAMMING", "MIXED"]
    candidates: list[ExamCandidate] = Field(min_length=1, max_length=500)
    topicTargets: dict[str, int] = Field(default_factory=dict, max_length=30)


class ExamDraftProposal(BaseModel):
    questionIds: list[str] = Field(min_length=1, max_length=100)
    rationale: str = Field(min_length=1, max_length=600)


class PracticeFocusTopic(BaseModel):
    code: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=150)


class TopicSuggestionRequest(ModelSelection):
    title: str = Field(min_length=1, max_length=300)
    content: str = Field(min_length=1, max_length=3000)
    existingTopics: list[PracticeFocusTopic] = Field(max_length=100)


class TopicSuggestion(BaseModel):
    existingCodes: list[str] = Field(max_length=3)
    newCode: str | None = Field(default=None, max_length=50)
    newName: str | None = Field(default=None, max_length=150)
    rationale: str = Field(max_length=400)


class PracticeDraftRequest(ModelSelection):
    material: StudyMaterial
    count: int = Field(ge=1, le=20)
    difficulty: Literal["BASIC", "INTERMEDIATE", "ADVANCED"] = "INTERMEDIATE"
    focusTopic: PracticeFocusTopic | None = None
    instruction: str | None = Field(default=None, max_length=500)


class PracticeQuestion(BaseModel):
    stem: str = Field(min_length=10, max_length=1000)
    options: list[Annotated[str, Field(min_length=1, max_length=300)]] = Field(min_length=4, max_length=4)
    correctIndex: int = Field(ge=0, le=3)
    explanation: str = Field(min_length=10, max_length=500)
    supportQuote: str = Field(min_length=10, max_length=300)
    sourceLocation: str | None = Field(default=None, max_length=100)


class PracticeDraft(BaseModel):
    questions: list[PracticeQuestion] = Field(min_length=1, max_length=20)


class ProgrammingPracticeRequest(PracticeDraftRequest):
    language: Literal["C", "CPP", "JAVA"]


class ProgrammingPracticeTest(BaseModel):
    input: str = Field(max_length=1000)
    expectedOutput: str = Field(min_length=1, max_length=1000)


class ProgrammingPracticeQuestion(BaseModel):
    stem: str = Field(min_length=80, max_length=2000)
    language: Literal["C", "CPP", "JAVA"]
    starterCode: str = Field(max_length=2000)
    referenceSolution: str = Field(min_length=20, max_length=10000)
    testCases: list[ProgrammingPracticeTest] = Field(min_length=2, max_length=3)
    explanation: str = Field(min_length=70, max_length=1000)
    supportQuote: str = Field(min_length=10, max_length=300)
    sourceLocation: str | None = Field(default=None, max_length=100)


class ProgrammingPracticeDraft(BaseModel):
    questions: list[ProgrammingPracticeQuestion] = Field(min_length=1, max_length=20)


class ProgrammingReviewRequest(ModelSelection):
    questionTitle: str = Field(min_length=1, max_length=300)
    questionContent: str = Field(min_length=1, max_length=5000)
    language: Literal["C", "CPP", "JAVA"]
    sourceCode: str = Field(min_length=1, max_length=20000)
    submissionStatus: str = Field(min_length=1, max_length=50)
    passedTestCases: int = Field(ge=0)
    totalTestCases: int = Field(ge=0)
    failureStatuses: list[str] = Field(max_length=20)


class ProgrammingReview(BaseModel):
    summary: str = Field(min_length=1, max_length=800)
    suggestions: list[Annotated[str, Field(min_length=1, max_length=400)]] = Field(max_length=4)
    caveat: str = Field(min_length=1, max_length=300)


class AgentAnswer(BaseModel):
    summary: str = Field(max_length=1500)
    actions: list[Annotated[str, Field(max_length=500)]] = Field(max_length=5)
    evidenceIds: list[Annotated[str, Field(max_length=100)]] = Field(max_length=20)
    caveat: str | None = Field(default=None, max_length=500)


class QuestionSourcePart(BaseModel):
    type: Literal["text", "document", "image"]
    text: str | None = None
    data: str | None = None
    mime_type: Literal["application/pdf", "image/jpeg", "image/png", "image/webp"] | None = None

    @model_validator(mode="after")
    def valid_content(self):
        if self.type == "text" and self.text and not self.data and not self.mime_type:
            return self
        if self.type != "text" and self.data and self.mime_type and not self.text:
            return self
        raise ValueError("Invalid question source part")


class QuestionDraftRequest(ModelSelection):
    model: str = Field(min_length=1, max_length=100, pattern=r"^[A-Za-z0-9._/-]+$")
    systemInstruction: str = Field(min_length=1, max_length=5000)
    prompt: str = Field(min_length=1, max_length=250000)
    contents: list[QuestionSourcePart] = Field(min_length=1, max_length=50)
    responseSchema: dict[str, Any]
    timeoutSeconds: int = Field(ge=10, le=180)
    maxOutputTokens: int = Field(ge=1024, le=65536)

    @model_validator(mode="after")
    def bounded_source(self):
        if sum(len(part.text or part.data or "") for part in self.contents) > 63_000_000:
            raise ValueError("Question sources exceed the size limit")
        return self
