import { isAxiosError } from 'axios'

interface ApiValidationError {
  field?: string
  message?: string
}

interface ApiErrorPayload {
  message?: string
  errors?: ApiValidationError[]
}

const materialAlreadyExistsPrefix = 'Material already exists:'

const commonMessageTranslations: Record<string, string> = {
  'Duplicated file names in upload request': 'Có file bị chọn trùng tên trong lần tải lên này.',
  'Unsupported file type': 'Định dạng file không được hỗ trợ.',
  'Supabase storage is not configured': 'Backend chưa cấu hình Supabase Storage.',
  'Pending or active shared questions cannot be edited':
    'Không thể chỉnh sửa câu hỏi đang chờ duyệt hoặc đang hoạt động trong ngân hàng chung.',
  'Question changed in another session; reload and try again':
    'Câu hỏi đã được thay đổi ở phiên khác. Vui lòng tải lại trang rồi thử lại.',
  'Validation failed': 'Dữ liệu chưa hợp lệ. Vui lòng kiểm tra các trường được nhập.',
  'Internal server error': 'Hệ thống đang gặp lỗi. Vui lòng thử lại sau.',
  'Data conflicts with an existing record': 'Dữ liệu bị trùng hoặc xung đột với bản ghi đã có.',
  'Resource not found': 'Không tìm thấy dữ liệu tương ứng.',
}

const examMessageTranslations: Record<string, string> = {
  'Exam not found': 'Không tìm thấy đề thi hoặc bạn không có quyền truy cập.',
  'Teacher department is required': 'Tài khoản giảng viên chưa được gán bộ môn.',
  'Subject is outside teacher department': 'Môn học không thuộc bộ môn của giảng viên.',
  'Exam semester must be upcoming or active': 'Chỉ có thể tạo đề cho học kỳ đang diễn ra hoặc sắp tới.',
  'Exam is locked for editing': 'Đề thi đang bị khóa, không thể chỉnh sửa.',
  'Only published or locked regular exams can change student visibility':
    'Chỉ đề thường đã công bố hoặc đã chốt lịch mới có thể thay đổi hiển thị với sinh viên.',
  'Exam is hidden from students': 'Đề thi hiện đang bị ẩn khỏi sinh viên.',
  'One or more exam sections belong to another exam': 'Có phần đề thi đang thuộc đề khác.',
  'Move or remove questions before deleting their section':
    'Vui lòng chuyển hoặc xóa câu hỏi trước khi xóa phần chứa câu hỏi.',
  'Exam was changed in another session; reload and try again':
    'Đề thi đã thay đổi ở phiên khác. Vui lòng tải lại trang rồi thử lại.',
  'Exam state changed; reload and try again':
    'Trạng thái đề thi đã thay đổi. Vui lòng tải lại trang rồi thử lại.',
  'Exam questions must be unique': 'Đề thi không được chứa câu hỏi trùng.',
  'One or more questions are unavailable': 'Một hoặc nhiều câu hỏi không còn khả dụng.',
  'One or more selected questions are unavailable': 'Một hoặc nhiều câu hỏi đã chọn không còn khả dụng.',
  'Question points must equal exam total points': 'Tổng điểm câu hỏi phải bằng tổng điểm của đề.',
  'One or more exam sections are invalid': 'Có phần đề thi không hợp lệ.',
  'Exam must contain at least one question': 'Đề thi phải có ít nhất một câu hỏi.',
  'Section IDs must be unique': 'Mã các phần trong đề không được trùng.',
  'Section order must be unique': 'Thứ tự các phần trong đề không được trùng.',
  'Section points must equal exam total points': 'Tổng điểm các phần phải bằng tổng điểm của đề.',
  'Programming questions require a language, configuration, and test cases':
    'Câu lập trình cần có ngôn ngữ, cấu hình chạy và test case.',
  'Objective questions require at least two options': 'Câu trắc nghiệm cần ít nhất hai phương án.',
  'Multiple-choice questions require at least one correct option':
    'Câu nhiều đáp án cần ít nhất một phương án đúng.',
  'Single-choice and true/false questions require exactly one correct option':
    'Câu một đáp án hoặc đúng/sai cần đúng một phương án đúng.',
}

