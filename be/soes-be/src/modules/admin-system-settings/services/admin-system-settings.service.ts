import { ValidationError } from '../../../errors/AppError'
import prisma from '../../../lib/prisma'
import { appConfig, examConfig, judge0Config, minioConfig } from '../../../config'
import { logger } from '../../../lib/logger'
import { supabaseBuckets } from '../../../lib/supabase'
import { UPLOAD_LIMITS_MB } from '../../../middlewares/fileUpload'
import { removeObjectsFromBucket, uploadBufferToBucket } from '../../../services/storage.service'
import { AUTH_TOKEN_LIFETIMES } from '../../../utils/jwt'
import { EVIDENCE_UPLOAD_LIMITS } from '../../student-take-exam/middlewares/evidence-upload'
import { writeAuditLog } from '../../audit-logs/audit-log.writer'
import type {
  AdminSystemSettingsDto,
  AiSettingsDto,
  CodeGenerationSettingsDto,
  ExamDefaultsSettingsDto,
  GeneralSettingsDto,
  UpdateAiSettingsDto,
  UpdateCodeGenerationSettingsDto,
  UpdateExamDefaultsSettingsDto,
  UpdateGeneralSettingsDto,
} from '../dtos/admin-system-settings.dto'
import {
  createDefaultSystemSettings,
  readSystemSettingsFile,
  updateSystemSettingsFile,
} from '../repositories/system-settings-file.repository'
import { getIntegrationStatuses } from './integration-health.service'

const SYSTEM_LOGO_OBJECT_NAME = 'branding/system-logo'

function extractStoragePathFromUrl(url?: string): string | null {
  if (!url) return null
  try {
    const cleanUrl = url.split('?')[0]
    const bucket = supabaseBuckets.systemAssets
    const marker = `/public/${bucket}/`
    const idx = cleanUrl.indexOf(marker)
    if (idx !== -1) {
      return cleanUrl.slice(idx + marker.length)
    }
  } catch {}
  return null
}

async function removeStoredSystemLogo(currentLogoUrl?: string): Promise<void> {
  try {
    const pathsToDelete = [SYSTEM_LOGO_OBJECT_NAME]
    const extracted = extractStoragePathFromUrl(currentLogoUrl)
    if (extracted) pathsToDelete.push(extracted)
    await removeObjectsFromBucket(supabaseBuckets.systemAssets, pathsToDelete)
  } catch (error) {
    logger.warn('Unable to remove the stored system logo', { error: String(error) })
  }
}

function detectLogoMimeType(bytes: Buffer): string | null {
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const webp = bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP'
  if (png) return 'image/png'
  if (jpeg) return 'image/jpeg'
  if (webp) return 'image/webp'
  return null
}

async function getCodeGenerationSettings(): Promise<CodeGenerationSettingsDto> {
  const setting = await prisma.codeGenerationSetting.findUnique({
    where: { id: 'SYSTEM' },
  })

  if (!setting) {
    return {
      studentPrefix: 'SV',
      studentDigits: 6,
      teacherPrefix: 'GV',
      teacherDigits: 6,
      adminPrefix: 'AD',
      adminDigits: 6,
    }
  }

  return {
    studentPrefix: setting.studentPrefix,
    studentDigits: setting.studentDigits,
    teacherPrefix: setting.teacherPrefix,
    teacherDigits: setting.teacherDigits,
    adminPrefix: setting.adminPrefix,
    adminDigits: setting.adminDigits,
  }
}

