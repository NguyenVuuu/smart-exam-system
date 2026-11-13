import type { AiSettingsDto } from '../dtos/admin-system-settings.dto'
import { readSystemSettingsFile } from '../repositories/system-settings-file.repository'

export async function getStoredAiSettings(): Promise<AiSettingsDto> {
  return (await readSystemSettingsFile()).ai
}