const scheduleMessageTranslations: Record<string, string> = {
  'Final exams must be centrally scheduled by an administrator':
    'Đề cuối kỳ phải được admin tạo ca thi tập trung.',
  'Exam must be ready and contain questions': 'Đề thi phải ở trạng thái sẵn sàng và có câu hỏi.',
  'Course offering is unavailable or belongs to another subject or semester':
    'Lớp học phần không khả dụng hoặc không cùng môn/học kỳ với đề thi.',
  'Only approved and ready final exams can be centrally scheduled':
    'Chỉ đề cuối kỳ đã duyệt và sẵn sàng mới được tạo ca thi tập trung.',
  'Exam has no questions': 'Đề thi chưa có câu hỏi.',
  'All course offerings must be active and belong to the exam subject and semester':
    'Tất cả lớp học phần phải đang hoạt động và cùng môn/học kỳ với đề thi.',
  'One or more proctors are invalid or inactive':
    'Một hoặc nhiều giảng viên coi thi không hợp lệ hoặc đang ngưng hoạt động.',
  'You already have an overlapping proctor assignment, including the 5-minute turnover period':
    'Bạn đã có lịch coi thi trùng hoặc quá sát ca khác, cần cách ca ít nhất 5 phút.',
  'Exam schedule not found': 'Không tìm thấy ca thi hoặc bạn không có quyền truy cập.',
  'Exam schedule is locked': 'Ca thi đang bị khóa, không thể chỉnh sửa.',
  'Exam schedule is locked and cannot be updated': 'Ca thi đang bị khóa nên không thể cập nhật.',
  'Exam schedule cannot be cancelled': 'Ca thi ở trạng thái hiện tại không thể hủy.',
  'Exam distribution is locked; reopen it before updating a schedule':
    'Lịch thi đã được chốt. Vui lòng mở lại lịch thi trước khi cập nhật ca.',
  'Exam distribution is locked; reopen it before cancelling a schedule':
    'Lịch thi đã được chốt. Vui lòng mở lại lịch thi trước khi hủy ca.',
  'End time must be after start time': 'Giờ kết thúc ca thi phải sau giờ bắt đầu.',
  'Campus exam requires allowed IP ranges': 'Ca thi giới hạn IP trường cần nhập dải IP được phép.',
  'Random question count is required': 'Chế độ chọn ngẫu nhiên cần nhập số câu hỏi.',
  'Result release time is required': 'Vui lòng chọn thời gian công bố kết quả.',
  'Course offerings must be unique': 'Danh sách lớp học phần không được trùng.',
  'Proctors must be unique': 'Giảng viên coi thi trong cùng lớp không được trùng.',
  'Review end time must be after review start time':
    'Thời gian kết thúc xem lại bài phải sau thời gian bắt đầu.',
}

const fieldLabels: Record<string, string> = {
  title: 'Tên đề/ca thi',
  description: 'Mô tả',
  defaultDurationMinutes: 'Thời lượng mặc định',
  durationMinutes: 'Thời lượng',
  totalPoints: 'Tổng điểm',
  targetPoints: 'Điểm của phần thi',
  points: 'Điểm câu hỏi',
  maxAttempts: 'Số lần làm bài',
  password: 'Mật khẩu',
  reason: 'Lý do',
  sections: 'Danh sách phần thi',
  items: 'Danh sách câu hỏi',
  courses: 'Danh sách lớp học phần',
  teacherIds: 'Danh sách giảng viên coi thi',
  allowedIpRanges: 'Dải IP được phép',
  randomQuestionCount: 'Số câu hỏi ngẫu nhiên',
  resultReleaseAt: 'Thời gian công bố kết quả',
  reviewStartAt: 'Thời gian bắt đầu xem lại bài',
  reviewEndAt: 'Thời gian kết thúc xem lại bài',
}

