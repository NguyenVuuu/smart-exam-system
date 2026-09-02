import { isAxiosError } from 'axios'

interface ApiErrorPayload {
  message?: string
  errors?: Array<{ message?: string }>
}

const materialAlreadyExistsPrefix = 'Material already exists:'

const translateApiMessage = (message: string) => {
  if (message.startsWith(materialAlreadyExistsPrefix)) {
    return `Tài liệu đã tồn tại: ${message.slice(materialAlreadyExistsPrefix.length).trim()}`
  }
  if (message === 'Duplicated file names in upload request') return 'Có file bị chọn trùng tên trong lần tải lên này.'
  if (message === 'Unsupported file type') return 'Định dạng file không được hỗ trợ.'
  if (message === 'Supabase storage is not configured') return 'Backend chưa cấu hình Supabase Storage.'
  if (message === 'Pending or active shared questions cannot be edited') {
    return 'Không thể chỉnh sửa câu hỏi đang chờ duyệt hoặc đang hoạt động trong ngân hàng chung.'
  }
  if (message === 'Question changed in another session; reload and try again') {
    return 'Câu hỏi đã được thay đổi ở phiên khác. Vui lòng tải lại trang rồi thử lại.'
  }
  return message
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError<ApiErrorPayload>(error)) return fallback

  const payload = error.response?.data
  const message = payload?.message || payload?.errors?.find((item) => item.message)?.message
  return message ? translateApiMessage(message) : fallback
}
