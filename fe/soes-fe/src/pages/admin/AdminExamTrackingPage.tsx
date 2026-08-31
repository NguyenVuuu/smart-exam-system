import { FileCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import AdminPageHeader from './components/AdminPageHeader'
import AdminTablePanel from './components/AdminTablePanel'
import ExamTrackingPreviewModal from './components/exam-tracking/ExamTrackingPreviewModal'
import ExamTrackingTable from './components/exam-tracking/ExamTrackingTable'
import ExamTrackingToolbar from './components/exam-tracking/ExamTrackingToolbar'
import { useAdminExamTracking } from './hooks/useAdminContent'
import { useAdminStructure } from './hooks/useAdminStructure'
import { useAdminSemesters } from './hooks/useAdminSemesters'
import type { AdminExam } from './types/admin.types'

export default function AdminExamTrackingPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [department, setDepartment] = useState('ALL')
  const [semester, setSemester] = useState('ALL')
  const [subject, setSubject] = useState('ALL')
  const [category, setCategory] = useState<'ALL' | AdminExam['category']>('ALL')
  const [status, setStatus] = useState<'ALL' | AdminExam['status']>('ALL')
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<AdminExam | null>(null)
  const structure = useAdminStructure()
  const semesters = useAdminSemesters()
  const tracking = useAdminExamTracking({
    page, pageSize: 10, keyword: search || undefined,
    departmentId: department === 'ALL' ? undefined : department,
    subjectId: subject === 'ALL' ? undefined : subject,
    semesterId: semester === 'ALL' ? undefined : semester,
    type: category === 'ALL' ? undefined : category,
    status: status === 'DRAFT' || status === 'LOCKED' || status === 'ARCHIVED' ? status : undefined,
    approvalStatus: status === 'PENDING_APPROVAL' ? 'PENDING'
      : status === 'APPROVED' ? 'APPROVED' : status === 'REJECTED' ? 'REJECTED' : undefined,
  })
  const visibleSubjects = useMemo(() => structure.subjects.filter(
    (item) => department === 'ALL' || item.departmentId === department,
  ), [department, structure.subjects])
  const reset = () => {
    setPage(1); setSearch(''); setSemester('ALL'); setDepartment('ALL'); setSubject('ALL'); setCategory('ALL'); setStatus('ALL')
  }
  const createSchedule = (exam: AdminExam) => navigate(`/admin/final-exam-schedules?createExamId=${exam.id}`)

  return <AdminLayout>
    <AdminPageHeader icon={<FileCheck size={20} />} title="Theo dõi đề thi toàn trường"
      description="Theo dõi tiến độ đề thi; Admin chỉ tổ chức ca cuối kỳ từ đề đã được duyệt chuyên môn." />
    <AdminTablePanel>
      <ExamTrackingToolbar search={search} onSearchChange={(value) => { setSearch(value); setPage(1) }}
        semester={semester} onSemesterChange={(value) => { setSemester(value); setPage(1) }} semesters={semesters.items}
        department={department} onDepartmentChange={(value) => { setDepartment(value); setPage(1) }}
        subject={subject} onSubjectChange={(value) => { setSubject(value); setPage(1) }}
        category={category} onCategoryChange={(value) => { setCategory(value); setPage(1) }}
        status={status} onStatusChange={(value) => { setStatus(value); setPage(1) }}
        visibleSubjects={visibleSubjects} departments={structure.departments} onReset={reset} />
      <ExamTrackingTable
        exams={tracking.items}
        onViewExam={setViewing}
        onCreateSchedule={createSchedule}
        page={page}
        pageSize={10}
        totalItems={tracking.pagination.totalItems}
        totalPages={tracking.pagination.totalPages}
        onPageChange={setPage}
      />
    </AdminTablePanel>
    <ExamTrackingPreviewModal exam={viewing} onClose={() => setViewing(null)} onCreateSchedule={createSchedule} />
  </AdminLayout>
}
