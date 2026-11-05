export function examStatusLabel(status: string) {
  const labels: Record<string, string> = { DRAFT: 'Bản nháp', PENDING_REVIEW: 'Chờ duyệt', APPROVED: 'Đã duyệt', PUBLISHED: 'Đã công bố', REJECTED: 'Cần sửa', ARCHIVED: 'Đã lưu trữ' }
  return labels[status] ?? status
}
