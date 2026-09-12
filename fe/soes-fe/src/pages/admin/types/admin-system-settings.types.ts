export type IntegrationState = 'CONNECTED' | 'CONFIGURED' | 'NOT_CONFIGURED' | 'UNAVAILABLE'

export interface IntegrationStatus {
  id: 'DATABASE' | 'REDIS' | 'GEMINI' | 'JUDGE0' | 'COURSE_STORAGE' | 'EVIDENCE_STORAGE'
  name: string
  state: IntegrationState
  detail: string
}

export interface GeneralSettings {
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

export interface ExamDefaultsSettings {
  enableTabLock: boolean
  requireFullscreen: boolean
  enableWebcam: boolean
  enableScreenMonitoring: boolean
  blockCopyPaste: boolean
  blockRightClick: boolean
  heartbeatTimeoutSeconds: number
}

export interface CodeGenerationSettings {
  studentPrefix: string
  studentDigits: number
  teacherPrefix: string
  teacherDigits: number
  adminPrefix: string
  adminDigits: number
}

export interface AiSettings {
  model: string
  maxQuestionsPerRun: number
  timeoutSeconds: number
}

export interface AdminSystemSettings {
  environment: string
  general: GeneralSettings
  examDefaults: ExamDefaultsSettings
  codeGeneration: CodeGenerationSettings
  ai: {
    provider: string
    model: string
    maxQuestionsPerRun: number
    timeoutSeconds: number
    judgeProvider: string
    judgeTimeoutSeconds: number
    judgeBatchSize: number
  }
  runtime: {
    heartbeatTimeoutSeconds: number
    accessTokenMinutes: number
    refreshTokenDays: number
    evidenceUrlExpiryMinutes: number
  }
  uploads: {
    courseMaterialsMb: number
    aiSourcesMb: number
    questionImagesMb: number
    postAttachmentsMb: number
    evidenceImagesMb: number
  }
  integrations: IntegrationStatus[]
  checkedAt: string
}

export type SystemSettingsTab = 'GENERAL' | 'EXAM_DEFAULTS' | 'CODE_GENERATION' | 'AI' | 'INTEGRATIONS'
