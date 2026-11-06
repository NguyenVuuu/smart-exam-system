import { CalendarPlus, Search } from 'lucide-react'
import { useState } from 'react'
import type { AdminExam, AdminSubject, Department } from '../../types/admin.types'
import AdminPagination from '../AdminPagination'
import AdminSelect from '../AdminSelect'

const pageSize = 10

export default function ApprovedExamsList({
  exams, departments, subjects, canManage, onCreate,
}: {
  exams: AdminExam[]
  departments: Department[]
  subjects: AdminSubject[]
  canManage: boolean
  onCreate: (exam: AdminExam) => void
}) {
  const [keyword, setKeyword] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [subjectCode, setSubjectCode] = useState('')
  const [page, setPage] = useState(1)
  const visibleSubjects = subjects.filter((subject) => !departmentId || subject.departmentId === departmentId)
  const filtered = exams.filter((exam) =>
    (!departmentId || exam.departmentId === departmentId) &&
    (!subjectCode || exam.subjectCode === subjectCode) &&
    `${exam.title} ${exam.subjectCode} ${exam.subjectName} ${exam.semesterCode}`
      .toLocaleLowerCase('vi').includes(keyword.trim().toLocaleLowerCase('vi')),
  )
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <section role="tabpanel" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Đề cuối kỳ đã duyệt</h2>
          <p className="mt-1 text-sm text-slate-500">Chọn đề để lập ca thi và phân công lớp học phần.</p>
        </div>
        <span className="text-sm font-medium text-slate-500">{exams.length} đề</span>
      </div>
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:px-6 xl:flex-row xl:items-center">
        <AdminSelect value={departmentId} className="w-full xl:w-64 2xl:w-72" placeholder="Bộ môn"
          onChange={(value) => { setDepartmentId(String(value)); setSubjectCode(''); setPage(1) }}
          options={[{ value: '', label: 'Tất cả bộ môn' }, ...departments.map((item) => ({ value: item.id, label: item.name }))]} />
        <AdminSelect value={subjectCode} className="w-full xl:w-64 2xl:w-72" placeholder="Môn học"
          onChange={(value) => { setSubjectCode(String(value)); setPage(1) }}
          options={[{ value: '', label: 'Tất cả môn học' }, ...visibleSubjects.map((item) => ({ value: item.code, label: `${item.code} · ${item.name}` }))]} />
        <label className="flex w-full items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-slate-400 focus-within:border-emerald-500 xl:ml-auto xl:w-72 2xl:w-80">
          <Search size={17} />
          <input className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(1) }}
            placeholder="Tìm tên đề, môn học hoặc học kỳ..." aria-label="Tìm đề đã duyệt" />
        </label>
      </div>
      <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_180px] gap-4 border-b border-slate-100 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
        <span>Đề thi</span><span>Môn học</span><span>Học kỳ</span><span>Cấu trúc</span><span className="text-right">Thao tác</span>
      </div>
      {visible.length ? visible.map((exam) => (
        <div key={exam.id} className="grid gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0 hover:bg-slate-50/70 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_180px] lg:items-center lg:gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900" title={exam.title}>{exam.title}</p>
            <p className="mt-1 text-xs text-emerald-700">Đã duyệt chuyên môn</p>
          </div>
          <p className="min-w-0 truncate text-sm text-slate-600" title={exam.subjectName}>{exam.subjectCode} · {exam.subjectName}</p>
          <p className="text-sm text-slate-600">{exam.semesterCode}</p>
          <p className="text-sm text-slate-600">{exam.questionCount} câu · {exam.durationMinutes} phút</p>
          {canManage && <button type="button" onClick={() => onCreate(exam)}
            className="inline-flex min-h-9 w-fit items-center justify-center gap-1.5 rounded-lg border border-emerald-200 px-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 lg:ml-auto">
            <CalendarPlus size={15} /> Tạo ca thi
          </button>}
        </div>
      )) : <div className="px-6 py-14 text-center text-sm text-slate-500">{keyword ? 'Không tìm thấy đề phù hợp.' : 'Chưa có đề cuối kỳ đã duyệt sẵn sàng.'}</div>}
      <AdminPagination page={page} pageSize={pageSize} totalPages={Math.max(1, Math.ceil(filtered.length / pageSize))}
        totalItems={filtered.length} onChange={setPage} />
    </section>
  )
}
