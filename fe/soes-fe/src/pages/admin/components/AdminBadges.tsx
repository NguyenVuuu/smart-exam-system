import AppBadge from '../../../components/common/AppBadge'
import type {
  AdminExam,
  AdminExamSchedule,
  AdminStatus,
  CourseOfferingAdmin,
  SharedQuestionAdmin,
} from '../types/admin.types'

type BadgeTone = 'gray' | 'blue' | 'emerald' | 'amber' | 'rose'

export function AdminStatusBadge({ status }: { status: AdminStatus | CourseOfferingAdmin['status'] | AdminExamSchedule['status'] }) {
  const label: Record<string, string> = {
    ACTIVE: 'Đang sử dụng',
    INACTIVE: 'Tạm ngưng',
    ARCHIVED: 'Đã lưu trữ',
    LOCKED: 'Bị khóa',
    OPEN: 'Đang mở',
    CLOSED: 'Đã đóng',
    DRAFT: 'Nháp',
    SCHEDULED: 'Đã lên lịch',
    CANCELLED: 'Đã hủy',
  }
  const tone: BadgeTone = status === 'ACTIVE' || status === 'OPEN' || status === 'SCHEDULED'
    ? 'emerald'
    : status === 'INACTIVE' || status === 'DRAFT'
      ? 'amber'
      : status === 'LOCKED' || status === 'CANCELLED'
        ? 'rose'
        : 'gray'

  return <AppBadge tone={tone}>{label[status] ?? status}</AppBadge>
}

export function ExamStatusBadge({ status }: { status: AdminExam['status'] }) {
  const label: Record<AdminExam['status'], string> = {
    DRAFT: 'Nháp',
    PENDING_APPROVAL: 'Chờ Trưởng bộ môn',
    APPROVED: 'Sẵn sàng',
    REJECTED: 'Bị từ chối',
    LOCKED: 'Đã khóa',
  }
  const tone: BadgeTone = status === 'APPROVED'
    ? 'emerald'
    : status === 'PENDING_APPROVAL'
      ? 'amber'
      : status === 'REJECTED'
        ? 'rose'
        : 'gray'

  return <AppBadge tone={tone}>{label[status]}</AppBadge>
}

export function QuestionStatusBadge({ status }: { status: SharedQuestionAdmin['status'] }) {
  return status === 'APPROVED'
    ? <AppBadge tone="emerald">Đang dùng</AppBadge>
    : <AppBadge tone="gray">Đã gỡ</AppBadge>
}

export function ExamCategoryBadge({ category }: { category: AdminExam['category'] }) {
  const label = {
    QUIZ: 'Quiz',
    MIDTERM: 'Giữa kỳ',
    FINAL: 'Cuối kỳ',
  }[category]
  const tone: BadgeTone = category === 'FINAL' ? 'rose' : category === 'MIDTERM' ? 'amber' : 'blue'
  return <AppBadge tone={tone}>{label}</AppBadge>
}
