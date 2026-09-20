import type { GenerationReview } from '../services/generated-response.review'
import { reviewError } from '../services/generated-response.review'

export function buildCorrectionPrompt(originalPrompt: string, review?: GenerationReview, reason?: string) {
  if (!review) return `${originalPrompt}\nSửa lỗi cấu trúc và trả lại danh sách hợp lệ: ${reason}`
  const count = review.slots.filter(item => item === null).length
  return [
    'ĐÂY LÀ LƯỢT HIỆU CHỈNH. Quy tắc số lượng của lượt này thay thế số lượng ở yêu cầu ban đầu.',
    `Chỉ trả ĐÚNG ${count} câu thay thế theo thứ tự các câu lỗi bên dưới. Không trả lại câu đã đạt.`,
    'Giữ phạm vi tài liệu, dạng và độ khó đã chọn; viết lại nội dung nếu sai độ khó, không chỉ thay nhãn.',
    `Câu đã đạt (không được lặp lại): ${JSON.stringify(review.slots.filter(Boolean).map(item => item!.title))}`,
    `Câu cần sửa (null là câu còn thiếu): ${JSON.stringify(review.rejected)}`,
    `Lỗi cần sửa: ${reviewError(review)}`,
    `Yêu cầu ban đầu, trừ số lượng: ${originalPrompt}`,
    `Kết quả lượt sửa chỉ có ${count} câu trong questions, không thêm trường hay văn bản ngoài JSON.`,
  ].join('\n')
}
