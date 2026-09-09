export type QuestionAuditSeverity = 'HIGH' | 'LOW'

export type QuestionAuditIssueCode =
  | 'TITLE_INVALID'
  | 'OPTION_COUNT_INVALID'
  | 'OPTION_CONTENT_REQUIRED'
  | 'OPTION_CONTENT_DUPLICATED'
  | 'SINGLE_CORRECT_OPTION_REQUIRED'
  | 'MULTIPLE_CHOICE_CORRECT_OPTION_REQUIRED'
  | 'MULTIPLE_CHOICE_INCORRECT_OPTION_REQUIRED'
  | 'TRUE_FALSE_OPTIONS_INVALID'
  | 'OBJECTIVE_TEST_CASES_NOT_ALLOWED'
  | 'PROGRAMMING_CONTENT_REQUIRED'
  | 'PROGRAMMING_LANGUAGE_REQUIRED'
  | 'PROGRAMMING_OPTIONS_NOT_ALLOWED'
  | 'TIME_LIMIT_INVALID'
  | 'MEMORY_LIMIT_INVALID'
  | 'CODE_SIZE_LIMIT_INVALID'
  | 'TEST_CASE_REQUIRED'
  | 'PUBLIC_TEST_CASE_REQUIRED'
  | 'TEST_EXPECTED_OUTPUT_REQUIRED'
  | 'TEST_CASE_DUPLICATED'
  | 'EXPLANATION_RECOMMENDED'

export interface QuestionAuditIssue {
  code: QuestionAuditIssueCode
  severity: QuestionAuditSeverity
  field: string
  message: string
}

export interface AuditableQuestion {
  title: string
  content?: string | null
  explanation?: string | null
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'PROGRAMMING'
  language?: 'JAVA' | 'C' | 'CPP' | null
  options: Array<{ content: string; isCorrect: boolean }>
  timeLimitMs?: number | null
  memoryLimitMb?: number | null
  maxCodeSizeKb?: number | null
  testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>
}
