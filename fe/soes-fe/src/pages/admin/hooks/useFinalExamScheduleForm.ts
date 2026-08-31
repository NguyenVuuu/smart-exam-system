import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  distributionOptions,
  PROCTOR_TURNOVER_MINUTES,
  releaseOptions,
} from '../constants/finalExamScheduleOptions'
import type {
  AdminExam, AdminExamSchedule, AdminSubject, AdminUser, CourseOfferingAdmin, Department,
} from '../types/admin.types'
import {
  findExistingProctorConflict,
  findOptionValue,
  formatDate,
  hasCourseConflict,
  toInputDate,
  toMinutes,
} from '../utils/finalExamScheduleUtils'

export function useFinalExamScheduleForm({
  exams,
  schedules,
  departments,
  subjects,
  courses,
  users,
  editingSchedule,
  onClose,
  onSubmit,
}: {
  exams: AdminExam[]
  schedules: AdminExamSchedule[]
  departments: Department[]
  subjects: AdminSubject[]
  courses: CourseOfferingAdmin[]
  users: AdminUser[]
  editingSchedule?: AdminExamSchedule | null
  onClose: () => void
  onSubmit: (schedule: AdminExamSchedule) => void | Promise<void>
}) {
  const initialExam = useMemo(() => {
    if (!editingSchedule) return null
    return (
      exams.find((item) => item.id === editingSchedule.examId) ??
      exams.find((item) => editingSchedule.examTitle.includes(item.title)) ??
      exams.find((item) => item.subjectName === editingSchedule.subjectName) ??
      null
    )
  }, [editingSchedule, exams])

  const initialCourses = useMemo(() => {
    if (!editingSchedule) return []
    return courses.filter((course) =>
      editingSchedule.courseCodes.includes(course.code),
    )
  }, [courses, editingSchedule])

  const initialAssignments = useMemo(() => {
    if (!editingSchedule?.proctorAssignments) return {}
    return editingSchedule.proctorAssignments.reduce<Record<string, string[]>>((result, assignment) => {
      result[assignment.courseOfferingId] = [
        ...(result[assignment.courseOfferingId] ?? []),
        assignment.teacherId,
      ]
      return result
    }, {})
  }, [editingSchedule])

  const [existingStartTime = '08:00', existingEndTime = '09:30'] = (
    editingSchedule?.time ?? '08:00 - 09:30'
  ).split(' - ')

  const [departmentId, setDepartmentId] = useState(initialExam?.departmentId ?? '')
  const [subjectCode, setSubjectCode] = useState(
    initialExam?.subjectCode ?? initialCourses[0]?.subjectCode ?? '',
  )
  const [examId, setExamId] = useState(initialExam?.id ?? '')
  const [examDate, setExamDate] = useState(
    editingSchedule?.date ? toInputDate(editingSchedule.date) : '',
  )
  const [startTime, setStartTime] = useState(existingStartTime)
  const [endTime, setEndTime] = useState(existingEndTime)
  const [examMode, setExamMode] = useState<'ONLINE' | 'SCHOOL_IP'>(
    editingSchedule?.ipPolicy && editingSchedule.ipPolicy !== 'Không giới hạn IP'
      ? 'SCHOOL_IP'
      : 'ONLINE',
  )
  const [ipRange, setIpRange] = useState(
    editingSchedule?.ipPolicy && editingSchedule.ipPolicy !== 'Không giới hạn IP'
      ? editingSchedule.ipPolicy
      : '',
  )
  const [password, setPassword] = useState(editingSchedule?.password ?? '')
  const [distributionMode, setDistributionMode] = useState(
    findOptionValue(
      distributionOptions,
      editingSchedule?.distributionMode ?? '',
      'SHUFFLE_QUESTIONS_AND_OPTIONS',
    ),
  )
  const [releaseMode, setReleaseMode] = useState(
    findOptionValue(releaseOptions, editingSchedule?.releaseMode ?? '', 'MANUAL'),
  )
  const [releaseAt, setReleaseAt] = useState(editingSchedule?.resultReleaseAt ?? '')
  const [allowStudentReview, setAllowStudentReview] = useState(
    Boolean(editingSchedule?.allowStudentReview),
  )
  const [requireFullscreen, setRequireFullscreen] = useState(
    editingSchedule?.requireFullscreen ?? true,
  )
  const [enableWebcam, setEnableWebcam] = useState(editingSchedule?.enableWebcam ?? true)
  const [blockCopyPaste, setBlockCopyPaste] = useState(editingSchedule?.blockCopyPaste ?? true)
  const [blockRightClick, setBlockRightClick] = useState(editingSchedule?.blockRightClick ?? true)
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(
    initialCourses.map((c) => c.id),
  )
  const [proctorsByCourse, setProctorsByCourse] = useState<Record<string, string[]>>(initialAssignments)

  const selectedExam = exams.find((exam) => exam.id === examId)
  const subjectsByDepartment = useMemo(
    () => subjects.filter((subject) => !departmentId || subject.departmentId === departmentId),
    [departmentId, subjects],
  )
  const filteredExams = useMemo(
    () =>
      exams.filter(
        (exam) =>
          (!departmentId || exam.departmentId === departmentId) &&
          (!subjectCode || exam.subjectCode === subjectCode),
      ),
    [departmentId, exams, subjectCode],
  )
  const teachers = users.filter((user) => user.role === 'TEACHER' && user.status === 'ACTIVE')
  const conflictSchedules = useMemo(
    () => schedules.filter((schedule) => schedule.id !== editingSchedule?.id),
    [editingSchedule?.id, schedules],
  )

  const departmentOptions = [
    { value: '', label: 'Chọn bộ môn' },
    ...departments.map((dept) => ({ value: dept.id, label: dept.name })),
  ]
  const subjectOptions = [
    { value: '', label: departmentId ? 'Chọn môn học' : 'Chọn bộ môn trước' },
    ...subjectsByDepartment.map((subject) => ({
      value: subject.code,
      label: `${subject.name} - ${subject.code}`,
    })),
  ]
  const examOptions = [
    { value: '', label: subjectCode ? 'Chọn đề cuối kỳ' : 'Chọn môn học trước' },
    ...filteredExams.map((exam) => ({ value: exam.id, label: `${exam.title} - ${exam.subjectName}` })),
  ]

  const eligibleCourses = useMemo(
    () =>
      courses.filter(
        (course) =>
          selectedExam &&
          course.subjectCode === selectedExam.subjectCode &&
          course.semesterCode === selectedExam.semesterCode &&
          course.status === 'OPEN',
      ),
    [courses, selectedExam],
  )

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
      const endMinutes = 8 * 60 + exam.durationMinutes
      setEndTime(
        `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`,
      )
    }
  }

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds((current) =>
      current.includes(courseId) ? current.filter((id) => id !== courseId) : [...current, courseId],
    )
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

    const duplicateTeacher = teachers.find(
      (teacher) =>
        teacherIds.includes(teacher.id) &&
        selectedCourseIds.some((id) => id !== courseId && (proctorsByCourse[id] ?? []).includes(teacher.id)),
    )
    if (duplicateTeacher) return `${duplicateTeacher.fullName} đang được phân cho lớp khác trong cùng ca.`

    const conflictedTeacher = teachers.find(
      (teacher) =>
        teacherIds.includes(teacher.id) &&
        findExistingProctorConflict(conflictSchedules, teacher.fullName, examDate, startTime, endTime),
    )
    if (conflictedTeacher) {
      return `${conflictedTeacher.fullName} đã có ca thi gần khung giờ này, cần cách ca ít nhất ${PROCTOR_TURNOVER_MINUTES} phút.`
    }

    return null
  }

  const getTeacherUnavailableReason = (courseId: string, teacher: AdminUser) => {
    const assignedCourseId = selectedCourseIds.find(
      (id) => id !== courseId && (proctorsByCourse[id] ?? []).includes(teacher.id),
    )
    if (assignedCourseId) {
      const assignedCourse = eligibleCourses.find((item) => item.id === assignedCourseId)
      return `Đã phân công cho ${assignedCourse?.code ?? 'lớp khác'} trong cùng ca`
    }

    const conflict = findExistingProctorConflict(
      conflictSchedules,
      teacher.fullName,
      examDate,
      startTime,
      endTime,
    )
    if (conflict) {
      return `Bận ca ${conflict.time}, cần cách ${PROCTOR_TURNOVER_MINUTES} phút`
    }

    return null
  }

  const submitSchedule = async () => {
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
    const assignments = selectedCourses.flatMap((course) =>
      (proctorsByCourse[course.id] ?? []).map((teacherId) => {
        const teacher = teachers.find((item) => item.id === teacherId)!
        return {
          courseOfferingId: course.id,
          courseCode: course.code,
          teacherId: teacher.id,
          teacherName: teacher.fullName,
        }
      }),
    )

    const schedule: AdminExamSchedule = {
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
      distributionMode:
        distributionOptions.find((item) => item.value === distributionMode)?.label ?? '',
      releaseMode: releaseOptions.find((item) => item.value === releaseMode)?.label ?? '',
      resultReleaseAt: releaseMode === 'SCHEDULED' ? releaseAt : undefined,
      allowStudentReview,
      requireFullscreen,
      enableWebcam,
      blockCopyPaste,
      blockRightClick,
      proctors: [...new Set(assignments.map((assignment) => assignment.teacherName))],
      proctorAssignments: assignments,
      status: editingSchedule?.status ?? 'SCHEDULED',
    }
    try {
      await onSubmit(schedule)
      toast.success(editingSchedule ? 'Đã cập nhật lịch thi.' : 'Đã tạo lịch thi và phân công giảng viên cho từng lớp.')
      onClose()
    } catch {
      toast.error('Không thể lưu lịch thi. Vui lòng kiểm tra trùng lịch và thử lại.')
    }
  }

  return {
    formState: {
      departmentId,
      subjectCode,
      examId,
      examDate,
      startTime,
      endTime,
      examMode,
      ipRange,
      password,
      distributionMode,
      releaseMode,
      releaseAt,
      allowStudentReview,
      requireFullscreen,
      enableWebcam,
      blockCopyPaste,
      blockRightClick,
      selectedCourseIds,
      proctorsByCourse,
    },
    options: {
      departmentOptions,
      subjectOptions,
      examOptions,
      eligibleCourses,
      teachers,
      selectedExam: Boolean(selectedExam),
    },
    actions: {
      changeDepartment,
      changeSubject,
      changeExam,
      setExamDate,
      setStartTime,
      setEndTime,
      setExamMode,
      setIpRange,
      setPassword,
      setDistributionMode,
      setReleaseMode,
      setReleaseAt,
      setAllowStudentReview,
      setRequireFullscreen,
      setEnableWebcam,
      setBlockCopyPaste,
      setBlockRightClick,
      toggleCourse,
      setProctorsByCourse: (courseId: string, teacherIds: string[]) =>
        setProctorsByCourse((current) => ({ ...current, [courseId]: teacherIds })),
      getAssignmentIssue,
      getTeacherUnavailableReason,
      submitSchedule,
    },
  }
}
