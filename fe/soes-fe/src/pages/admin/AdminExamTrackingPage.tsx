import { CalendarPlus, Eye, FileCheck, RotateCcw, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBadge from '../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import { ADMIN_ACADEMIC_YEARS, ADMIN_DEPARTMENTS, ADMIN_EXAMS, ADMIN_SUBJECTS } from './mock/admin.mock'
import type { AdminExam } from './types/admin.types'
import { ExamCategoryBadge, ExamStatusBadge } from './components/AdminBadges'
import AdminLayout from './components/AdminLayout'
import AdminPageHeader from './components/AdminPageHeader'
import AdminSelect from './components/AdminSelect'
import AdminTablePanel from './components/AdminTablePanel'

const canCreateCentralSchedule = (exam: AdminExam) => exam.category === 'FINAL' && exam.status === 'APPROVED'

const getOperationNote = (exam: AdminExam) => {
  if (exam.category !== 'FINAL') return 'Giảng viên tự tổ chức trong lớp phụ trách'
  if (exam.status === 'APPROVED') return 'Sẵn sàng để Admin tạo lịch thi tập trung'
  if (exam.status === 'PENDING_APPROVAL') return 'Chờ Trưởng bộ môn duyệt chuyên môn'
  if (exam.status === 'REJECTED') return 'Đã bị từ chối, chờ giảng viên chỉnh sửa'
  if (exam.status === 'LOCKED') return 'Đã khóa do đã có ca thi hoặc bài làm'
  return 'Chưa đủ điều kiện tổ chức thi cuối kỳ'
}

const structureLabel: Record<AdminExam['structure'], string> = {
  OBJECTIVE: 'Trắc nghiệm',
  PROGRAMMING: 'Lập trình',
  MIXED: 'Hỗn hợp',
}

type PreviewQuestionOption = {
  label: string
  content: string
  correct?: boolean
}

type PreviewQuestion = {
  id: string
  kind: 'Trắc nghiệm' | 'Lập trình'
  points: number
  content: string
  options?: PreviewQuestionOption[]
  codeNote?: string
}

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

  const filteredExams = useMemo(() => ADMIN_EXAMS.filter((item) => {
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
  }), [category, department, search, semester, status, subject])

  const columns: ColumnDef<AdminExam>[] = [
    {
      header: 'ĐỀ THI',
      render: (item) => (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-950">{item.title}</p>
          <p className="text-xs text-slate-400">{item.subjectName} • Giảng viên soạn: {item.authorName}</p>
        </div>
      ),
    },
    {
      header: 'LOẠI',
      width: '240px',
      render: (item) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <ExamCategoryBadge category={item.category} />
          <span className="text-xs font-normal text-slate-400">{structureLabel[item.structure]}</span>
        </div>
      ),
    },
    { header: 'ĐIỂM / CÂU', width: '150px', render: (item) => <span className="text-sm text-slate-700">{item.totalPoints} điểm • {item.questionCount} câu</span> },
    { header: 'THỜI GIAN', width: '120px', render: (item) => <span className="text-sm text-slate-700">{item.durationMinutes} phút</span> },
    {
      header: 'TRẠNG THÁI',
      width: '160px',
      render: (item) => <ExamStatusBadge status={item.status} />,
    },
    {
      header: 'THAO TÁC',
      width: '130px',
      align: 'right',
      render: (item) => {
        const canSchedule = canCreateCentralSchedule(item)

        return (
          <div className="flex justify-end gap-1 text-slate-500">
            <button className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600" title="Xem đề" onClick={() => setViewing(item)}><Eye size={17} /></button>
            <button
              disabled={!canSchedule}
              className="rounded-lg p-1.5 hover:bg-emerald-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-30"
              title={canSchedule ? 'Tạo lịch thi tập trung từ đề cuối kỳ này' : 'Admin chỉ tạo lịch tập trung cho đề cuối kỳ đã duyệt chuyên môn'}
              onClick={() => navigate('/admin/exam-schedules')}
            >
              <CalendarPlus size={17} />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<FileCheck size={20} />}
        title="Theo dõi đề thi"
        description="Admin theo dõi trạng thái đề. Quiz và giữa kỳ do giảng viên tự tổ chức; cuối kỳ phải được Trưởng bộ môn duyệt trước khi Admin tạo lịch thi tập trung."
      />

      <AdminTablePanel>
        <div className="border-b border-gray-100 bg-white p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              <AdminSelect value={semester} onChange={setSemester} options={[
                { value: 'ALL', label: 'Học kỳ' },
                ...ADMIN_ACADEMIC_YEARS.map((item) => ({ value: item.code, label: item.code })),
              ]} />
              <AdminSelect
                value={department}
                onChange={(value) => {
                  setDepartment(value)
                  setSubject('ALL')
                }}
                options={[
                  { value: 'ALL', label: 'Bộ môn' },
                  ...ADMIN_DEPARTMENTS.map((item) => ({ value: item.id, label: item.name })),
                ]}
              />
              <AdminSelect value={subject} onChange={setSubject} options={[
                { value: 'ALL', label: 'Môn học' },
                ...visibleSubjects.map((item) => ({ value: item.code, label: `${item.code} - ${item.name}` })),
              ]} />
              <AdminSelect value={category} onChange={setCategory} options={[
                { value: 'ALL', label: 'Loại bài thi' },
                { value: 'QUIZ', label: 'Quiz' },
                { value: 'MIDTERM', label: 'Giữa kỳ' },
                { value: 'FINAL', label: 'Cuối kỳ' },
              ]} />
              <AdminSelect value={status} onChange={setStatus} options={[
                { value: 'ALL', label: 'Trạng thái' },
                { value: 'PENDING_APPROVAL', label: 'Chờ Trưởng bộ môn' },
                { value: 'APPROVED', label: 'Đã duyệt chuyên môn' },
                { value: 'DRAFT', label: 'Nháp' },
                { value: 'REJECTED', label: 'Bị từ chối' },
                { value: 'LOCKED', label: 'Đã khóa' },
              ]} />
            </div>

            <div className="flex shrink-0 items-center gap-2 xl:ml-4">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                title="Làm mới bộ lọc"
                onClick={() => {
                  setSearch('')
                  setSemester('ALL')
                  setDepartment('ALL')
                  setSubject('ALL')
                  setCategory('ALL')
                  setStatus('ALL')
                }}
              >
                <RotateCcw size={17} />
              </button>
              <div className="relative w-full sm:w-80 xl:w-[360px]">
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm theo tên đề, môn học hoặc giảng viên..."
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
          </div>
        </div>
        <DataTable columns={columns} data={filteredExams} keyExtractor={(item) => item.id} emptyText="Chưa có đề thi phù hợp." />
      </AdminTablePanel>

      <AdminExamPreviewModal exam={viewing} onClose={() => setViewing(null)} />
    </AdminLayout>
  )
}

