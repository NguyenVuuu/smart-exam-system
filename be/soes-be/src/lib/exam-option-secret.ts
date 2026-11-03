import { decryptField, encryptField } from './encryption'

type StoredOption = { content: string; isCorrect: boolean }
type OptionValue = StoredOption & { sealed: boolean }

export function sealExamOption(content: string, isCorrect: boolean): StoredOption {
  return {
    content: encryptField(JSON.stringify({ format: 'EXAM_OPTION_V1', content, isCorrect })),
    isCorrect: false,
  }
}

export function openExamOption(option: StoredOption): OptionValue {
  const value = decryptField(option.content)
  if (option.content.startsWith('enc:')) {
    try {
      const decoded: unknown = JSON.parse(value)
      if (decoded && typeof decoded === 'object' && !Array.isArray(decoded)
        && 'format' in decoded && decoded.format === 'EXAM_OPTION_V1'
        && 'content' in decoded && typeof decoded.content === 'string'
        && 'isCorrect' in decoded && typeof decoded.isCorrect === 'boolean') {
        return { content: decoded.content, isCorrect: decoded.isCorrect, sealed: true }
      }
    } catch { /* legacy encrypted content was a plain string */ }
  }
  return { content: value, isCorrect: option.isCorrect, sealed: false }
}
