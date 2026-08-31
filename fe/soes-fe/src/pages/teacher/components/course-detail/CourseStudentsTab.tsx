import { Search } from 'lucide-react'
import type { StudentEnrollment } from '../../types/teacher-course.types'
import TeacherPagination from '../TeacherPagination'

interface Props {
  students: StudentEnrollment[]
  keyword: string
  onKeywordChange: (value: string) => void
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number }
  onPageChange: (page: number) => void
}

export default function CourseStudentsTab({ students, keyword, onKeywordChange, pagination, onPageChange }: Props) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="text-base font-semibold text-gray-900">Danh sách sinh viên đã ghi danh</h3><p className="mt-1 text-sm text-gray-500">Danh sách thuộc lớp học phần do phòng đào tạo quản lý.</p></div>
        <label className="flex h-10 w-full max-w-sm items-center gap-2 rounded-xl border border-gray-200 px-3 text-slate-500"><Search size={16} /><input value={keyword} onChange={(event) => onKeywordChange(event.target.value)} placeholder="Tìm theo MSSV, tên hoặc email..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
      </div>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="whitespace-nowrap border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase text-gray-500"><tr><th className="p-4">STT</th><th className="p-4">MSSV</th><th className="p-4">Họ và tên</th><th className="p-4">Email</th><th className="p-4">Ngày ghi danh</th><th className="p-4">Trạng thái</th></tr></thead>
        <tbody className="divide-y divide-gray-50">{students.map((student, index) => (
          <tr key={student.id} className="hover:bg-gray-50"><td className="p-4 text-gray-400">{(pagination.page - 1) * pagination.pageSize + index + 1}</td><td className="p-4 text-gray-700">{student.studentCode}</td><td className="p-4 font-semibold text-gray-900">{student.fullName}</td><td className="p-4 text-gray-500">{student.email}</td><td className="p-4 text-gray-500">{student.enrolledAt}</td><td className="p-4"><span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Đang học</span></td></tr>
        ))}</tbody>
      </table></div>
      <TeacherPagination {...pagination} onChange={onPageChange} />
    </section>
  )
}
