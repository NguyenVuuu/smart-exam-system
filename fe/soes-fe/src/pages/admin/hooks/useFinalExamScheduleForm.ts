import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage, getApiFieldErrors, type ApiFieldErrors } from '../../../api/errors'
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

  const [existingStartTime = '', existingEndTime = ''] = (
    editingSchedule?.time ?? ''
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
  const [randomQuestionCount, setRandomQuestionCount] = useState(editingSchedule?.randomQuestionCount ?? 1)
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
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({})

  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

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
    setFieldErrors({})
    setDepartmentId(value)
    setSubjectCode('')
    setExamId('')
    setSelectedCourseIds([])
    setProctorsByCourse({})
  }

  const changeSubject = (value: string) => {
    setFieldErrors({})
    setSubjectCode(value)
    setExamId('')
    setSelectedCourseIds([])
    setProctorsByCourse({})
  }

  const changeExam = (value: string) => {
    setFieldErrors({})
    setExamId(value)
    const exam = exams.find((item) => item.id === value)
    if (exam) {
      setDepartmentId(exam.departmentId)
      setSubjectCode(exam.subjectCode)
    }
    setSelectedCourseIds([])
    setProctorsByCourse({})

  }

  const toggleCourse = (courseId: string) => {
    clearFieldError('courses')
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
      setFieldErrors({ examId: 'Vui lòng chọn đề cuối kỳ đã được duyệt.' })
      toast.error('Vui lòng chọn đề cuối kỳ đã được duyệt.')
      return
    }
    if (!examDate || !startTime || !endTime || toMinutes(startTime) >= toMinutes(endTime)) {
      setFieldErrors({
        ...(!examDate ? { examDate: 'Vui lòng chọn ngày thi.' } : {}),
        ...(!startTime ? { startTime: 'Vui lòng chọn giờ mở.' } : {}),
        endTime: 'Giờ kết thúc phải sau giờ mở.',
      })
      toast.error('Ngày thi và khoảng thời gian ca thi chưa hợp lệ.')
      return
    }
    if (selectedCourseIds.length === 0) {
      setFieldErrors({ courses: 'Vui lòng chọn ít nhất một lớp học phần.' })
      toast.error('Vui lòng chọn ít nhất một lớp học phần.')
      return
    }
    if (examMode === 'SCHOOL_IP' && !ipRange.trim()) {
      setFieldErrors({ ipRange: 'Vui lòng nhập dải IP được phép của trường.' })
      toast.error('Vui lòng nhập dải IP được phép của trường.')
      return
    }
    const passwordLength = password.trim().length
    if (passwordLength > 0 && (passwordLength < 4 || passwordLength > 100)) {
      setFieldErrors({ password: 'Mật khẩu phải có từ 4 đến 100 ký tự.' })
      toast.error('Vui lòng kiểm tra mật khẩu ca thi.')
      return
    }
    if (distributionMode === 'RANDOM_SUBSET' && randomQuestionCount < 1) {
      setFieldErrors({ randomQuestionCount: 'Số câu hỏi ngẫu nhiên phải lớn hơn 0.' })
      toast.error('Vui lòng nhập số câu hỏi ngẫu nhiên.')
      return
    }
    if (releaseMode === 'SCHEDULED' && !releaseAt) {
      setFieldErrors({ releaseAt: 'Vui lòng chọn thời gian công bố kết quả.' })
      toast.error('Vui lòng chọn thời gian tự động công bố kết quả.')
      return
    }
    if (releaseMode === 'SCHEDULED' && releaseAt <= `${examDate}T${endTime}`) {
      setFieldErrors({ releaseAt: 'Thời gian công bố phải sau khi ca thi kết thúc.' })
      toast.error('Thời gian công bố kết quả phải sau khi ca thi kết thúc.')
      return
    }

    const assignmentIssues = selectedCourseIds.map(getAssignmentIssue).filter(Boolean)
    if (assignmentIssues.length > 0) {
      setFieldErrors({ courses: 'Vui lòng hoàn tất phân công và xử lý các lịch bị trùng.' })
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
      randomQuestionCount: distributionMode === 'RANDOM_SUBSET' ? randomQuestionCount : null,
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
      setFieldErrors({})
      await onSubmit(schedule)
      toast.success(editingSchedule ? 'Đã cập nhật lịch thi.' : 'Đã tạo lịch thi và phân công giảng viên cho từng lớp.')
      onClose()
    } catch (error) {
      const apiErrors = getApiFieldErrors(error)
      const courseError = Object.entries(apiErrors).find(([field]) => field === 'courses' || field.startsWith('courses.'))?.[1]
      setFieldErrors({
        ...apiErrors,
        ...(apiErrors.allowedIpRanges ? { ipRange: apiErrors.allowedIpRanges } : {}),
        ...(apiErrors.resultReleaseAt ? { releaseAt: apiErrors.resultReleaseAt } : {}),
        ...(apiErrors.startTime ? { examDate: apiErrors.startTime, startTime: apiErrors.startTime } : {}),
        ...(courseError ? { courses: courseError } : {}),
      })
      toast.error(
        Object.keys(apiErrors).length
          ? 'Vui lòng kiểm tra các trường đang báo lỗi.'
          : getApiErrorMessage(error, 'Không thể lưu lịch thi. Vui lòng kiểm tra trùng lịch và thử lại.'),
      )
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
      randomQuestionCount,
      releaseMode,
      releaseAt,
      allowStudentReview,
      requireFullscreen,
      enableWebcam,
      blockCopyPaste,
      blockRightClick,
      selectedCourseIds,
      proctorsByCourse,
      fieldErrors,
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
      setExamDate: (value: string) => { clearFieldError('examDate'); setExamDate(value) },
      setStartTime: (value: string) => { clearFieldError('startTime'); setStartTime(value) },
      setEndTime: (value: string) => { clearFieldError('endTime'); setEndTime(value) },
      setExamMode: (value: 'ONLINE' | 'SCHOOL_IP') => {
        clearFieldError('ipRange')
        setExamMode(value)
      },
      setIpRange: (value: string) => { clearFieldError('ipRange'); setIpRange(value) },
      setPassword: (value: string) => { clearFieldError('password'); setPassword(value) },
      setDistributionMode: (value: string) => {
        clearFieldError('randomQuestionCount')
        setDistributionMode(value)
      },
      setRandomQuestionCount: (value: number) => {
        clearFieldError('randomQuestionCount')
        setRandomQuestionCount(value)
      },
      setReleaseMode: (value: string) => {
        clearFieldError('releaseAt')
        setReleaseMode(value)
      },
      setReleaseAt: (value: string) => { clearFieldError('releaseAt'); setReleaseAt(value) },
      setAllowStudentReview,
      setRequireFullscreen,
      setEnableWebcam,
      setBlockCopyPaste,
      setBlockRightClick,
      toggleCourse,
      setProctorsByCourse: (courseId: string, teacherIds: string[]) =>
        {
          clearFieldError('courses')
          setProctorsByCourse((current) => ({ ...current, [courseId]: teacherIds }))
        },
      getAssignmentIssue,
      getTeacherUnavailableReason,
      submitSchedule,
    },
  }
}
