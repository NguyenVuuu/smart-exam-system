import AppSelect from '../../../../components/common/AppSelect'
import TeacherToolbar from '../TeacherToolbar'

interface QuestionAuditToolbarProps {
  selectedSeverity: string
  onSeverityChange: (severity: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  issueCount: number
  onReset: () => void
}

export default function QuestionAuditToolbar({
  selectedSeverity,
  onSeverityChange,
  searchQuery,
  onSearchChange,
  issueCount,
  onReset,
}: QuestionAuditToolbarProps) {
  return (
    <TeacherToolbar
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Tìm kiếm theo nội dung, môn học hoặc lỗi..."
      onReset={onReset}
      filters={
        <>
          <AppSelect
            value={selectedSeverity}
            onChange={onSeverityChange}
            className="w-48"
            options={[
              { value: 'ALL', label: 'Tất cả mức độ' },
              { value: 'HIGH', label: 'Lỗi bắt buộc (Cao)' },
              { value: 'LOW', label: 'Cảnh báo (Thấp)' },
            ]}
          />
          <span className="text-sm font-medium text-slate-500">
            {issueCount} vấn đề phát hiện
          </span>
        </>
      }
    />
  )
}
