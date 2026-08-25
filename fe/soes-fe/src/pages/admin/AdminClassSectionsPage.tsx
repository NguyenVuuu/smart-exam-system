import { Edit, Lock, Plus, Unlock, Upload, Users, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import { ADMIN_ACADEMIC_YEARS, ADMIN_COURSE_OFFERINGS, ADMIN_DEPARTMENTS, ADMIN_SUBJECTS, ADMIN_USERS } from './mock/admin.mock'
import type { AdminUser, CourseOfferingAdmin } from './types/admin.types'
import { AdminStatusBadge } from './components/AdminBadges'
import AdminButton from './components/AdminButton'
import { AdminField, AdminInput } from './components/AdminFormFields'
import AdminLayout from './components/AdminLayout'
import AdminModal from './components/AdminModal'
import AdminPageHeader from './components/AdminPageHeader'
import AdminSelect from './components/AdminSelect'
import AdminTablePanel from './components/AdminTablePanel'
import AdminToolbar from './components/AdminToolbar'

export default function AdminClassSectionsPage() {
  const [items, setItems] = useState<CourseOfferingAdmin[]>(ADMIN_COURSE_OFFERINGS)
  const [subject, setSubject] = useState('ALL')
  const [status, setStatus] = useState<'ALL' | CourseOfferingAdmin['status']>('ALL')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [departmentInput, setDepartmentInput] = useState(ADMIN_DEPARTMENTS[0]?.id ?? '')
  const [subjectCodeInput, setSubjectCodeInput] = useState(
    ADMIN_SUBJECTS.find((item) => item.departmentId === ADMIN_DEPARTMENTS[0]?.id)?.code ?? ADMIN_SUBJECTS[0]?.code ?? '',
  )
  const [semesterCodeInput, setSemesterCodeInput] = useState(ADMIN_ACADEMIC_YEARS[0]?.code ?? '')
  const [classCodeInput, setClassCodeInput] = useState('')
  const [capacityInput, setCapacityInput] = useState('60')
  const [teacherIdInput, setTeacherIdInput] = useState(ADMIN_USERS.find((user) => user.role === 'TEACHER')?.id ?? '')
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

  const filteredItems = useMemo(() => items.filter((item) => {
    const matchesSubject = subject === 'ALL' || item.subjectCode === subject
    const matchesStatus = status === 'ALL' || item.status === status
    const matchesSearch =
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.subjectName.toLowerCase().includes(search.toLowerCase()) ||
      item.teacherName.toLowerCase().includes(search.toLowerCase())
    return matchesSubject && matchesStatus && matchesSearch
  }), [items, search, status, subject])

  const filteredStudents = studentOptions.filter((student) =>
    student.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.code.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.email.toLowerCase().includes(studentSearch.toLowerCase()),
  )

  const resetClassForm = () => {
    const defaultDepartmentId = ADMIN_DEPARTMENTS[0]?.id ?? ''
    const defaultSubject = ADMIN_SUBJECTS.find((item) => item.departmentId === defaultDepartmentId) ?? ADMIN_SUBJECTS[0]
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

    const isDuplicate = items.some((item) =>
      item.id !== editingClassId &&
      item.code.toLowerCase() === classCode.toLowerCase(),
    )
    if (isDuplicate) {
      toast.error('Mã lớp học phần đã tồn tại.')
      return
    }

    if (editingClassId) {
      setItems((prev) => prev.map((item) => item.id === editingClassId
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
      ))
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
    setItems((prev) => prev.map((row) => row.id === item.id ? { ...row, status: nextStatus } : row))
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
    setItems((prev) => prev.map((item) => item.id === enrollmentClass.id
      ? { ...item, enrolled: selectedStudentIds.length }
      : item,
    ))
    toast.success(`Đã lưu danh sách ${selectedStudentIds.length} sinh viên cho ${enrollmentClass.code}.`)
    setEnrollmentClass(null)
  }

  const columns: ColumnDef<CourseOfferingAdmin>[] = [
    { header: 'MÃ LỚP', width: '190px', render: (item) => <span className="text-sm font-semibold text-slate-950">{item.code}</span> },
    {
      header: 'MÔN HỌC',
      render: (item) => (
        <div>
          <p className="text-sm font-medium text-slate-800">{item.subjectName}</p>
          <p className="text-xs text-slate-400">{item.subjectCode}</p>
        </div>
      ),
    },
    { header: 'HỌC KỲ', width: '130px', render: (item) => <span className="text-sm text-slate-700">{item.semesterCode}</span> },
    {
      header: 'GIẢNG VIÊN',
      width: '210px',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
            {item.teacherName.split(' ').slice(-1)[0].slice(0, 1)}
          </div>
          <span className="text-sm text-slate-700">{item.teacherName}</span>
        </div>
      ),
    },
    {
      header: 'SĨ SỐ',
      width: '170px',
      render: (item) => {
        const percent = Math.min(100, Math.round((item.enrolled / item.capacity) * 100))
        return (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-600">
              <span>{item.enrolled}/{item.capacity}</span>
              <span>{percent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100">
              <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
            </div>
          </div>
        )
      },
    },
    { header: 'TRẠNG THÁI', width: '140px', render: (item) => <AdminStatusBadge status={item.status} /> },
    {
      header: 'THAO TÁC',
      width: '150px',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end gap-1 text-slate-500">
          <button className="rounded-lg p-1.5 hover:bg-emerald-50 hover:text-emerald-600" title="Xếp lớp sinh viên" onClick={() => openEnrollmentModal(item)}><Users size={17} /></button>
          <button className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600" title="Chỉnh sửa" onClick={() => openEditModal(item)}><Edit size={17} /></button>
          <button
            className="rounded-lg p-1.5 hover:bg-slate-50 hover:text-slate-700"
            title={item.status === 'OPEN' ? 'Đóng lớp' : 'Mở lại lớp'}
            onClick={() => handleToggleClassStatus(item)}
          >
            {item.status === 'OPEN' ? <Lock size={17} /> : <Unlock size={17} />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<Users size={20} />}
        title="Lớp học phần và Xếp lớp"
        description="Quản lý lớp học phần theo học kỳ, giảng viên phụ trách và ghi danh sinh viên vào lớp."
        action={(
          <div className="flex gap-2">
            <AdminButton tone="secondary" icon={<Upload size={17} />} onClick={() => items[0] && openEnrollmentModal(items[0])}>Nhập sinh viên</AdminButton>
            <AdminButton icon={<Plus size={17} />} onClick={openCreateModal}>Thêm lớp học phần</AdminButton>
          </div>
        )}
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
          filters={(
            <>
              <AdminSelect value="HK1_2026" onChange={() => undefined} className="w-52" options={[{ value: 'HK1_2026', label: 'HK1_2026' }]} />
              <AdminSelect value={subject} onChange={setSubject} className="w-56" options={[
                { value: 'ALL', label: 'Môn học' },
                ...ADMIN_SUBJECTS.map((item) => ({ value: item.code, label: `${item.code} - ${item.name}` })),
              ]} />
              <AdminSelect value={status} onChange={setStatus} className="w-44" options={[
                { value: 'ALL', label: 'Trạng thái' },
                { value: 'OPEN', label: 'Đang mở' },
                { value: 'CLOSED', label: 'Đã đóng' },
              ]} />
            </>
          )}
        />
        <DataTable columns={columns} data={filteredItems} keyExtractor={(item) => item.id} emptyText="Chưa có lớp học phần phù hợp." />
      </AdminTablePanel>

      <AdminModal
        open={modalOpen}
        title={editingClassId ? 'Cập nhật lớp học phần' : 'Thêm lớp học phần mới'}
        description="Lớp học phần gắn một môn học với giảng viên phụ trách trong một học kỳ."
        confirmText={editingClassId ? 'Cập nhật lớp học phần' : 'Tạo lớp học phần'}
        onClose={() => {
          setModalOpen(false)
          setEditingClassId(null)
        }}
        onConfirm={handleSaveClass}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdminField label="Bộ môn">
            <AdminSelect
              value={departmentInput}
              onChange={handleDepartmentChange}
              options={ADMIN_DEPARTMENTS.map((department) => ({ value: department.id, label: department.name }))}
            />
          </AdminField>
          <AdminField label="Môn học">
            <AdminSelect
              value={subjectCodeInput}
              onChange={setSubjectCodeInput}
              options={selectedDepartmentSubjects.map((item) => ({ value: item.code, label: `${item.code} - ${item.name}` }))}
            />
          </AdminField>
          <AdminField label="Học kỳ">
            <AdminSelect
              value={semesterCodeInput}
              onChange={setSemesterCodeInput}
              options={ADMIN_ACADEMIC_YEARS.map((item) => ({ value: item.code, label: `${item.code} - ${item.name}` }))}
            />
          </AdminField>
          <AdminField label="Mã lớp học phần">
            <AdminInput
              value={classCodeInput}
              onChange={(event) => setClassCodeInput(event.target.value)}
              placeholder="VD: JAVA_01_HK1_2026"
            />
          </AdminField>
          <AdminField label="Sức chứa">
            <AdminInput
              type="number"
              min={1}
              value={capacityInput}
              onChange={(event) => setCapacityInput(event.target.value)}
              placeholder="60"
            />
          </AdminField>
          <AdminField label="Giảng viên phụ trách">
            <AdminSelect
              value={teacherIdInput}
              onChange={setTeacherIdInput}
              options={teacherOptions.map((teacher) => ({ value: teacher.id, label: `${teacher.fullName} - ${teacher.code}` }))}
            />
          </AdminField>
          <AdminField label="Trạng thái">
            <AdminSelect
              value={classStatusInput}
              onChange={(value) => setClassStatusInput(value as CourseOfferingAdmin['status'])}
              options={[
                { value: 'OPEN', label: 'Đang mở' },
                { value: 'CLOSED', label: 'Đã đóng' },
              ]}
            />
          </AdminField>
        </div>
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Hệ thống sẽ kiểm tra trùng mã lớp và không cho sĩ số vượt sức chứa.
        </div>
      </AdminModal>

      <EnrollmentModal
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

function EnrollmentModal({
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
          <AdminButton tone="secondary" icon={<Upload size={17} />}>Nhập từ Excel / CSV</AdminButton>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="overflow-hidden rounded-xl border border-gray-100">
            {students.map((student) => (
              <StudentEnrollmentRow
                key={student.id}
                student={student}
                checked={selectedStudentIds.includes(student.id)}
                onToggle={() => onToggleStudent(student.id)}
              />
            ))}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <AdminButton tone="secondary" onClick={onClose}>Hủy</AdminButton>
          <AdminButton icon={<Users size={17} />} onClick={onConfirm}>Lưu danh sách</AdminButton>
        </div>
      </div>
    </div>
  )
}

function StudentEnrollmentRow({
  student,
  checked,
  onToggle,
}: {
  student: AdminUser
  checked: boolean
  onToggle: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-gray-50">
      <div className="flex min-w-0 items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
          {getInitials(student.fullName)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{student.fullName}</p>
          <p className="truncate text-xs text-slate-400">{student.email}</p>
        </div>
      </div>
      <span className="shrink-0 text-sm text-slate-500">{student.code}</span>
    </label>
  )
}

function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
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
