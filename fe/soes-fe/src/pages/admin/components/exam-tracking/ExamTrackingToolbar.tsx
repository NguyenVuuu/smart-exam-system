import { ADMIN_ACADEMIC_YEARS, ADMIN_DEPARTMENTS } from '../../mock/admin.mock'
import type { AdminExam, AdminSubject } from '../../types/admin.types'
import AdminSelect from '../AdminSelect'
import AdminToolbar from '../AdminToolbar'

export default function ExamTrackingToolbar({
  search,
  onSearchChange,
  semester,
  onSemesterChange,
  department,
  onDepartmentChange,
  subject,
  onSubjectChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  visibleSubjects,
  onReset,
}: {
  search: string
  onSearchChange: (val: string) => void
  semester: string
  onSemesterChange: (val: string) => void
  department: string
  onDepartmentChange: (val: string) => void
  subject: string
  onSubjectChange: (val: string) => void
  category: 'ALL' | AdminExam['category']
  onCategoryChange: (val: 'ALL' | AdminExam['category']) => void
  status: 'ALL' | AdminExam['status']
  onStatusChange: (val: 'ALL' | AdminExam['status']) => void
  visibleSubjects: AdminSubject[]
  onReset: () => void
}) {
  return (
    <AdminToolbar
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Tìm mã môn, tên môn hoặc người soạn..."
      onReset={onReset}
      filters={
        <>
          <AdminSelect
            value={semester}
            onChange={onSemesterChange}
            className="w-48"
            options={[
              { value: 'ALL', label: 'Tất cả học kỳ' },
              ...ADMIN_ACADEMIC_YEARS.map((item) => ({ value: item.code, label: item.name })),
            ]}
          />
          <AdminSelect
            value={department}
            onChange={(val) => {
              onDepartmentChange(val)
              onSubjectChange('ALL')
            }}
            className="w-56"
            options={[
              { value: 'ALL', label: 'Tất cả bộ môn' },
              ...ADMIN_DEPARTMENTS.map((item) => ({ value: item.id, label: item.name })),
            ]}
          />
          <AdminSelect
            value={subject}
            onChange={onSubjectChange}
            className="w-56"
            options={[
              { value: 'ALL', label: 'Tất cả môn học' },
              ...visibleSubjects.map((item) => ({ value: item.code, label: `${item.code} - ${item.name}` })),
            ]}
          />
          <AdminSelect
            value={category}
            onChange={(val) => onCategoryChange(val as 'ALL' | AdminExam['category'])}
            className="w-44"
            options={[
              { value: 'ALL', label: 'Loại đề thi' },
              { value: 'QUIZ', label: 'Quiz' },
              { value: 'MIDTERM', label: 'Giữa kỳ' },
              { value: 'FINAL', label: 'Cuối kỳ' },
            ]}
          />
          <AdminSelect
            value={status}
            onChange={(val) => onStatusChange(val as 'ALL' | AdminExam['status'])}
            className="w-44"
            options={[
              { value: 'ALL', label: 'Trạng thái' },
              { value: 'DRAFT', label: 'Bản nháp' },
              { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
              { value: 'APPROVED', label: 'Đã duyệt' },
              { value: 'REJECTED', label: 'Bị từ chối' },
              { value: 'LOCKED', label: 'Đã khóa' },
            ]}
          />
        </>
      }
    />
  )
}
