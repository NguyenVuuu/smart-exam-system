import { Trash2, UserPlus, Users, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { AdminUser, CourseEnrollmentAdmin, CourseOfferingAdmin } from '../../types/admin.types'
import AdminButton from '../AdminButton'
import { AdminInput } from '../AdminFormFields'

type EnrollmentTab = 'ROSTER' | 'ADD'

export default function ClassEnrollmentModal({
  course, students, enrollments, loading, search, selectedStudentIds,
  onSearchChange, onToggleStudent, onRemoveStudent, onClose, onConfirm,
}: {
  course: CourseOfferingAdmin | null
  students: AdminUser[]
  enrollments: CourseEnrollmentAdmin[]
  loading: boolean
  search: string
  selectedStudentIds: string[]
  onSearchChange: (value: string) => void
  onToggleStudent: (studentId: string) => void
  onRemoveStudent: (studentId: string) => void
  onClose: () => void
  onConfirm: () => void
}) {
  const [activeTab, setActiveTab] = useState<EnrollmentTab>('ROSTER')

  if (!course) return null

  const visibleEnrollments = enrollments.filter((student) =>
    `${student.code} ${student.fullName} ${student.email}`.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[82vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Sinh viên lớp {course.code}</h2>
            <p className="mt-1 text-[13px] leading-[19px] text-slate-500">Sĩ số {course.enrolled}/{course.capacity} sinh viên</p>
          </div>
          <button type="button" onClick={onClose} title="Đóng" className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-gray-100 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="flex shrink-0 border-b border-gray-200 px-6">
          <TabButton active={activeTab === 'ROSTER'} icon={<Users size={17} />} label={`Danh sách sinh viên (${enrollments.length})`} onClick={() => setActiveTab('ROSTER')} />
          <TabButton active={activeTab === 'ADD'} icon={<UserPlus size={17} />} label="Thêm sinh viên" onClick={() => setActiveTab('ADD')} />
        </div>

        <div className="shrink-0 border-b border-gray-100 px-6 py-4">
          <AdminInput value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Tìm sinh viên theo mã, tên hoặc email..." className="max-w-sm" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'ROSTER'
            ? <RosterList students={visibleEnrollments} loading={loading} onRemoveStudent={onRemoveStudent} />
            : <CandidateList students={students} selectedStudentIds={selectedStudentIds} onToggleStudent={onToggleStudent} />}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <AdminButton tone="secondary" onClick={onClose}>Đóng</AdminButton>
          {activeTab === 'ADD' && (
            <AdminButton icon={<UserPlus size={17} />} onClick={onConfirm}>
              Thêm {selectedStudentIds.length || ''} sinh viên
            </AdminButton>
          )}
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${active ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
      {icon}{label}
    </button>
  )
}

function RosterList({ students, loading, onRemoveStudent }: { students: CourseEnrollmentAdmin[]; loading: boolean; onRemoveStudent: (studentId: string) => void }) {
  if (loading) return <p className="py-10 text-center text-sm text-slate-500">Đang tải danh sách sinh viên...</p>
  if (students.length === 0) return <EmptyState text="Chưa có sinh viên phù hợp." />
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      {students.map((student) => (
        <div key={student.id} className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{student.fullName}</p>
            <p className="truncate text-xs text-slate-400">{student.email || 'Chưa có email'} · Vào lớp {student.enrolledAt}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-sm text-slate-500">{student.code}</span>
            <button type="button" title="Xóa khỏi lớp" onClick={() => {
              if (window.confirm(`Xóa ${student.fullName} khỏi lớp?`)) onRemoveStudent(student.id)
            }} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function CandidateList({ students, selectedStudentIds, onToggleStudent }: { students: AdminUser[]; selectedStudentIds: string[]; onToggleStudent: (studentId: string) => void }) {
  if (students.length === 0) return <EmptyState text="Không có sinh viên có thể thêm." />
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      {students.map((student) => (
        <label key={student.id} className="flex cursor-pointer items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-gray-50">
          <div className="flex min-w-0 items-center gap-3">
            <input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={() => onToggleStudent(student.id)} className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">{student.fullName}</p>
              <p className="truncate text-xs text-slate-400">{student.email}</p>
            </div>
          </div>
          <span className="shrink-0 text-sm text-slate-500">{student.code}</span>
        </label>
      ))}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-slate-500">{text}</p>
}
