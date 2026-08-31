import { apiClient as axios } from '../../../api/axios'
import type {
  TakeExamQuestion,
  TakeExamQuestionType,
  TakeExamSession,
} from '../types/take-exam.types'

interface BaseResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface StartExamRequest {
  password?: string
  webcamConfirmed?: boolean
}

export interface StartExamResponse {
  attemptId: string
  startedAt: string
  attemptEndAt: string
  remainingSeconds: number
}

export interface SaveAnswerPayload {
  questionId: string
  answer: string | string[]
}

export interface SubmitExamResponse {
  totalScore?: number
}

export interface AttemptResult {
  available: boolean
  releaseMode: 'IMMEDIATE' | 'MANUAL' | 'SCHEDULED' | 'NEVER'
  releaseAt: string | null
  score: number | null
  maxScore: number | null
  reviewPolicy: 'NONE' | 'SCORE_ONLY' | 'ANSWERS_NO_KEY' | 'FULL_AFTER_RELEASE' | null
  reason: 'AVAILABLE' | 'GRADING' | 'PENDING_RELEASE' | 'NEVER'
}

// ─── Run code (programming questions) ────────────────────────────────────────

export interface RunCodeTestCase {
  testCaseId: string
  isSample: true
  status: 'PASSED' | 'WRONG_ANSWER' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'SYSTEM_ERROR'
  input: string
  expectedOutput: string
  actualOutput: string | null
  executionTimeMs: number
  memoryUsedKb: number
}

export interface RunCodeResponse {
  questionId: string
  remainingSeconds: number
  isOnline: boolean
  compilationStatus: 'COMPILED' | 'COMPILE_ERROR'
  compilerOutput: string | null
  runtimeError: string | null
  hasSystemError: boolean
  summary: {
    passedCount: number
    totalCount: number
    message: string
  }
  testCases: RunCodeTestCase[]
}

export interface AttemptStatus {
  attemptId: string
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'GRADING' | 'GRADED' | 'PUBLISHED' | 'EXPIRED' | 'INVALIDATED'
  startedAt: string
  attemptEndAt: string
  submittedAt: string | null
  endedBy: 'STUDENT' | 'TIMEOUT' | 'SYSTEM' | null
  remainingSeconds: number
  lastSavedAt: string | null
  isOnline: boolean
  answeredCount: number
  totalQuestionCount: number
}

const BASE_URL = '/student/exam-schedules'

interface ApiExamIntegritySettings {
  enableWebcam?: boolean
  blockCopyPaste?: boolean
  blockRightClick?: boolean
}

// Raw question shape returned by GET /student/exam-schedules/:scheduleId/attempts/:attemptId
interface ApiTakeExamQuestion {
  id: string
  orderIndex: number
  content: string
  type: string
  points: number
  options?: { id: string; content: string }[]
  answer?: string[]
  draftSourceCode?: string | null
  language?: string
  programmingConfig?: {
    timeLimitMs: number
    memoryLimitMb: number
    maxCodeSizeKb: number
  }
}

function toTakeExamQuestion(q: ApiTakeExamQuestion): TakeExamQuestion {
  const type: TakeExamQuestionType = q.type === 'PROGRAMMING' ? 'CODING' : q.type as TakeExamQuestionType
  const isCoding = type === 'CODING'

  return {
    id: q.id,
    orderIndex: q.orderIndex,
    type,
    content: q.content,
    points: q.points,
    language: isCoding ? (q.language as TakeExamQuestion['language']) : undefined,
    starterCode: isCoding ? (q.draftSourceCode ?? '') : undefined,
    programmingConfig: isCoding ? q.programmingConfig : undefined,
    options: isCoding ? undefined : q.options,
    answer: isCoding
      ? (q.draftSourceCode ?? undefined)
      : q.answer && q.answer.length > 0
        ? (type === 'MULTIPLE_CHOICE' ? q.answer : q.answer[0])
        : undefined,
  }
}

export const takeExamApi = {
  startExam: async (scheduleId: string, data?: StartExamRequest): Promise<StartExamResponse> => {
    const response = await axios.post<BaseResponse<StartExamResponse>>(`${BASE_URL}/${scheduleId}/start`, data ?? {})
    return response.data.data
  },

  getExamAttempt: async (scheduleId: string, attemptId: string): Promise<TakeExamSession> => {
    const response = await axios.get<BaseResponse<{
      attemptId: string
      title: string
      durationMinutes: number
      remainingSeconds: number
      attemptEndAt: string
      integritySettings?: ApiExamIntegritySettings
      questions: ApiTakeExamQuestion[]
    }>>(`${BASE_URL}/${scheduleId}/attempts/${attemptId}`)
    const data = response.data.data
    return {
      ...data,
      integritySettings: {
        enableWebcam: data.integritySettings?.enableWebcam ?? false,
        blockCopyPaste: data.integritySettings?.blockCopyPaste ?? true,
        blockRightClick: data.integritySettings?.blockRightClick ?? true,
      },
      questions: data.questions.map(toTakeExamQuestion),
    }
  },

  // Backend accepts one answer per request: PUT .../answers { questionId, answer }
  saveAnswers: async (scheduleId: string, attemptId: string, answers: SaveAnswerPayload[]): Promise<void> => {
    await Promise.all(
      answers.map((payload) =>
        axios.put<BaseResponse<null>>(`${BASE_URL}/${scheduleId}/attempts/${attemptId}/answers`, payload),
      ),
    )
  },

  submitExam: async (scheduleId: string, attemptId: string): Promise<SubmitExamResponse> => {
    const response = await axios.post<BaseResponse<SubmitExamResponse>>(`${BASE_URL}/${scheduleId}/attempts/${attemptId}/submit`)
    return response.data.data
  },

  sendHeartbeat: async (scheduleId: string, attemptId: string): Promise<void> => {
    await axios.post<BaseResponse<null>>(`${BASE_URL}/${scheduleId}/attempts/${attemptId}/heartbeat`)
  },

  getAttemptStatus: async (scheduleId: string, attemptId: string): Promise<AttemptStatus> => {
    const response = await axios.get<BaseResponse<AttemptStatus>>(`${BASE_URL}/${scheduleId}/attempts/${attemptId}/status`)
    return response.data.data
  },

  getAttemptResult: async (scheduleId: string, attemptId: string): Promise<AttemptResult> => {
    const response = await axios.get<BaseResponse<AttemptResult>>(
      `${BASE_URL}/${scheduleId}/attempts/${attemptId}/result`,
    )
    return response.data.data
  },

  runCode: async (scheduleId: string, attemptId: string, questionId: string, sourceCode: string): Promise<RunCodeResponse> => {
    const response = await axios.post<BaseResponse<RunCodeResponse>>(
      `${BASE_URL}/${scheduleId}/attempts/${attemptId}/questions/${questionId}/run`,
      { sourceCode },
    )
    return response.data.data
  },
}
