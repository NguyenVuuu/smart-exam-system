import type { Request, Response } from 'express'
import { sendSuccess as send } from '../../../utils/httpResponse'
import {
  getAdminSystemSettings,
  getPublicSystemSettings,
  getStoredExamDefaultsSettings,
  removeSystemLogo,
  resetDefaultSystemSettings,
  updateAiSettings,
  updateCodeGenerationSettings,
  updateExamDefaultsSettings,
  updateGeneralSettings,
  uploadSystemLogo,
} from '../services/admin-system-settings.service'
import {
  updateAiSettingsSchema,
  updateCodeGenerationSchema,
  updateExamDefaultsSchema,
  updateGeneralSettingsSchema,
} from '../validators/admin-system-settings.validator'

export const getPublicSettings = async (_request: Request, response: Response) => {
  const general = await getPublicSystemSettings()
  send(response, {
    organizationName: general.organizationName,
    shortName: general.shortName,
    slogan: general.slogan,
    supportEmail: general.supportEmail,
    supportHotline: general.supportHotline,
    copyright: general.copyright,
    timezone: general.timezone,
    dateFormat: general.dateFormat,
    defaultLanguage: general.defaultLanguage,
    logoUrl: general.logoUrl,
  })
}

export const getSettings = async (_request: Request, response: Response) =>
  send(response, await getAdminSystemSettings())

export const getTeacherExamDefaults = async (_request: Request, response: Response) =>
  send(response, await getStoredExamDefaultsSettings())

export const updateGeneral = async (request: Request, response: Response) => {
  const userId = request.user?.id || 'SYSTEM'
  const payload = updateGeneralSettingsSchema.parse(request.body)
  const result = await updateGeneralSettings(userId, payload)
  send(response, result)
}

export const uploadLogo = async (request: Request, response: Response) => {
  const result = await uploadSystemLogo(request.user!.id, request.file)
  send(response, result)
}

export const removeLogo = async (request: Request, response: Response) => {
  const result = await removeSystemLogo(request.user!.id)
  send(response, result)
}

export const updateExamDefaults = async (request: Request, response: Response) => {
  const userId = request.user?.id || 'SYSTEM'
  const payload = updateExamDefaultsSchema.parse(request.body)
  const result = await updateExamDefaultsSettings(userId, payload)
  send(response, result)
}

export const updateCodeGeneration = async (request: Request, response: Response) => {
  const userId = request.user?.id || 'SYSTEM'
  const payload = updateCodeGenerationSchema.parse(request.body)
  const result = await updateCodeGenerationSettings(userId, payload)
  send(response, result)
}

export const updateAi = async (request: Request, response: Response) => {
  const userId = request.user?.id || 'SYSTEM'
  const payload = updateAiSettingsSchema.parse(request.body)
  const result = await updateAiSettings(userId, payload)
  send(response, result)
}

export const resetDefaults = async (request: Request, response: Response) => {
  const userId = request.user?.id || 'SYSTEM'
  const result = await resetDefaultSystemSettings(userId)
  send(response, result)
}
