import { z } from 'zod'
import { AI_GENERATION_LIMITS } from '../../ai-question-generation/constants/ai-question-generation.constants'

export const updateGeneralSettingsSchema = z.object({
  organizationName: z.string().trim().min(2, 'Tên đơn vị phải có ít nhất 2 ký tự').max(200, 'Tên đơn vị tối đa 200 ký tự').optional(),
  shortName: z.string().trim().max(30, 'Tên viết tắt tối đa 30 ký tự').optional(),
  slogan: z.string().trim().max(300, 'Slogan tối đa 300 ký tự').optional(),
  supportEmail: z.string().trim().email('Email hỗ trợ không hợp lệ').optional().or(z.literal('')),
  supportHotline: z.string().trim().max(50, 'Hotline tối đa 50 ký tự').optional(),
  copyright: z.string().trim().max(200, 'Bản quyền tối đa 200 ký tự').optional(),
  timezone: z.string().trim().min(2).max(50).optional(),
  dateFormat: z.string().trim().max(30).optional(),
  defaultLanguage: z.enum(['vi', 'en']).optional(),
})

export const updateExamDefaultsSchema = z.object({
  enableTabLock: z.boolean().optional(),
  maxTabSwitches: z.number().int().min(1, 'Số lần chuyển tab tối thiểu là 1').max(20, 'Số lần chuyển tab tối đa là 20').optional(),
  requireFullscreen: z.boolean().optional(),
  enableWebcam: z.boolean().optional(),
  enableScreenMonitoring: z.boolean().optional(),
  blockCopyPaste: z.boolean().optional(),
  blockRightClick: z.boolean().optional(),
  heartbeatTimeoutSeconds: z.number().int().min(10, 'Timeout tối thiểu 10s').max(300, 'Timeout tối đa 300s').optional(),
})

export const updateCodeGenerationSchema = z.object({
  studentPrefix: z.string().trim().min(1, 'Tiền tố SV không được rỗng').max(10, 'Tiền tố tối đa 10 ký tự').optional(),
  studentDigits: z.number().int().min(4, 'Độ dài tối thiểu 4').max(12, 'Độ dài tối đa 12').optional(),
  teacherPrefix: z.string().trim().min(1, 'Tiền tố GV không được rỗng').max(10, 'Tiền tố tối đa 10 ký tự').optional(),
  teacherDigits: z.number().int().min(4, 'Độ dài tối thiểu 4').max(12, 'Độ dài tối đa 12').optional(),
  adminPrefix: z.string().trim().min(1, 'Tiền tố AD không được rỗng').max(10, 'Tiền tố tối đa 10 ký tự').optional(),
  adminDigits: z.number().int().min(4, 'Độ dài tối thiểu 4').max(12, 'Độ dài tối đa 12').optional(),
})

export const updateAiSettingsSchema = z.object({
  model: z.string().trim().min(1, 'Model không được để trống').max(100).optional(),
  maxQuestionsPerRun: z.number().int()
    .min(AI_GENERATION_LIMITS.minQuestionsPerRun, 'Tối thiểu 1 câu')
    .max(AI_GENERATION_LIMITS.maxQuestionsPerRun, 'Tối đa 100 câu')
    .optional(),
  timeoutSeconds: z.number().int()
    .min(AI_GENERATION_LIMITS.minTimeoutSeconds, 'Timeout tối thiểu 10s')
    .max(AI_GENERATION_LIMITS.maxTimeoutSeconds, 'Timeout tối đa 600s')
    .optional(),
})

