import { ZodError } from 'zod'
import { ApiError } from '@google/genai'
import { AppError, ValidationError } from '../../../errors/AppError'

export function geminiErrorDiagnostics(error: unknown) {
  // Provider messages can contain source text or credentials; log only allowlisted metadata.
  return {
    providerStatus: error instanceof ApiError ? error.status : undefined,
    errorType: error instanceof ApiError ? 'PROVIDER'
      : error instanceof AppError || error instanceof ZodError || error instanceof SyntaxError ? 'VALIDATION'
        : error instanceof TypeError ? 'NETWORK_OR_SDK' : 'UNKNOWN',
  }
}

export function describeValidationError(error: unknown) {
  if (error instanceof ValidationError) return error.message
  if (error instanceof SyntaxError) return 'JSON trả về không hợp lệ'
  if (error instanceof ZodError) {
    return error.issues.slice(0, 8).map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ')
  }
  return null
}

export function toGeminiError(error: unknown, model: string): AppError {
  if (error instanceof AppError) return error
  const validationReason = describeValidationError(error)
  if (validationReason) return new ValidationError(`AI trả về câu hỏi chưa đúng cấu trúc: ${validationReason}`)

  const details = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  const status = error instanceof ApiError ? error.status : undefined
  if (/timeout|AbortError|TimeoutError/i.test(details)) {
    return new AppError(504, 'AI xử lý quá thời gian cho phép. Hãy giảm dung lượng tài liệu hoặc số câu hỏi.')
  }
  if (status === 429 || /429|RESOURCE_EXHAUSTED|quota/i.test(details)) {
    return new AppError(429, 'Đã hết hạn mức Gemini hoặc gửi yêu cầu quá nhanh. Vui lòng chờ rồi thử lại hoặc kiểm tra quota/billing.')
  }
  if (status === 401 || status === 403 || /401|403|API_KEY|permission/i.test(details)) {
    return new AppError(503, 'Gemini API key không hợp lệ hoặc không có quyền sử dụng model đã cấu hình.')
  }
  if (status === 400 || /INVALID_ARGUMENT/i.test(details)) {
    return new AppError(502, 'Gemini từ chối yêu cầu (400 INVALID_ARGUMENT). Cần kiểm tra cấu hình model, schema đầu ra hoặc định dạng tài liệu; đây không phải lỗi mất kết nối.')
  }
  if (status === 404 || /404|NOT_FOUND/i.test(details)) {
    return new AppError(503, `Không tìm thấy mô hình Gemini '${model}' hoặc tài nguyên yêu cầu.`)
  }
  if (status === 503) {
    return new AppError(503, 'Gemini đang tạm thời quá tải hoặc không khả dụng. Vui lòng thử lại sau.')
  }
  if (/fetch failed|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i.test(details)) {
    return new AppError(502, 'Backend không kết nối được tới Gemini. Vui lòng kiểm tra mạng, DNS hoặc proxy của máy chủ.')
  }
  return new AppError(502, 'Không thể nhận kết quả từ Gemini. Vui lòng thử lại sau.')
}