export async function getAdminSystemSettings(): Promise<AdminSystemSettingsDto> {
  const fileConfig = await readSystemSettingsFile()
  const [codeGeneration, integrations] = await Promise.all([
    getCodeGenerationSettings(),
    getIntegrationStatuses(fileConfig.ai.model),
  ])

  return {
    environment: appConfig.nodeEnv,
    general: fileConfig.general,
    examDefaults: fileConfig.examDefaults,
    codeGeneration,
    runtime: {
      heartbeatTimeoutSeconds: fileConfig.examDefaults.heartbeatTimeoutSeconds || Math.round(examConfig.heartbeatTimeoutMs / 1000),
      accessTokenMinutes: AUTH_TOKEN_LIFETIMES.accessMinutes,
      refreshTokenDays: AUTH_TOKEN_LIFETIMES.refreshDays,
      evidenceUrlExpiryMinutes: Math.ceil(minioConfig.evidenceUrlExpirySeconds / 60),
    },
    ai: {
      provider: 'Google Gemini',
      model: fileConfig.ai.model,
      maxQuestionsPerRun: fileConfig.ai.maxQuestionsPerRun,
      timeoutSeconds: fileConfig.ai.timeoutSeconds || 120,
      judgeProvider: 'Judge0 CE',
      judgeTimeoutSeconds: Math.ceil(judge0Config.defaultTimeoutMs / 1000),
      judgeBatchSize: judge0Config.maxSubmissionsPerRequest,
    },
    uploads: {
      courseMaterialsMb: UPLOAD_LIMITS_MB.courseMaterials,
      aiSourcesMb: UPLOAD_LIMITS_MB.aiSources,
      questionImagesMb: UPLOAD_LIMITS_MB.questionImages,
      postAttachmentsMb: UPLOAD_LIMITS_MB.postAttachments,
      evidenceImagesMb: EVIDENCE_UPLOAD_LIMITS.fileSizeMb,
    },
    integrations,
    checkedAt: new Date(),
  }
}

export async function getPublicSystemSettings(): Promise<GeneralSettingsDto> {
  return (await readSystemSettingsFile()).general
}

export async function getStoredExamDefaultsSettings(): Promise<ExamDefaultsSettingsDto> {
  return (await readSystemSettingsFile()).examDefaults
}

async function safeWriteAuditLog(
  userId: string,
  action: string,
  entityId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (user) {
      await writeAuditLog(prisma, {
        userId: user.id,
        action,
        entityType: 'SystemSettings',
        entityId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      })
    }
  } catch (error) {
    logger.warn('Audit log write skipped for system settings', { error: String(error) })
  }
}

export async function updateGeneralSettings(
  userId: string,
  payload: UpdateGeneralSettingsDto,
): Promise<GeneralSettingsDto> {
  const updated = await updateSystemSettingsFile((current) => ({
    ...current,
    general: { ...current.general, ...payload },
  }))
  await safeWriteAuditLog(userId, 'UPDATE_SYSTEM_SETTINGS', 'GENERAL', payload as Record<string, unknown>)

  return updated.general
}

async function updateSystemLogoUrl(userId: string, logoUrl: string): Promise<GeneralSettingsDto> {
  const updated = await updateSystemSettingsFile((current) => ({
    ...current,
    general: { ...current.general, logoUrl },
  }))
  await safeWriteAuditLog(userId, 'UPDATE_SYSTEM_SETTINGS', 'GENERAL', {
    logo: logoUrl ? 'UPDATED' : 'REMOVED',
  })
  return updated.general
}

export async function uploadSystemLogo(
  userId: string,
  file?: Express.Multer.File,
): Promise<GeneralSettingsDto> {
  if (!file) throw new ValidationError('Vui lòng chọn ảnh logo')
  const detectedMimeType = detectLogoMimeType(file.buffer)
  if (!detectedMimeType) throw new ValidationError('Nội dung file logo không hợp lệ')

  const currentSettings = await readSystemSettingsFile()
  await removeStoredSystemLogo(currentSettings.general.logoUrl)

  const extension = detectedMimeType === 'image/png' ? 'png' : detectedMimeType === 'image/jpeg' ? 'jpg' : 'webp'
  const newObjectName = `branding/system-logo-${Date.now()}.${extension}`

  const storedLogo = await uploadBufferToBucket(
    supabaseBuckets.systemAssets,
    { ...file, mimetype: detectedMimeType },
    'branding',
    { publicUrl: true, objectName: newObjectName, upsert: true },
  )
  if (!storedLogo.publicUrl) throw new ValidationError('Không thể tạo đường dẫn logo công khai')

  return updateSystemLogoUrl(userId, storedLogo.publicUrl)
}

