import { AlertCircle, CheckCircle2, Clock3, UserRoundPlus, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ADMIN_COURSE_OFFERINGS,
  ADMIN_DEPARTMENTS,
  ADMIN_SUBJECTS,
  ADMIN_USERS,
} from '../../mock/admin.mock'
import type { AdminExam, AdminExamSchedule, AdminUser, CourseOfferingAdmin } from '../../types/admin.types'
import { AdminField, AdminInput } from '../AdminFormFields'
import AdminModal from '../AdminModal'
import AdminSelect from '../AdminSelect'

interface FinalExamScheduleModalProps {
  open: boolean
  exams: AdminExam[]
  schedules: AdminExamSchedule[]
  editingSchedule?: AdminExamSchedule | null
  onClose: () => void
  onSubmit: (schedule: AdminExamSchedule) => void
}

const examModeOptions = [
  { value: 'ONLINE', label: 'Thi trực tuyến từ xa' },
  { value: 'SCHOOL_IP', label: 'Thi trực tuyến trong mạng trường' },
]

const distributionOptions = [
  { value: 'FIXED_ORDER', label: 'Giữ nguyên thứ tự câu hỏi' },
  { value: 'SHUFFLE_ORDER', label: 'Xáo thứ tự câu hỏi' },
  { value: 'SHUFFLE_QUESTIONS_AND_OPTIONS', label: 'Xáo câu hỏi và phương án' },
  { value: 'RANDOM_SUBSET', label: 'Chọn tập câu hỏi ngẫu nhiên theo phần' },
]

const releaseOptions = [
  { value: 'IMMEDIATE', label: 'Hiện điểm ngay sau khi nộp' },
  { value: 'MANUAL', label: 'Ẩn điểm, giảng viên công bố sau' },
  { value: 'SCHEDULED', label: 'Tự động công bố theo thời gian' },
]

const PROCTOR_TURNOVER_MINUTES = 15

