export const examModeOptions = [
  { value: 'ONLINE', label: 'Thi trực tuyến từ xa' },
  { value: 'SCHOOL_IP', label: 'Thi trực tuyến trong mạng trường' },
]

export const distributionOptions = [
  { value: 'FIXED_ORDER', label: 'Giữ nguyên thứ tự câu hỏi' },
  { value: 'SHUFFLE_ORDER', label: 'Xáo thứ tự câu hỏi' },
  { value: 'SHUFFLE_QUESTIONS_AND_OPTIONS', label: 'Xáo câu hỏi và phương án' },
  { value: 'RANDOM_SUBSET', label: 'Chọn tập câu hỏi ngẫu nhiên theo phần' },
]

export const releaseOptions = [
  { value: 'IMMEDIATE', label: 'Hiện điểm ngay sau khi nộp' },
  { value: 'MANUAL', label: 'Ẩn điểm, giảng viên công bố sau' },
  { value: 'SCHEDULED', label: 'Tự động công bố theo thời gian' },
]

export const PROCTOR_TURNOVER_MINUTES = 15
