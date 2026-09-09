import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { examConfig } from '../../../config'
import { geminiConfig } from '../../../lib/gemini'
import { AI_GENERATION_LIMITS } from '../../ai-question-generation/constants/ai-question-generation.constants'
import type {
  AiSettingsDto,
  ExamDefaultsSettingsDto,
  GeneralSettingsDto,
} from '../dtos/admin-system-settings.dto'

export interface StoredSystemSettings {
  general: GeneralSettingsDto
  examDefaults: ExamDefaultsSettingsDto
  ai: AiSettingsDto
}

let writeQueue: Promise<void> = Promise.resolve()

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value))

const getConfigFilePath = () => path.resolve(
  process.env.SYSTEM_SETTINGS_FILE?.trim()
    || path.join(process.cwd(), 'src/config/system-settings.json'),
)

function mergeKnownSettings<T extends object>(defaults: T, value: unknown): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults

  const source = value as Record<string, unknown>
  return Object.keys(defaults).reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const mutableResult = result as Record<string, unknown>
      mutableResult[key] = source[key]
    }
    return result
  }, { ...defaults })
}

export function createDefaultSystemSettings(): StoredSystemSettings {
  return {
    general: {
      organizationName: 'Trường Đại học Công nghệ & Khảo thí SOES',
      shortName: 'SOES',
      slogan: 'Hệ thống thi và đánh giá trực tuyến thông minh',
      supportEmail: 'hotro.khaothi@soes.edu.vn',
      supportHotline: '1900 6868',
      copyright: '© 2026 SOES - Smart Online Exam System. All rights reserved.',
      timezone: 'Asia/Ho_Chi_Minh',
      dateFormat: 'DD/MM/YYYY',
      defaultLanguage: 'vi',
      logoUrl: '',
    },
    examDefaults: {
      enableTabLock: true,
      maxTabSwitches: 3,
      requireFullscreen: true,
      enableWebcam: true,
      enableScreenMonitoring: false,
      blockCopyPaste: true,
      blockRightClick: true,
      heartbeatTimeoutSeconds: Math.round(examConfig.heartbeatTimeoutMs / 1000) || 30,
    },
    ai: {
      model: geminiConfig.model,
      maxQuestionsPerRun: clamp(
        geminiConfig.maxQuestions,
        AI_GENERATION_LIMITS.minQuestionsPerRun,
        AI_GENERATION_LIMITS.maxQuestionsPerRun,
      ),
      timeoutSeconds: clamp(
        Math.round(geminiConfig.timeoutMs / 1000),
        AI_GENERATION_LIMITS.minTimeoutSeconds,
        AI_GENERATION_LIMITS.maxTimeoutSeconds,
      ),
    },
  }
}

export async function readSystemSettingsFile(): Promise<StoredSystemSettings> {
  const defaults = createDefaultSystemSettings()

  try {
    const raw = await fs.readFile(getConfigFilePath(), 'utf-8')
    const parsed = JSON.parse(raw) as Partial<StoredSystemSettings>
    return {
      general: mergeKnownSettings(defaults.general, parsed.general),
      examDefaults: mergeKnownSettings(defaults.examDefaults, parsed.examDefaults),
      ai: mergeKnownSettings(defaults.ai, parsed.ai),
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    return defaults
  }
}

async function writeSystemSettingsFile(settings: StoredSystemSettings): Promise<void> {
  const configFilePath = getConfigFilePath()
  const temporaryPath = `${configFilePath}.${process.pid}.${randomUUID()}.tmp`
  await fs.mkdir(path.dirname(configFilePath), { recursive: true })
  await fs.writeFile(temporaryPath, JSON.stringify(settings, null, 2), 'utf-8')
  await fs.rename(temporaryPath, configFilePath)
}

export async function updateSystemSettingsFile(
  update: (current: StoredSystemSettings) => StoredSystemSettings,
): Promise<StoredSystemSettings> {
  const operation = writeQueue.then(async () => {
    const next = update(await readSystemSettingsFile())
    await writeSystemSettingsFile(next)
    return next
  })

  writeQueue = operation.then(() => undefined, () => undefined)
  return operation
}