function getFieldLabel(field?: string) {
  if (!field) return 'Giá trị'
  if (/(^|\.)question\.title$/.test(field)) return 'Tiêu đề câu hỏi'

  const key = field.split('.').filter((part) => !/^\d+$/.test(part)).at(-1)
  return (key && fieldLabels[key]) || 'Giá trị'
}

function translateValidationMessage(message: string, field?: string) {
  const label = getFieldLabel(field)
  let match = message.match(/^Too small: expected string to have >=(\d+) characters?$/i)
    ?? message.match(/^String must contain at least (\d+) characters?/i)
  if (match) return `${label} phải có ít nhất ${match[1]} ký tự.`

  match = message.match(/^Too big: expected string to have <=(\d+) characters?$/i)
    ?? message.match(/^String must contain at most (\d+) characters?/i)
  if (match) return `${label} không được vượt quá ${match[1]} ký tự.`

  match = message.match(/^Too small: expected array to have >=(\d+) items?$/i)
  if (match) return `${label} phải có ít nhất ${match[1]} mục.`

  match = message.match(/^Too big: expected array to have <=(\d+) items?$/i)
  if (match) return `${label} không được vượt quá ${match[1]} mục.`

  match = message.match(/^Too small: expected number to be (>=|>)(-?\d+(?:\.\d+)?)$/i)
  if (match) return `${label} phải ${match[1] === '>' ? 'lớn hơn' : 'lớn hơn hoặc bằng'} ${match[2]}.`

  match = message.match(/^Too big: expected number to be (<=|<)(-?\d+(?:\.\d+)?)$/i)
  if (match) return `${label} phải ${match[1] === '<' ? 'nhỏ hơn' : 'nhỏ hơn hoặc bằng'} ${match[2]}.`

  match = message.match(/^Number must be less than or equal to (-?\d+(?:\.\d+)?)/i)
  if (match) return `${label} phải nhỏ hơn hoặc bằng ${match[1]}.`

  if (/^Number must be greater than 0/i.test(message)) return `${label} phải lớn hơn 0.`
  if (/^(Invalid input: expected|Expected .* received|Invalid option:|Invalid enum value)/i.test(message)) {
    return `${label} không đúng định dạng hệ thống yêu cầu.`
  }
}

const translateApiMessage = (message: string, field?: string) => {
  if (message.startsWith(materialAlreadyExistsPrefix)) {
    return `Tài liệu đã tồn tại: ${message.slice(materialAlreadyExistsPrefix.length).trim()}`
  }

  const validationMessage = translateValidationMessage(message, field)
  if (validationMessage) return validationMessage

  const exactMessage = commonMessageTranslations[message]
    ?? examMessageTranslations[message]
    ?? scheduleMessageTranslations[message]
  if (exactMessage) return exactMessage

  let match = message.match(/^Course offering (.+) already has an overlapping exam$/i)
  if (match) return `Lớp học phần ${match[1]} đã có ca thi trùng thời gian.`

  match = message.match(
    /^Proctor (.+) already has an overlapping assignment or less than (\d+) minutes between schedules$/i,
  )
  if (match) return `${match[1]} đã có lịch coi thi trùng hoặc cách ca dưới ${match[2]} phút.`

  return message
}

function getValidationErrors(error: unknown) {
  if (!isAxiosError<ApiErrorPayload>(error)) return []

  return (error.response?.data?.errors ?? [])
    .filter((item): item is ApiValidationError & { message: string } => Boolean(item.message))
    .map((item) => ({
      field: item.field,
      message: translateApiMessage(item.message, item.field),
    }))
}

export type ApiFieldErrors = Record<string, string>

export function getApiFieldErrors(error: unknown): ApiFieldErrors {
  return getValidationErrors(error).reduce<ApiFieldErrors>((result, item) => {
    if (item.field && !result[item.field]) result[item.field] = item.message
    return result
  }, {})
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError<ApiErrorPayload>(error)) return fallback

  const validationMessages = getValidationErrors(error).map((item) => item.message)
  if (validationMessages.length) return [...new Set(validationMessages)].slice(0, 3).join(' ')

  const message = error.response?.data?.message
  return message ? translateApiMessage(message) : fallback
}
