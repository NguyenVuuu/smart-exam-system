from typing import Annotated, Literal

from pydantic import BaseModel, Field


class TopicMetric(BaseModel):
    topicId: str = Field(min_length=1, max_length=100)
    code: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=150)
    questionCount: int = Field(ge=0)
    earnedPoints: float = Field(ge=0)
    possiblePoints: float = Field(ge=0)
    percentage: int = Field(ge=0, le=100)
    sufficientData: bool


class QuestionMetric(BaseModel):
    questionId: str = Field(min_length=1, max_length=100)
    exposureCount: int = Field(ge=0)
    averagePercentage: int = Field(ge=0, le=100)
    signal: Literal["INSUFFICIENT_DATA", "VERY_HARD", "VERY_EASY", "NORMAL"]


class StudyMaterial(BaseModel):
    materialId: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=150)
    mimeType: Literal[
        "application/pdf", "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    contentBase64: str = Field(min_length=1, max_length=4_200_000)


class StudentRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    analyzedAttemptCount: int = Field(ge=0)
    limitedToRecentAttempts: bool
    topics: list[TopicMetric] = Field(max_length=100)
    material: StudyMaterial | None = None


class TeacherRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    analyzedAttemptCount: int = Field(ge=0)
    limitedToRecentAttempts: bool
    questions: list[QuestionMetric] = Field(max_length=500)
    topics: list[TopicMetric] = Field(max_length=100)


class ExamMatrixRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    desiredCount: int = Field(ge=1, le=100)
    format: Literal["OBJECTIVE", "PROGRAMMING", "MIXED"]
    availableEasy: int = Field(ge=0)
    availableMedium: int = Field(ge=0)
    availableHard: int = Field(ge=0)


class ExamMatrixProposal(BaseModel):
    easyCount: int = Field(ge=0, le=100)
    mediumCount: int = Field(ge=0, le=100)
    hardCount: int = Field(ge=0, le=100)
    rationale: str = Field(max_length=500)


class AgentAnswer(BaseModel):
    summary: str = Field(max_length=1500)
    actions: list[Annotated[str, Field(max_length=500)]] = Field(max_length=5)
    evidenceIds: list[Annotated[str, Field(max_length=100)]] = Field(max_length=20)
    caveat: str | None = Field(default=None, max_length=500)
