import AppSelect from '../../../../components/common/AppSelect'
import type { QuestionAuditSeverity } from '../../types/teacher-question-api.types'
import TeacherToolbar from '../TeacherToolbar'

export type QuestionAuditSeverityFilter = QuestionAuditSeverity | 'ALL'

interface QuestionAuditToolbarProps {
  selectedSeverity: QuestionAuditSeverityFilter
  onSeverityChange: (severity: QuestionAuditSeverityFilter) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  questionCount: number
  issueCount: number
  onReset: () => void
}

export default function QuestionAuditToolbar({
  selectedSeverity,
  onSeverityChange,
  searchQuery,
  onSearchChange,
  questionCount,
  issueCount,
  onReset,
}: QuestionAuditToolbarProps) {
  return (
    <TeacherToolbar
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Tìm kiếm theo nội dung, môn học hoặc lỗi..."
      onReset={onReset}
      filters={(
        <>
          <AppSelect
            value={selectedSeverity}
            onChange={onSeverityChange}
            className="w-48"
            options={[
              { value: 'ALL', label: 'Tất cả mức độ' },
              { value: 'HIGH', label: 'Câu cần sửa' },
              { value: 'LOW', label: 'Câu cần lưu ý' },
            ]}
          />
          <span className="text-sm font-medium text-slate-500">
            {questionCount} câu có vấn đề · {issueCount} lỗi
          </span>
        </>
      )}
    />
  )
}
