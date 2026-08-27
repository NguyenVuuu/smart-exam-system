import { FileCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import AdminPageHeader from './components/AdminPageHeader'
import AdminTablePanel from './components/AdminTablePanel'
import ExamTrackingPreviewModal from './components/exam-tracking/ExamTrackingPreviewModal'
import ExamTrackingTable from './components/exam-tracking/ExamTrackingTable'
import ExamTrackingToolbar from './components/exam-tracking/ExamTrackingToolbar'
import { ADMIN_EXAMS, ADMIN_SUBJECTS } from './mock/admin.mock'
import type { AdminExam } from './types/admin.types'

export default function AdminExamTrackingPage() {
  const navigate = useNavigate()
  const [semester, setSemester] = useState('ALL')
  const [department, setDepartment] = useState('ALL')
  const [subject, setSubject] = useState('ALL')
  const [category, setCategory] = useState<'ALL' | AdminExam['category']>('ALL')
  const [status, setStatus] = useState<'ALL' | AdminExam['status']>('ALL')
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<AdminExam | null>(null)

  const visibleSubjects = useMemo(
    () => ADMIN_SUBJECTS.filter((item) => department === 'ALL' || item.departmentId === department),
    [department],
  )

  const filteredExams = useMemo(
    () =>
      ADMIN_EXAMS.filter((item) => {
        const matchesSemester = semester === 'ALL' || item.semesterCode === semester
        const matchesDepartment = department === 'ALL' || item.departmentId === department
        const matchesSubject = subject === 'ALL' || item.subjectCode === subject
        const matchesCategory = category === 'ALL' || item.category === category
        const matchesStatus = status === 'ALL' || item.status === status
        const matchesSearch =
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.subjectCode.toLowerCase().includes(search.toLowerCase()) ||
          item.subjectName.toLowerCase().includes(search.toLowerCase()) ||
          item.authorName.toLowerCase().includes(search.toLowerCase())
        return matchesSemester && matchesDepartment && matchesSubject && matchesCategory && matchesStatus && matchesSearch
      }),
    [category, department, search, semester, status, subject],
  )

  const handleResetFilters = () => {
    setSearch('')
    setSemester('ALL')
    setDepartment('ALL')
    setSubject('ALL')
    setCategory('ALL')
    setStatus('ALL')
  }

  const handleCreateScheduleFromExam = (exam: AdminExam) => {
    navigate(`/admin/final-exam-schedules?createExamId=${exam.id}`)
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<FileCheck size={20} />}
        title="Theo dõi Đề thi Toàn trường"
        description="Giám sát tiến độ nộp đề, tình trạng duyệt chuyên môn của Trưởng bộ môn và chuẩn bị tổ chức thi cuối kỳ."
      />

      <AdminTablePanel>
        <ExamTrackingToolbar
          search={search}
          onSearchChange={setSearch}
          semester={semester}
          onSemesterChange={setSemester}
          department={department}
          onDepartmentChange={setDepartment}
          subject={subject}
          onSubjectChange={setSubject}
          category={category}
          onCategoryChange={setCategory}
          status={status}
          onStatusChange={setStatus}
          visibleSubjects={visibleSubjects}
          onReset={handleResetFilters}
        />

        <ExamTrackingTable
          exams={filteredExams}
          onViewExam={setViewing}
          onCreateSchedule={handleCreateScheduleFromExam}
        />
      </AdminTablePanel>

      <ExamTrackingPreviewModal
        exam={viewing}
        onClose={() => setViewing(null)}
        onCreateSchedule={handleCreateScheduleFromExam}
      />
    </AdminLayout>
  )
}
