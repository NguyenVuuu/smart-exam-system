import { Upload, Users, X } from 'lucide-react'
import type { AdminUser, CourseOfferingAdmin } from '../../types/admin.types'
import AdminButton from '../AdminButton'
import { AdminInput } from '../AdminFormFields'

export default function ClassEnrollmentModal({
  course,
  students,
  search,
  selectedStudentIds,
  onSearchChange,
  onToggleStudent,
  onClose,
  onConfirm,
}: {
  course: CourseOfferingAdmin | null
  students: AdminUser[]
  search: string
  selectedStudentIds: string[]
  onSearchChange: (value: string) => void
  onToggleStudent: (studentId: string) => void
  onClose: () => void
  onConfirm: () => void
}) {
  if (!course) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[82vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Xếp lớp sinh viên - {course.code}</h2>
            <p className="mt-1 text-[13px] leading-[19px] text-slate-500">
              Đã chọn {selectedStudentIds.length} / {course.capacity} sinh viên (sức chứa tối đa).
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

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
          <AdminInput
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm sinh viên theo mã, tên, email..."
            className="max-w-sm"
          />
          <AdminButton tone="secondary" icon={<Upload size={17} />}>
            Nhập từ Excel / CSV
          </AdminButton>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="overflow-hidden rounded-xl border border-gray-100">
            {students.map((student) => (
              <label
                key={student.id}
                className="flex cursor-pointer items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-gray-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(student.id)}
                    onChange={() => onToggleStudent(student.id)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{student.fullName}</p>
                    <p className="truncate text-xs text-slate-400">{student.email}</p>
                  </div>
                </div>
                <span className="shrink-0 text-sm text-slate-500">{student.code}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <AdminButton tone="secondary" onClick={onClose}>
            Hủy
          </AdminButton>
          <AdminButton icon={<Users size={17} />} onClick={onConfirm}>
            Lưu danh sách
          </AdminButton>
        </div>
      </div>
    </div>
  )
}
