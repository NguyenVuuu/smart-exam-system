export type IntegrationState = 'CONNECTED' | 'CONFIGURED' | 'NOT_CONFIGURED' | 'UNAVAILABLE'

export interface IntegrationStatusDto {
  id: 'DATABASE' | 'REDIS' | 'GEMINI' | 'JUDGE0' | 'COURSE_STORAGE' | 'EVIDENCE_STORAGE'
  name: string
  state: IntegrationState
  detail: string
}

export interface GeneralSettingsDto {
  organizationName: string
  shortName: string
  slogan: string
  supportEmail: string
  supportHotline: string
  copyright: string
  timezone: string
  dateFormat: string
  defaultLanguage?: 'vi' | 'en'
  logoUrl: string
}

export interface ExamDefaultsSettingsDto {
  enableTabLock: boolean
  requireFullscreen: boolean
  enableWebcam: boolean
  enableScreenMonitoring: boolean
  blockCopyPaste: boolean
  blockRightClick: boolean
  heartbeatTimeoutSeconds: number
}

export interface CodeGenerationSettingsDto {
  studentPrefix: string
  studentDigits: number
  teacherPrefix: string
  teacherDigits: number
  adminPrefix: string
  adminDigits: number
}

export interface UpdateGeneralSettingsDto {
  organizationName?: string
  shortName?: string
  slogan?: string
  supportEmail?: string
  supportHotline?: string
  copyright?: string
  timezone?: string
  dateFormat?: string
  defaultLanguage?: 'vi' | 'en'
}

export interface UpdateExamDefaultsSettingsDto {
  enableTabLock?: boolean
  requireFullscreen?: boolean
  enableWebcam?: boolean
  enableScreenMonitoring?: boolean
  blockCopyPaste?: boolean
  blockRightClick?: boolean
  heartbeatTimeoutSeconds?: number
}

export interface UpdateCodeGenerationSettingsDto {
  studentPrefix?: string
  studentDigits?: number
  teacherPrefix?: string
  teacherDigits?: number
  adminPrefix?: string
  adminDigits?: number
}

export interface AiSettingsDto {
  model: string
  maxQuestionsPerRun: number
  timeoutSeconds: number
}

export interface UpdateAiSettingsDto {
  model?: string
  maxQuestionsPerRun?: number
  timeoutSeconds?: number
}

export interface AdminSystemSettingsDto {
  environment: string
  general: GeneralSettingsDto
  examDefaults: ExamDefaultsSettingsDto
  codeGeneration: CodeGenerationSettingsDto
  runtime: {
    heartbeatTimeoutSeconds: number
    accessTokenMinutes: number
    refreshTokenDays: number
    evidenceUrlExpiryMinutes: number
  }
  ai: {
    provider: string
    model: string
    maxQuestionsPerRun: number
    timeoutSeconds: number
    judgeProvider: string
    judgeTimeoutSeconds: number
    judgeBatchSize: number
  }
  uploads: {
    courseMaterialsMb: number
    aiSourcesMb: number
    questionImagesMb: number
    postAttachmentsMb: number
    evidenceImagesMb: number
  }
  integrations: IntegrationStatusDto[]
  checkedAt: Date
}
