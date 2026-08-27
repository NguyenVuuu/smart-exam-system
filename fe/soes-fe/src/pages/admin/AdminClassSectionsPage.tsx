import { Plus, Upload, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import AdminButton from './components/AdminButton'
import AdminLayout from './components/AdminLayout'
import AdminPageHeader from './components/AdminPageHeader'
import AdminSelect from './components/AdminSelect'
import AdminTablePanel from './components/AdminTablePanel'
import AdminToolbar from './components/AdminToolbar'
import ClassEnrollmentModal from './components/class-sections/ClassEnrollmentModal'
import ClassSectionFormModal from './components/class-sections/ClassSectionFormModal'
import ClassSectionsTable from './components/class-sections/ClassSectionsTable'
import {
  ADMIN_ACADEMIC_YEARS,
  ADMIN_COURSE_OFFERINGS,
  ADMIN_DEPARTMENTS,
  ADMIN_SUBJECTS,
  ADMIN_USERS,
} from './mock/admin.mock'
import type { CourseOfferingAdmin } from './types/admin.types'

export default function AdminClassSectionsPage() {
  const [items, setItems] = useState<CourseOfferingAdmin[]>(ADMIN_COURSE_OFFERINGS)
  const [subject, setSubject] = useState('ALL')
  const [status, setStatus] = useState<'ALL' | CourseOfferingAdmin['status']>('ALL')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [departmentInput, setDepartmentInput] = useState(ADMIN_DEPARTMENTS[0]?.id ?? '')
  const [subjectCodeInput, setSubjectCodeInput] = useState(
    ADMIN_SUBJECTS.find((item) => item.departmentId === ADMIN_DEPARTMENTS[0]?.id)?.code ??
      ADMIN_SUBJECTS[0]?.code ??
      '',
  )
  const [semesterCodeInput, setSemesterCodeInput] = useState(ADMIN_ACADEMIC_YEARS[0]?.code ?? '')
  const [classCodeInput, setClassCodeInput] = useState('')
  const [capacityInput, setCapacityInput] = useState('60')
  const [teacherIdInput, setTeacherIdInput] = useState(
    ADMIN_USERS.find((user) => user.role === 'TEACHER')?.id ?? '',
  )
  const [classStatusInput, setClassStatusInput] = useState<CourseOfferingAdmin['status']>('OPEN')
  const [enrollmentClass, setEnrollmentClass] = useState<CourseOfferingAdmin | null>(null)
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

  const teacherOptions = useMemo(() => ADMIN_USERS.filter((user) => user.role === 'TEACHER'), [])
  const studentOptions = useMemo(() => ADMIN_USERS.filter((user) => user.role === 'STUDENT'), [])
  const selectedDepartmentSubjects = useMemo(
    () => ADMIN_SUBJECTS.filter((item) => item.departmentId === departmentInput),
    [departmentInput],
  )

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSubject = subject === 'ALL' || item.subjectCode === subject
        const matchesStatus = status === 'ALL' || item.status === status
        const matchesSearch =
          item.code.toLowerCase().includes(search.toLowerCase()) ||
          item.subjectName.toLowerCase().includes(search.toLowerCase()) ||
          item.teacherName.toLowerCase().includes(search.toLowerCase())
        return matchesSubject && matchesStatus && matchesSearch
      }),
    [items, search, status, subject],
  )

  const filteredStudents = studentOptions.filter(
    (student) =>
      student.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.code.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.email.toLowerCase().includes(studentSearch.toLowerCase()),
  )

  const resetClassForm = () => {
    const defaultDepartmentId = ADMIN_DEPARTMENTS[0]?.id ?? ''
    const defaultSubject =
      ADMIN_SUBJECTS.find((item) => item.departmentId === defaultDepartmentId) ?? ADMIN_SUBJECTS[0]
    setEditingClassId(null)
    setDepartmentInput(defaultDepartmentId)
    setSubjectCodeInput(defaultSubject?.code ?? '')
    setSemesterCodeInput(ADMIN_ACADEMIC_YEARS[0]?.code ?? '')
    setClassCodeInput('')
    setCapacityInput('60')
    setTeacherIdInput(teacherOptions[0]?.id ?? '')
    setClassStatusInput('OPEN')
  }

  const openCreateModal = () => {
    resetClassForm()
    setModalOpen(true)
  }

  const openEditModal = (item: CourseOfferingAdmin) => {
    const selectedSubject = ADMIN_SUBJECTS.find((subjectItem) => subjectItem.code === item.subjectCode)
    const selectedTeacher = teacherOptions.find((teacher) => teacher.fullName === item.teacherName)
    setEditingClassId(item.id)
    setDepartmentInput(selectedSubject?.departmentId ?? ADMIN_DEPARTMENTS[0]?.id ?? '')
    setSubjectCodeInput(item.subjectCode)
    setSemesterCodeInput(item.semesterCode)
    setClassCodeInput(item.code)
    setCapacityInput(String(item.capacity))
    setTeacherIdInput(selectedTeacher?.id ?? teacherOptions[0]?.id ?? '')
    setClassStatusInput(item.status)
    setModalOpen(true)
  }

  const openEnrollmentModal = (item: CourseOfferingAdmin) => {
    setEnrollmentClass(item)
    setSelectedStudentIds([])
    setStudentSearch('')
  }

  const handleDepartmentChange = (departmentId: string) => {
    const firstSubject = ADMIN_SUBJECTS.find((item) => item.departmentId === departmentId)
    setDepartmentInput(departmentId)
    setSubjectCodeInput(firstSubject?.code ?? '')
  }

  const handleSaveClass = () => {
    const selectedSubject = ADMIN_SUBJECTS.find((item) => item.code === subjectCodeInput)
    const selectedTeacher = teacherOptions.find((teacher) => teacher.id === teacherIdInput)
    const classCode = classCodeInput.trim().toUpperCase()
    const capacity = Math.max(1, Number(capacityInput) || 60)

    if (!selectedSubject || !selectedTeacher || !classCode) {
      toast.error('Vui lòng nhập đầy đủ thông tin lớp học phần.')
      return
    }

    const isDuplicate = items.some(
      (item) => item.id !== editingClassId && item.code.toLowerCase() === classCode.toLowerCase(),
    )
    if (isDuplicate) {
      toast.error('Mã lớp học phần đã tồn tại.')
      return
    }

    if (editingClassId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingClassId
            ? {
                ...item,
                code: classCode,
                subjectCode: selectedSubject.code,
                subjectName: selectedSubject.name,
                semesterCode: semesterCodeInput,
                teacherName: selectedTeacher.fullName,
                capacity,
                status: classStatusInput,
              }
            : item,
        ),
      )
      setModalOpen(false)
      toast.success(`Đã cập nhật lớp ${classCode}.`)
      return
    }

    setItems((prev) => [
      ...prev,
      {
        id: createEntityId('co', classCode),
        code: classCode,
        subjectCode: selectedSubject.code,
        subjectName: selectedSubject.name,
        semesterCode: semesterCodeInput,
        teacherName: selectedTeacher.fullName,
        enrolled: 0,
        capacity,
        status: classStatusInput,
      },
    ])
    setModalOpen(false)
    toast.success(`Đã tạo lớp ${classCode}.`)
  }

  const handleToggleClassStatus = (item: CourseOfferingAdmin) => {
    const nextStatus: CourseOfferingAdmin['status'] = item.status === 'OPEN' ? 'CLOSED' : 'OPEN'
    setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, status: nextStatus } : row)))
    toast.success(nextStatus === 'OPEN' ? `Đã mở lại lớp ${item.code}.` : `Đã đóng lớp ${item.code}.`)
  }

  const handleToggleStudent = (studentId: string) => {
    if (!enrollmentClass) return
    setSelectedStudentIds((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId)
      }
      if (prev.length >= enrollmentClass.capacity) {
        toast.error('Số sinh viên đã đạt sức chứa tối đa.')
        return prev
      }
      return [...prev, studentId]
    })
  }

  const handleSaveEnrollment = () => {
    if (!enrollmentClass) return
    setItems((prev) =>
      prev.map((item) =>
        item.id === enrollmentClass.id ? { ...item, enrolled: selectedStudentIds.length } : item,
      ),
    )
    toast.success(
      `Đã lưu danh sách ${selectedStudentIds.length} sinh viên cho ${enrollmentClass.code}.`,
    )
    setEnrollmentClass(null)
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<Users size={20} />}
        title="Lớp học phần và Xếp lớp"
        description="Quản lý lớp học phần theo học kỳ, giảng viên phụ trách và ghi danh sinh viên vào lớp."
        action={
          <div className="flex gap-2">
            <AdminButton
              tone="secondary"
              icon={<Upload size={17} />}
              onClick={() => items[0] && openEnrollmentModal(items[0])}
            >
              Nhập sinh viên
            </AdminButton>
            <AdminButton icon={<Plus size={17} />} onClick={openCreateModal}>
              Thêm lớp học phần
            </AdminButton>
          </div>
        }
      />

      <AdminTablePanel>
        <AdminToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm mã lớp hoặc môn học..."
          onReset={() => {
            setSearch('')
            setSubject('ALL')
            setStatus('ALL')
          }}
          filters={
            <>
              <AdminSelect
                value="HK1_2026"
                onChange={() => undefined}
                className="w-52"
                options={[{ value: 'HK1_2026', label: 'HK1_2026' }]}
              />
              <AdminSelect
                value={subject}
                onChange={setSubject}
                className="w-56"
                options={[
                  { value: 'ALL', label: 'Môn học' },
                  ...ADMIN_SUBJECTS.map((item) => ({ value: item.code, label: `${item.code} - ${item.name}` })),
                ]}
              />
              <AdminSelect
                value={status}
                onChange={setStatus}
                className="w-44"
                options={[
                  { value: 'ALL', label: 'Trạng thái' },
                  { value: 'OPEN', label: 'Đang mở' },
                  { value: 'CLOSED', label: 'Đã đóng' },
                ]}
              />
            </>
          }
        />
        <ClassSectionsTable
          items={filteredItems}
          onOpenEnrollment={openEnrollmentModal}
          onOpenEdit={openEditModal}
          onToggleStatus={handleToggleClassStatus}
        />
      </AdminTablePanel>

      <ClassSectionFormModal
        open={modalOpen}
        editingClassId={editingClassId}
        departmentInput={departmentInput}
        onDepartmentChange={handleDepartmentChange}
        subjectCodeInput={subjectCodeInput}
        onSubjectCodeChange={setSubjectCodeInput}
        selectedDepartmentSubjects={selectedDepartmentSubjects}
        semesterCodeInput={semesterCodeInput}
        onSemesterCodeChange={setSemesterCodeInput}
        classCodeInput={classCodeInput}
        onClassCodeChange={setClassCodeInput}
        capacityInput={capacityInput}
        onCapacityChange={setCapacityInput}
        teacherIdInput={teacherIdInput}
        onTeacherIdChange={setTeacherIdInput}
        teacherOptions={teacherOptions}
        classStatusInput={classStatusInput}
        onClassStatusChange={setClassStatusInput}
        onClose={() => {
          setModalOpen(false)
          setEditingClassId(null)
        }}
        onConfirm={handleSaveClass}
      />

      <ClassEnrollmentModal
        course={enrollmentClass}
        students={filteredStudents}
        search={studentSearch}
        selectedStudentIds={selectedStudentIds}
        onSearchChange={setStudentSearch}
        onToggleStudent={handleToggleStudent}
        onClose={() => setEnrollmentClass(null)}
        onConfirm={handleSaveEnrollment}
      />
    </AdminLayout>
  )
}

function createEntityId(prefix: string, value: string) {
  return `${prefix}-${value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`
}
