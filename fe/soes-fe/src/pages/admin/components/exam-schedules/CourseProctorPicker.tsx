import { AlertCircle, CheckCircle2, Clock3, UserRoundPlus, Users, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { PROCTOR_TURNOVER_MINUTES } from '../../constants/finalExamScheduleOptions'
import type { AdminUser, CourseOfferingAdmin } from '../../types/admin.types'
import AdminSelect from '../AdminSelect'

interface CourseProctorPickerProps {
  courses: CourseOfferingAdmin[]
  selectedCourseIds: string[]
  proctorsByCourse: Record<string, string[]>
  teachers: AdminUser[]
  selectedExam: boolean
  getAssignmentIssue: (courseId: string) => string | null
  getTeacherUnavailableReason: (courseId: string, teacher: AdminUser) => string | null
  onToggleCourse: (courseId: string) => void
  onChangeProctors: (courseId: string, teacherIds: string[]) => void
}

export default function CourseProctorPicker({
  courses,
  selectedCourseIds,
  proctorsByCourse,
  teachers,
  selectedExam,
  getAssignmentIssue,
  getTeacherUnavailableReason,
  onToggleCourse,
  onChangeProctors,
}: CourseProctorPickerProps) {
  return (
    <div className="mt-6 border-t border-gray-100 pt-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Lớp áp dụng và giảng viên coi thi</h3>
          <p className="mt-1 text-[13px] leading-[19px] text-slate-500">
            Chỉ hiển thị lớp cùng môn và học kỳ với đề đã chọn.
          </p>
        </div>
        <span className="shrink-0 text-xs text-slate-500">Đã chọn {selectedCourseIds.length} lớp</span>
      </div>

      <CourseListState selectedExam={selectedExam} courses={courses}>
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
          <div className="hidden grid-cols-[minmax(220px,1fr)_minmax(260px,1fr)] gap-4 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500 md:grid">
            <span>Lớp học phần</span>
            <span>Giảng viên coi thi</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {courses.map((course) => (
              <CourseProctorRow
                key={course.id}
                course={course}
                selected={selectedCourseIds.includes(course.id)}
                proctorIds={proctorsByCourse[course.id] ?? []}
                teachers={teachers}
                issue={getAssignmentIssue(course.id)}
                getTeacherUnavailableReason={(teacher) => getTeacherUnavailableReason(course.id, teacher)}
                onToggle={() => onToggleCourse(course.id)}
                onChangeProctors={(teacherIds) => onChangeProctors(course.id, teacherIds)}
              />
            ))}
          </div>
        </div>
      </CourseListState>

      <div className="mt-4 flex items-start gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-[13px] leading-[19px] text-emerald-800">
        <Clock3 size={17} className="mt-0.5 shrink-0" />
        Hệ thống kiểm tra trùng lịch theo toàn bộ ca thi và yêu cầu giảng viên có ít nhất {PROCTOR_TURNOVER_MINUTES} phút để chuyển ca.
      </div>
    </div>
  )
}

function CourseListState({
  selectedExam,
  courses,
  children,
}: {
  selectedExam: boolean
  courses: CourseOfferingAdmin[]
  children: ReactNode
}) {
  if (!selectedExam) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-slate-500">
        Chọn đề cuối kỳ để xem các lớp học phần phù hợp.
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-slate-500">
        Không có lớp đang mở phù hợp với đề này.
      </div>
    )
  }

  return children
}

function CourseProctorRow({
  course,
  selected,
  proctorIds,
  teachers,
  issue,
  getTeacherUnavailableReason,
  onToggle,
  onChangeProctors,
}: {
  course: CourseOfferingAdmin
  selected: boolean
  proctorIds: string[]
  teachers: AdminUser[]
  issue: string | null
  getTeacherUnavailableReason: (teacher: AdminUser) => string | null
  onToggle: () => void
  onChangeProctors: (teacherIds: string[]) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-3 border-t border-gray-100 px-4 py-3 first:border-t-0 md:grid-cols-[minmax(220px,1fr)_minmax(260px,1fr)] md:items-center md:gap-4">
      <label className="flex min-w-0 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="h-4 w-4 shrink-0 accent-emerald-600"
        />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-slate-900">{course.code}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
            <Users size={13} /> {course.enrolled}/{course.capacity} sinh viên · GV phụ trách: {course.teacherName}
          </span>
        </span>
      </label>

      <div className="min-w-0">
        <ProctorMultiSelect
          selectedIds={proctorIds}
          teachers={teachers}
          disabled={!selected}
          getTeacherUnavailableReason={getTeacherUnavailableReason}
          onChange={onChangeProctors}
        />
        {selected && (
          <p className={`mt-1.5 flex items-center gap-1.5 text-xs ${issue ? 'text-rose-600' : 'text-emerald-600'}`}>
            {issue ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
            {issue ?? `Đã phân công ${proctorIds.length} giảng viên, không bị trùng lịch.`}
          </p>
        )}
      </div>
    </div>
  )
}

function ProctorMultiSelect({
  selectedIds,
  teachers,
  disabled,
  getTeacherUnavailableReason,
  onChange,
}: {
  selectedIds: string[]
  teachers: AdminUser[]
  disabled: boolean
  getTeacherUnavailableReason: (teacher: AdminUser) => string | null
  onChange: (teacherIds: string[]) => void
}) {
  const availableTeachers = teachers.filter((teacher) => !selectedIds.includes(teacher.id))

  return (
    <div className="space-y-2">
      <AdminSelect
        value=""
        disabled={disabled || availableTeachers.length === 0}
        onChange={(teacherId) => {
          if (teacherId) onChange([...selectedIds, teacherId])
        }}
        options={[
          {
            value: '',
            label: disabled
              ? 'Chọn lớp trước'
              : availableTeachers.length === 0
                ? 'Đã chọn tất cả giảng viên'
                : 'Thêm giảng viên coi thi',
          },
          ...availableTeachers.map((teacher) => {
            const unavailableReason = getTeacherUnavailableReason(teacher)
            return {
              value: teacher.id,
              disabled: Boolean(unavailableReason),
              label: (
                <span className="block min-w-0">
                  <span className="block truncate">{teacher.fullName} - {teacher.code}</span>
                  {unavailableReason && (
                    <span className="mt-0.5 block truncate text-[11px] leading-4 text-gray-400">
                      {unavailableReason}
                    </span>
                  )}
                </span>
              ),
            }
          }),
        ]}
      />

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedIds.map((teacherId) => {
            const teacher = teachers.find((item) => item.id === teacherId)
            if (!teacher) return null
            return (
              <span
                key={teacherId}
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800"
              >
                <UserRoundPlus size={13} className="shrink-0" />
                <span className="truncate">{teacher.fullName}</span>
                <button
                  type="button"
                  onClick={() => onChange(selectedIds.filter((id) => id !== teacherId))}
                  className="rounded p-0.5 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800"
                  title={`Bỏ ${teacher.fullName}`}
                  aria-label={`Bỏ ${teacher.fullName}`}
                >
                  <X size={12} />
                </button>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