function AdminExamPreviewModal({
  exam,
  onClose,
}: {
  exam: AdminExam | null
  onClose: () => void
}) {
  if (!exam) return null

  const canSchedule = canCreateCentralSchedule(exam)
  const sampleQuestions = buildPreviewQuestions(exam)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-950">Xem đề thi</h2>
            <p className="mt-1 truncate text-[13px] leading-[19px] text-slate-500">
              {exam.title} • Admin chỉ theo dõi và tạo lịch thi tập trung khi đủ điều kiện.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-gray-100 hover:text-slate-700"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-6">
          <div className="grid h-full min-h-0 grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-4 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div>
                <p className="text-sm font-semibold leading-6 text-slate-950">{exam.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{exam.subjectCode} • {exam.subjectName}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <ExamCategoryBadge category={exam.category} />
                <ExamStatusBadge status={exam.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <PreviewStat label="Cấu trúc" value={structureLabel[exam.structure]} />
                <PreviewStat label="Tổng câu" value={`${exam.questionCount} câu`} />
                <PreviewStat label="Thời lượng" value={`${exam.durationMinutes} phút`} />
                <PreviewStat label="Tổng điểm" value={`${exam.totalPoints} điểm`} />
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-3 text-xs leading-5 text-slate-600">
                <p>Giảng viên soạn</p>
                <p className="font-semibold text-slate-900">{exam.authorName}</p>
              </div>

              <div className={`rounded-xl border px-3 py-3 text-xs leading-5 ${
                canSchedule
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
                  : 'border-amber-100 bg-amber-50 text-amber-800'
              }`}>
                {getOperationNote(exam)}
              </div>
            </aside>

            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white">
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-950">Nội dung đề thi</h3>
                <span className="text-xs text-slate-400">{exam.questionCount} câu • {exam.totalPoints} điểm</span>
              </div>

              <div className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto">
                {sampleQuestions.map((question, index) => (
                  <article key={question.id} className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-700">Câu {index + 1}</span>
                      <AppBadge tone={question.kind === 'Lập trình' ? 'emerald' : 'blue'}>{question.kind}</AppBadge>
                      <AppBadge tone="gray">{question.points} điểm</AppBadge>
                    </div>
                    <p className="text-sm font-medium leading-6 text-slate-900">{question.content}</p>

                    {question.options && (
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {question.options.map((option) => (
                          <div
                            key={option.label}
                            className={`rounded-xl border px-3 py-2 text-sm ${
                              option.correct
                                ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
                                : 'border-gray-100 bg-gray-50 text-slate-600'
                            }`}
                          >
                            <span className="font-semibold">{option.label}.</span> {option.content}
                          </div>
                        ))}
                      </div>
                    )}

                    {question.codeNote && (
                      <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs leading-5 text-slate-600">
                        {question.codeNote}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="flex shrink-0 justify-end border-t border-gray-100 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2">
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-xs font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function buildPreviewQuestions(exam: AdminExam): PreviewQuestion[] {
  const point = Number((exam.totalPoints / Math.max(exam.questionCount, 1)).toFixed(2))
  const baseQuestions: PreviewQuestion[] = exam.structure === 'PROGRAMMING'
    ? [
        {
          id: `${exam.id}-q1`,
          kind: 'Lập trình',
          points: point,
          content: 'Viết chương trình đọc vào một số nguyên n và kiểm tra n có phải số nguyên tố hay không.',
          codeNote: 'Ngôn ngữ cho phép: Java/C/C++ • Có test mẫu và test ẩn • Không hiển thị hidden test cho sinh viên.',
        },
      ]
    : [
        {
          id: `${exam.id}-q1`,
          kind: 'Trắc nghiệm',
          points: point,
          content: 'Từ khóa nào dùng để khai báo một hằng số trong Java?',
          options: [
            { label: 'A', content: 'const' },
            { label: 'B', content: 'final', correct: true },
            { label: 'C', content: 'static' },
            { label: 'D', content: 'let' },
          ],
        },
        {
          id: `${exam.id}-q2`,
          kind: exam.structure === 'MIXED' ? 'Lập trình' : 'Trắc nghiệm',
          points: point,
          content: exam.structure === 'MIXED'
            ? 'Viết hàm Java tính tổng các số nguyên tố trong mảng số nguyên.'
            : 'Trong Java, kiểu int có kích thước 32 bit.',
          codeNote: exam.structure === 'MIXED'
            ? 'Ngôn ngữ: Java • Time limit 1000ms • Memory 128MB • 3 test case'
            : undefined,
          options: exam.structure === 'MIXED'
            ? undefined
            : [
                { label: 'A', content: 'Đúng', correct: true },
                { label: 'B', content: 'Sai' },
              ],
        },
      ]

  return baseQuestions.slice(0, Math.max(1, Math.min(exam.questionCount, 4)))
}