export async function removeSystemLogo(userId: string): Promise<GeneralSettingsDto> {
  const currentSettings = await readSystemSettingsFile()
  const settings = await updateSystemLogoUrl(userId, '')
  await removeStoredSystemLogo(currentSettings.general.logoUrl)
  return settings
}

export async function updateExamDefaultsSettings(
  userId: string,
  payload: UpdateExamDefaultsSettingsDto,
): Promise<ExamDefaultsSettingsDto> {
  const updated = await updateSystemSettingsFile((current) => ({
    ...current,
    examDefaults: { ...current.examDefaults, ...payload },
  }))
  await safeWriteAuditLog(userId, 'UPDATE_SYSTEM_SETTINGS', 'EXAM_DEFAULTS', payload as Record<string, unknown>)

  return updated.examDefaults
}

export async function updateCodeGenerationSettings(
  userId: string,
  payload: UpdateCodeGenerationSettingsDto,
): Promise<CodeGenerationSettingsDto> {
  const updated = await prisma.codeGenerationSetting.upsert({
    where: { id: 'SYSTEM' },
    update: {
      studentPrefix: payload.studentPrefix,
      studentDigits: payload.studentDigits,
      teacherPrefix: payload.teacherPrefix,
      teacherDigits: payload.teacherDigits,
      adminPrefix: payload.adminPrefix,
      adminDigits: payload.adminDigits,
    },
    create: {
      id: 'SYSTEM',
      studentPrefix: payload.studentPrefix ?? 'SV',
      studentDigits: payload.studentDigits ?? 6,
      teacherPrefix: payload.teacherPrefix ?? 'GV',
      teacherDigits: payload.teacherDigits ?? 6,
      adminPrefix: payload.adminPrefix ?? 'AD',
      adminDigits: payload.adminDigits ?? 6,
    },
  })

  await safeWriteAuditLog(userId, 'UPDATE_SYSTEM_SETTINGS', 'CODE_GENERATION', payload as Record<string, unknown>)

  return {
    studentPrefix: updated.studentPrefix,
    studentDigits: updated.studentDigits,
    teacherPrefix: updated.teacherPrefix,
    teacherDigits: updated.teacherDigits,
    adminPrefix: updated.adminPrefix,
    adminDigits: updated.adminDigits,
  }
}

export async function getStoredAiSettings(): Promise<AiSettingsDto> {
  const fileConfig = await readSystemSettingsFile()
  return fileConfig.ai
}

export async function updateAiSettings(
  userId: string,
  payload: UpdateAiSettingsDto,
): Promise<AiSettingsDto> {
  const updated = await updateSystemSettingsFile((current) => ({
    ...current,
    ai: { ...current.ai, ...payload },
  }))
  await safeWriteAuditLog(userId, 'UPDATE_SYSTEM_SETTINGS', 'AI', payload as Record<string, unknown>)

  return updated.ai
}

export async function resetDefaultSystemSettings(userId: string): Promise<AdminSystemSettingsDto> {
  await updateSystemSettingsFile(() => createDefaultSystemSettings())

  await prisma.codeGenerationSetting.upsert({
    where: { id: 'SYSTEM' },
    update: {
      studentPrefix: 'SV',
      studentDigits: 6,
      teacherPrefix: 'GV',
      teacherDigits: 6,
      adminPrefix: 'AD',
      adminDigits: 6,
    },
    create: {
      id: 'SYSTEM',
      studentPrefix: 'SV',
      studentDigits: 6,
      teacherPrefix: 'GV',
      teacherDigits: 6,
      adminPrefix: 'AD',
      adminDigits: 6,
    },
  })

  await safeWriteAuditLog(userId, 'RESET_SYSTEM_SETTINGS', 'SYSTEM', {
    resetAt: new Date().toISOString(),
  })
  await removeStoredSystemLogo()

  return getAdminSystemSettings()
}