export default function FinalExamScheduleModal({
  open,
  exams,
  schedules,
  editingSchedule = null,
  onClose,
  onSubmit,
}: FinalExamScheduleModalProps) {
  const [departmentId, setDepartmentId] = useState('')
  const [subjectCode, setSubjectCode] = useState('')
  const [examId, setExamId] = useState('')
  const [examDate, setExamDate] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('09:30')
  const [examMode, setExamMode] = useState('ONLINE')
  const [ipRange, setIpRange] = useState('')
  const [password, setPassword] = useState('')
  const [distributionMode, setDistributionMode] = useState('SHUFFLE_QUESTIONS_AND_OPTIONS')
  const [releaseMode, setReleaseMode] = useState('MANUAL')
  const [releaseAt, setReleaseAt] = useState('')
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [proctorsByCourse, setProctorsByCourse] = useState<Record<string, string[]>>({})

  const selectedExam = exams.find((exam) => exam.id === examId)
  const subjectsByDepartment = useMemo(
    () => ADMIN_SUBJECTS.filter((subject) => !departmentId || subject.departmentId === departmentId),
    [departmentId],
  )
  const filteredExams = useMemo(
    () => exams.filter((exam) => (
      (!departmentId || exam.departmentId === departmentId)
      && (!subjectCode || exam.subjectCode === subjectCode)
    )),
    [departmentId, exams, subjectCode],
  )
  const teachers = ADMIN_USERS.filter((user) => user.role === 'TEACHER' && user.status === 'ACTIVE')
  const conflictSchedules = useMemo(
    () => schedules.filter((schedule) => schedule.id !== editingSchedule?.id),
    [editingSchedule?.id, schedules],
  )
  const eligibleCourses = useMemo(
    () => ADMIN_COURSE_OFFERINGS.filter((course) => (
      selectedExam
      && course.subjectCode === selectedExam.subjectCode
      && course.semesterCode === selectedExam.semesterCode
      && course.status === 'OPEN'
    )),
    [selectedExam],
  )

  const resetForm = () => {
    setDepartmentId('')
    setSubjectCode('')
    setExamId('')
    setExamDate('')
    setStartTime('08:00')
    setEndTime('09:30')
    setExamMode('ONLINE')
    setIpRange('')
    setPassword('')
    setDistributionMode('SHUFFLE_QUESTIONS_AND_OPTIONS')
    setReleaseMode('MANUAL')
    setReleaseAt('')
    setSelectedCourseIds([])
    setProctorsByCourse({})
  }

  useEffect(() => {
    if (!open) return
    if (!editingSchedule) {
      resetForm()
      return
    }

    const exam = exams.find((item) => item.id === editingSchedule.examId)
      ?? exams.find((item) => editingSchedule.examTitle.includes(item.title))
      ?? exams.find((item) => item.subjectName === editingSchedule.subjectName)
    const selectedCourses = ADMIN_COURSE_OFFERINGS.filter((course) => editingSchedule.courseCodes.includes(course.code))
    const assignmentsByCourse = (editingSchedule.proctorAssignments ?? []).reduce<Record<string, string[]>>((result, assignment) => {
      result[assignment.courseOfferingId] = [...(result[assignment.courseOfferingId] ?? []), assignment.teacherId]
      return result
    }, {})

    setDepartmentId(exam?.departmentId ?? '')
    setSubjectCode(exam?.subjectCode ?? selectedCourses[0]?.subjectCode ?? '')
    setExamId(exam?.id ?? '')
    setExamDate(toInputDate(editingSchedule.date))
    const [existingStartTime = '08:00', existingEndTime = '09:30'] = editingSchedule.time.split(' - ')
    setStartTime(existingStartTime)
    setEndTime(existingEndTime)
    setExamMode(editingSchedule.ipPolicy === 'Không giới hạn IP' ? 'ONLINE' : 'SCHOOL_IP')
    setIpRange(editingSchedule.ipPolicy === 'Không giới hạn IP' ? '' : editingSchedule.ipPolicy)
    setPassword(editingSchedule.password ?? '')
    setDistributionMode(findOptionValue(distributionOptions, editingSchedule.distributionMode, 'SHUFFLE_QUESTIONS_AND_OPTIONS'))
    setReleaseMode(findOptionValue(releaseOptions, editingSchedule.releaseMode, 'MANUAL'))
    setReleaseAt(editingSchedule.resultReleaseAt ?? '')
    setSelectedCourseIds(selectedCourses.map((course) => course.id))
    setProctorsByCourse(assignmentsByCourse)
  }, [editingSchedule, exams, open])

  const closeModal = () => {
    resetForm()
    onClose()
  }

  const changeDepartment = (value: string) => {
    setDepartmentId(value)
    setSubjectCode('')
    setExamId('')
    setSelectedCourseIds([])
    setProctorsByCourse({})
  }

  const changeSubject = (value: string) => {
    setSubjectCode(value)
    setExamId('')
    setSelectedCourseIds([])
    setProctorsByCourse({})
  }

  const changeExam = (value: string) => {
    setExamId(value)
    const exam = exams.find((item) => item.id === value)
    if (exam) {
      setDepartmentId(exam.departmentId)
      setSubjectCode(exam.subjectCode)
    }
    setSelectedCourseIds([])
    setProctorsByCourse({})

    if (exam) {
      const endMinutes = (8 * 60) + exam.durationMinutes
      setEndTime(`${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`)
    }
  }

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds((current) => (
      current.includes(courseId)
        ? current.filter((id) => id !== courseId)
        : [...current, courseId]
    ))
    setProctorsByCourse((current) => {
      if (!current[courseId]) return current
      const next = { ...current }
      delete next[courseId]
      return next
    })
  }

  const getAssignmentIssue = (courseId: string) => {
    if (!selectedCourseIds.includes(courseId)) return null
    const course = eligibleCourses.find((item) => item.id === courseId)
    if (course && hasCourseConflict(conflictSchedules, course.code, examDate, startTime, endTime)) {
      return 'Lớp học phần đã có ca thi giao thời gian này.'
    }
    const teacherIds = proctorsByCourse[courseId] ?? []
    if (teacherIds.length === 0) return 'Chưa phân công giảng viên coi thi.'

    const duplicateTeacher = teachers.find((teacher) => (
      teacherIds.includes(teacher.id)
      && selectedCourseIds.some((id) => id !== courseId && (proctorsByCourse[id] ?? []).includes(teacher.id))
    ))
    if (duplicateTeacher) return `${duplicateTeacher.fullName} đang được phân cho lớp khác trong cùng ca.`

    const conflictedTeacher = teachers.find((teacher) => (
      teacherIds.includes(teacher.id)
      && findExistingProctorConflict(conflictSchedules, teacher.fullName, examDate, startTime, endTime)
    ))
    if (conflictedTeacher) {
      return `${conflictedTeacher.fullName} đã có ca thi gần khung giờ này, cần cách ca ít nhất ${PROCTOR_TURNOVER_MINUTES} phút.`
    }

    return null
  }

  const getTeacherUnavailableReason = (courseId: string, teacher: AdminUser) => {
    const assignedCourseId = selectedCourseIds.find((id) => (
      id !== courseId && (proctorsByCourse[id] ?? []).includes(teacher.id)
    ))
    if (assignedCourseId) {
      const assignedCourse = eligibleCourses.find((item) => item.id === assignedCourseId)
      return `Đã phân công cho ${assignedCourse?.code ?? 'lớp khác'} trong cùng ca`
    }

    const conflict = findExistingProctorConflict(conflictSchedules, teacher.fullName, examDate, startTime, endTime)
    if (conflict) {
      return `Bận ca ${conflict.time}, cần cách ${PROCTOR_TURNOVER_MINUTES} phút`
    }

    return null
  }

  const submitSchedule = () => {
    if (!selectedExam) {
      toast.error('Vui lòng chọn đề cuối kỳ đã được duyệt.')
      return
    }
    if (!examDate || !startTime || !endTime || toMinutes(startTime) >= toMinutes(endTime)) {
      toast.error('Ngày thi và khoảng thời gian ca thi chưa hợp lệ.')
      return
    }
    if (selectedCourseIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một lớp học phần.')
      return
    }
    if (examMode === 'SCHOOL_IP' && !ipRange.trim()) {
      toast.error('Vui lòng nhập dải IP được phép của trường.')
      return
    }
    if (releaseMode === 'SCHEDULED' && !releaseAt) {
      toast.error('Vui lòng chọn thời gian tự động công bố kết quả.')
      return
    }
    if (releaseMode === 'SCHEDULED' && releaseAt <= `${examDate}T${endTime}`) {
      toast.error('Thời gian công bố kết quả phải sau khi ca thi kết thúc.')
      return
    }

    const assignmentIssues = selectedCourseIds.map(getAssignmentIssue).filter(Boolean)
    if (assignmentIssues.length > 0) {
      toast.error('Vui lòng hoàn tất phân công và xử lý các lịch bị trùng.')
      return
    }

    const selectedCourses = eligibleCourses.filter((course) => selectedCourseIds.includes(course.id))
    const assignments = selectedCourses.flatMap((course) => (
      (proctorsByCourse[course.id] ?? []).map((teacherId) => {
        const teacher = teachers.find((item) => item.id === teacherId)!
        return {
          courseOfferingId: course.id,
          courseCode: course.code,
          teacherId: teacher.id,
          teacherName: teacher.fullName,
        }
      })
    ))

    onSubmit({
      id: editingSchedule?.id ?? `schedule-${Date.now()}`,
      examId: selectedExam.id,
      examTitle: `${selectedExam.title} ${startTime}`,
      subjectName: selectedExam.subjectName,
      courseCodes: selectedCourses.map((course) => course.code),
      date: formatDate(examDate),
      time: `${startTime} - ${endTime}`,
      location: examMode === 'ONLINE' ? 'Trực tuyến' : 'Mạng trường',
      ipPolicy: examMode === 'ONLINE' ? 'Không giới hạn IP' : ipRange.trim(),
      password: password.trim() || undefined,
      distributionMode: distributionOptions.find((item) => item.value === distributionMode)?.label ?? '',
      releaseMode: releaseOptions.find((item) => item.value === releaseMode)?.label ?? '',
      resultReleaseAt: releaseMode === 'SCHEDULED' ? releaseAt : undefined,
      proctors: [...new Set(assignments.map((assignment) => assignment.teacherName))],
      proctorAssignments: assignments,
      status: editingSchedule?.status ?? 'SCHEDULED',
    })
    toast.success(editingSchedule ? 'Đã cập nhật lịch thi.' : 'Đã tạo lịch thi và phân công giảng viên cho từng lớp.')
    closeModal()
  }

  return (
    <AdminModal
      open={open}
      size="xl"
      title={editingSchedule ? 'Sửa lịch thi cuối kỳ tập trung' : 'Tạo lịch thi cuối kỳ tập trung'}
      description="Chọn đề đã duyệt, lớp áp dụng và phân công giảng viên coi thi riêng cho từng lớp."
      confirmText={editingSchedule ? 'Lưu thay đổi' : 'Tạo lịch thi'}
      onClose={closeModal}
      onConfirm={submitSchedule}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminField label="Bộ môn">
          <AdminSelect
            value={departmentId}
            onChange={changeDepartment}
            options={[
              { value: '', label: 'Chọn bộ môn' },
              ...ADMIN_DEPARTMENTS.map((department) => ({ value: department.id, label: department.name })),
            ]}
          />
        </AdminField>
        <AdminField label="Môn học">
          <AdminSelect
            value={subjectCode}
            disabled={!departmentId}
            onChange={changeSubject}
            options={[
              { value: '', label: departmentId ? 'Chọn môn học' : 'Chọn bộ môn trước' },
              ...subjectsByDepartment.map((subject) => ({ value: subject.code, label: `${subject.name} - ${subject.code}` })),
            ]}
          />
        </AdminField>
        <AdminField label="Đề cuối kỳ đã duyệt">
          <AdminSelect
            value={examId}
            disabled={!subjectCode}
            onChange={changeExam}
            options={[
              { value: '', label: subjectCode ? 'Chọn đề cuối kỳ' : 'Chọn môn học trước' },
              ...filteredExams.map((exam) => ({ value: exam.id, label: `${exam.title} - ${exam.subjectName}` })),
            ]}
          />
        </AdminField>
        <AdminField label="Hình thức thi">
          <AdminSelect value={examMode} onChange={setExamMode} options={examModeOptions} />
        </AdminField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-2">
          <AdminField label="Ngày thi"><AdminInput type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} /></AdminField>
          <AdminField label="Giờ mở"><AdminInput type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></AdminField>
          <AdminField label="Giờ kết thúc"><AdminInput type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></AdminField>
        </div>

        {examMode === 'SCHOOL_IP' && (
          <AdminField label="Dải IP được phép">
            <AdminInput value={ipRange} onChange={(event) => setIpRange(event.target.value)} placeholder="VD: 10.10.0.0/16" />
          </AdminField>
        )}
        <AdminField label="Mật khẩu vào thi (tùy chọn)">
          <AdminInput value={password} onChange={(event) => setPassword(event.target.value)} placeholder="VD: JAVA0815" />
        </AdminField>
        <AdminField label="Cách phân phối đề">
          <AdminSelect value={distributionMode} onChange={setDistributionMode} options={distributionOptions} />
        </AdminField>
        <AdminField label="Công bố kết quả">
          <AdminSelect value={releaseMode} onChange={setReleaseMode} options={releaseOptions} />
        </AdminField>
        {releaseMode === 'SCHEDULED' && (
          <AdminField label="Thời gian công bố kết quả">
            <AdminInput type="datetime-local" value={releaseAt} onChange={(event) => setReleaseAt(event.target.value)} />
          </AdminField>
        )}
      </div>

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

        {!selectedExam ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-slate-500">
            Chọn đề cuối kỳ để xem các lớp học phần phù hợp.
          </div>
        ) : eligibleCourses.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-slate-500">
            Không có lớp đang mở phù hợp với đề này.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
            <div className="hidden grid-cols-[minmax(220px,1fr)_minmax(260px,1fr)] gap-4 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500 md:grid">
              <span>Lớp học phần</span>
              <span>Giảng viên coi thi</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {eligibleCourses.map((course) => (
                <CourseProctorRow
                  key={course.id}
                  course={course}
                  selected={selectedCourseIds.includes(course.id)}
                  proctorIds={proctorsByCourse[course.id] ?? []}
                  teachers={teachers}
                  issue={getAssignmentIssue(course.id)}
                  getTeacherUnavailableReason={(teacher) => getTeacherUnavailableReason(course.id, teacher)}
                  onToggle={() => toggleCourse(course.id)}
                  onChangeProctors={(teacherIds) => setProctorsByCourse((current) => ({ ...current, [course.id]: teacherIds }))}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-start gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-[13px] leading-[19px] text-emerald-800">
          <Clock3 size={17} className="mt-0.5 shrink-0" />
          Hệ thống kiểm tra trùng lịch theo toàn bộ ca thi và yêu cầu giảng viên có ít nhất {PROCTOR_TURNOVER_MINUTES} phút để chuyển ca.
        </div>
      </div>
    </AdminModal>
  )
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

function findExistingProctorConflict(
  schedules: AdminExamSchedule[],
  teacherName: string,
  date: string,
  startTime: string,
  endTime: string,
) {
  if (!date || !startTime || !endTime) return null
  const displayDate = formatDate(date)

  return schedules.find((schedule) => {
    if (schedule.status === 'CANCELLED' || schedule.date !== displayDate || !schedule.proctors.includes(teacherName)) {
      return false
    }
    const [existingStart, existingEnd] = schedule.time.split(' - ')
    return toMinutes(startTime) < toMinutes(existingEnd) + PROCTOR_TURNOVER_MINUTES
      && toMinutes(existingStart) - PROCTOR_TURNOVER_MINUTES < toMinutes(endTime)
  }) ?? null
}

function hasCourseConflict(
  schedules: AdminExamSchedule[],
  courseCode: string,
  date: string,
  startTime: string,
  endTime: string,
) {
  if (!date || !startTime || !endTime) return false
  const displayDate = formatDate(date)

  return schedules.some((schedule) => {
    if (schedule.status === 'CANCELLED' || schedule.date !== displayDate || !schedule.courseCodes.includes(courseCode)) {
      return false
    }
    const [existingStart, existingEnd] = schedule.time.split(' - ')
    return toMinutes(startTime) < toMinutes(existingEnd) && toMinutes(existingStart) < toMinutes(endTime)
  })
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return (hours * 60) + minutes
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-')
  return year && month && day ? `${day}/${month}/${year}` : date
}

function toInputDate(date: string) {
  const [day, month, year] = date.split('/')
  return year && month && day ? `${year}-${month}-${day}` : date
}

function findOptionValue(
  options: Array<{ value: string; label: string }>,
  label: string,
  fallback: string,
) {
  return options.find((option) => option.label === label)?.value ?? fallback
}
