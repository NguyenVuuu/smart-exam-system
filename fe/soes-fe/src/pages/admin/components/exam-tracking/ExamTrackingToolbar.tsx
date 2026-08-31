import type { AcademicYear, AdminExam, AdminSubject, Department } from '../../types/admin.types'
import AdminSelect from '../AdminSelect'
import AdminToolbar from '../AdminToolbar'

interface Props {
  search: string; semester: string; department: string; subject: string
  category: 'ALL' | AdminExam['category']; status: 'ALL' | AdminExam['status']
  visibleSubjects: AdminSubject[]; departments: Department[]; semesters: AcademicYear[]
  onSearchChange: (value: string) => void; onDepartmentChange: (value: string) => void
  onSubjectChange: (value: string) => void; onCategoryChange: (value: 'ALL' | AdminExam['category']) => void
  onStatusChange: (value: 'ALL' | AdminExam['status']) => void; onReset: () => void
  onSemesterChange: (value: string) => void
}

export default function ExamTrackingToolbar(props: Props) {
  const { search, semester, department, subject, category, status, visibleSubjects, departments } = props
  return (
    <AdminToolbar
      variant="split"
      searchValue={search}
      onSearchChange={props.onSearchChange}
      searchPlaceholder="Tìm tên đề, môn học hoặc người soạn..."
      onReset={props.onReset}
      filters={
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 w-full">
          <AdminSelect
            value={semester}
            className="w-full"
            onChange={props.onSemesterChange}
            options={[
              { value: 'ALL', label: 'Tất cả học kỳ' },
              ...props.semesters.map(({ id, name, isCurrent }) => ({ value: id, label: `${name}${isCurrent ? ' (Hiện tại)' : ''}` })),
            ]}
          />
          <AdminSelect
            value={department}
            className="w-full"
            onChange={(value) => {
              props.onDepartmentChange(value)
              props.onSubjectChange('ALL')
            }}
            options={[{ value: 'ALL', label: 'Tất cả bộ môn' }, ...departments.map(({ id, name }) => ({ value: id, label: name }))]}
          />
          <AdminSelect
            value={subject}
            className="w-full"
            onChange={props.onSubjectChange}
            options={[{ value: 'ALL', label: 'Tất cả môn học' }, ...visibleSubjects.map(({ id, code, name }) => ({ value: id, label: `${code} - ${name}` }))]}
          />
          <AdminSelect
            value={category}
            className="w-full"
            onChange={(value) => props.onCategoryChange(value as Props['category'])}
            options={[
              { value: 'ALL', label: 'Tất cả loại đề' },
              { value: 'QUIZ', label: 'Thường kỳ' },
              { value: 'MIDTERM', label: 'Giữa kỳ' },
              { value: 'FINAL', label: 'Cuối kỳ' },
            ]}
          />
          <AdminSelect
            value={status}
            className="w-full"
            onChange={(value) => props.onStatusChange(value as Props['status'])}
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'DRAFT', label: 'Bản nháp' },
              { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
              { value: 'APPROVED', label: 'Đã duyệt / công bố' },
              { value: 'REJECTED', label: 'Bị từ chối' },
              { value: 'LOCKED', label: 'Đã chốt lịch thi' },
              { value: 'ARCHIVED', label: 'Đã lưu trữ' },
            ]}
          />
        </div>
      }
    />
  )
}
