import type { AdminExam, AdminSubject, Department } from '../../types/admin.types'
import AdminSelect from '../AdminSelect'
import AdminToolbar from '../AdminToolbar'

interface Props {
  search: string; department: string; subject: string
  category: 'ALL' | AdminExam['category']; status: 'ALL' | AdminExam['status']
  visibleSubjects: AdminSubject[]; departments: Department[]
  onSearchChange: (value: string) => void; onDepartmentChange: (value: string) => void
  onSubjectChange: (value: string) => void; onCategoryChange: (value: 'ALL' | AdminExam['category']) => void
  onStatusChange: (value: 'ALL' | AdminExam['status']) => void; onReset: () => void
}

export default function ExamTrackingToolbar(props: Props) {
  const { search, department, subject, category, status, visibleSubjects, departments } = props
  return <AdminToolbar searchValue={search} onSearchChange={props.onSearchChange}
    searchPlaceholder="Tìm tên đề, môn học hoặc người soạn..." onReset={props.onReset}
    filters={<>
      <AdminSelect value={department} className="w-56" onChange={(value) => {
        props.onDepartmentChange(value); props.onSubjectChange('ALL')
      }} options={[{ value: 'ALL', label: 'Tất cả bộ môn' }, ...departments.map(({ id, name }) => ({ value: id, label: name }))]} />
      <AdminSelect value={subject} className="w-56" onChange={props.onSubjectChange}
        options={[{ value: 'ALL', label: 'Tất cả môn học' }, ...visibleSubjects.map(({ id, code, name }) => ({ value: id, label: `${code} - ${name}` }))]} />
      <AdminSelect value={category} className="w-44" onChange={(value) => props.onCategoryChange(value as Props['category'])}
        options={[{ value: 'ALL', label: 'Loại đề thi' }, { value: 'QUIZ', label: 'Thường kỳ' }, { value: 'MIDTERM', label: 'Giữa kỳ' }, { value: 'FINAL', label: 'Cuối kỳ' }]} />
      <AdminSelect value={status} className="w-44" onChange={(value) => props.onStatusChange(value as Props['status'])}
        options={[{ value: 'ALL', label: 'Trạng thái' }, { value: 'DRAFT', label: 'Bản nháp' }, { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' }, { value: 'APPROVED', label: 'Sẵn sàng' }, { value: 'REJECTED', label: 'Bị từ chối' }, { value: 'LOCKED', label: 'Đã khóa' }]} />
    </>} />
}
