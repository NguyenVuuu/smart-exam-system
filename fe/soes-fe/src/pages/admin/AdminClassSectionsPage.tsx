import { Plus, Users } from 'lucide-react'
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
import { useAdminClassSections } from './hooks/useAdminClassSections'
import type { CourseOfferingAdmin } from './types/admin.types'

export default function AdminClassSectionsPage() {
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [subjectFilter, setSubjectFilter] = useState('ALL')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | CourseOfferingAdmin['status']>('ALL')
  const [search, setSearch] = useState('')
  const data = useAdminClassSections({
    keyword: search,
    semesterId: semesterFilter,
    departmentId: departmentFilter,
    subjectId: subjectFilter,
    status: statusFilter,
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CourseOfferingAdmin | null>(null)
  const [departmentId, setDepartmentId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [semesterId, setSemesterId] = useState('')
  const [classCode, setClassCode] = useState('')
  const [capacity, setCapacity] = useState('60')
  const [teacherId, setTeacherId] = useState('')
  const [classStatus, setClassStatus] = useState<CourseOfferingAdmin['status']>('OPEN')
  const [enrollmentClass, setEnrollmentClass] = useState<CourseOfferingAdmin | null>(null)
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

  const departmentSubjects = useMemo(
    () => data.subjects.filter((item) => item.departmentId === departmentId),
    [data.subjects, departmentId],
  )
  const enrolledIds = useMemo(() => new Set(data.enrollments.map(({ id }) => id)), [data.enrollments])
  const filteredStudents = data.students.filter((item) =>
    !enrolledIds.has(item.id) &&
    `${item.code} ${item.fullName} ${item.email}`.toLowerCase().includes(studentSearch.toLowerCase()),
  )

  const resetForm = () => {
    const firstDepartment = data.departments[0]
    setEditing(null); setDepartmentId(firstDepartment?.id ?? '')
    setSubjectId(data.subjects.find(({ departmentId: id }) => id === firstDepartment?.id)?.id ?? '')
    setSemesterId(data.semesters.find(({ isCurrent }) => isCurrent)?.id ?? data.semesters[0]?.id ?? '')
    setClassCode(''); setCapacity('60'); setTeacherId(data.teachers[0]?.id ?? ''); setClassStatus('OPEN')
  }
  const openCreate = () => { resetForm(); setModalOpen(true) }
  const openEdit = (item: CourseOfferingAdmin) => {
    const subject = data.subjects.find(({ id }) => id === item.subjectId)
    setEditing(item); setDepartmentId(subject?.departmentId ?? ''); setSubjectId(item.subjectId ?? '')
    setSemesterId(item.semesterId ?? ''); setClassCode(item.code); setCapacity(String(item.capacity))
    setTeacherId(item.teacherId ?? ''); setClassStatus(item.status); setModalOpen(true)
  }
  const changeDepartment = (id: string) => {
    setDepartmentId(id); setSubjectId(data.subjects.find((item) => item.departmentId === id)?.id ?? '')
  }
  const save = async () => {
    if (!classCode.trim() || !subjectId || !semesterId || !teacherId) {
      return toast.error('Vui lòng nhập đầy đủ thông tin lớp học phần.')
    }
    try {
      await data.save(editing?.id ?? null, {
        code: classCode.trim().toUpperCase(), subjectId, semesterId, teacherId,
        maxCapacity: Math.max(1, Number(capacity) || 50), status: classStatus === 'OPEN' ? 'ACTIVE' : 'CLOSED',
      })
      setModalOpen(false); toast.success(editing ? 'Đã cập nhật lớp học phần.' : 'Đã tạo lớp học phần.')
    } catch { toast.error('Không thể lưu lớp học phần. Vui lòng kiểm tra mã lớp.') }
  }
  const toggleStatus = async (item: CourseOfferingAdmin) => {
    if (!item.subjectId || !item.semesterId || !item.teacherId) return
    try {
      await data.save(item.id, {
        code: item.code, subjectId: item.subjectId, semesterId: item.semesterId, teacherId: item.teacherId,
        maxCapacity: item.capacity, status: item.status === 'OPEN' ? 'CLOSED' : 'ACTIVE',
      })
      toast.success(item.status === 'OPEN' ? 'Đã đóng lớp.' : 'Đã mở lại lớp.')
    } catch { toast.error('Không thể đổi trạng thái lớp.') }
  }

  return (
    <AdminLayout>
      <AdminPageHeader icon={<Users size={20} />} title="Lớp học phần và Xếp lớp"
        description="Quản lý lớp học phần theo học kỳ, giảng viên phụ trách và ghi danh sinh viên vào lớp."
        action={<AdminButton icon={<Plus size={17} />} onClick={openCreate}>Thêm lớp học phần</AdminButton>} />
      <AdminTablePanel>
        <AdminToolbar
          variant="split"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm mã lớp, môn học hoặc giảng viên..."
          onReset={() => {
            setSearch(''); setDepartmentFilter('ALL'); setSubjectFilter('ALL'); setStatusFilter('ALL')
            setSemesterFilter(data.semesters.find(({ isCurrent }) => isCurrent)?.id ?? '')
          }}
          filters={
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 w-full">
              <AdminSelect value={semesterFilter} onChange={setSemesterFilter} className="w-full" options={[
                { value: '', label: 'Tất cả học kỳ' },
                ...data.semesters.map(({ id, name, isCurrent }) => ({
                  value: id, label: `${name}${isCurrent ? ' (Hiện tại)' : ''}`,
                })),
              ]} />
              <AdminSelect value={departmentFilter} onChange={(value) => {
                setDepartmentFilter(value)
                setSubjectFilter('ALL')
              }} className="w-full" options={[
                { value: 'ALL', label: 'Tất cả bộ môn' },
                ...data.departments.map(({ id, name }) => ({ value: id, label: name })),
              ]} />
              <AdminSelect value={subjectFilter} onChange={setSubjectFilter} className="w-full" options={[
                { value: 'ALL', label: 'Tất cả môn học' },
                ...data.subjects
                  .filter((subject) => departmentFilter === 'ALL' || subject.departmentId === departmentFilter)
                  .map(({ id, code, name }) => ({ value: id, label: `${code} - ${name}` })),
              ]} />
              <AdminSelect value={statusFilter} onChange={setStatusFilter} className="w-full" options={[
                { value: 'ALL', label: 'Tất cả trạng thái' }, { value: 'OPEN', label: 'Đang mở' }, { value: 'CLOSED', label: 'Đã đóng' },
              ]} />
            </div>
          }
        />
        {data.loading && <p className="py-8 text-center text-sm text-slate-500">Đang tải lớp học phần...</p>}
        {data.error && <p className="py-8 text-center text-sm text-red-500">{data.error} <button className="ml-2 underline" onClick={data.retry}>Thử lại</button></p>}
        {!data.loading && !data.error && <ClassSectionsTable items={data.items}
          onOpenEnrollment={(item) => {
            setEnrollmentClass(item); setSelectedStudentIds([]); setStudentSearch('')
            void data.loadEnrollments(item.id)
          }}
          onOpenEdit={openEdit} onToggleStatus={(item) => void toggleStatus(item)} />}
      </AdminTablePanel>
      <ClassSectionFormModal open={modalOpen} editingClassId={editing?.id ?? null} departmentInput={departmentId}
        onDepartmentChange={changeDepartment} subjectCodeInput={subjectId} onSubjectCodeChange={setSubjectId}
        selectedDepartmentSubjects={departmentSubjects} semesterCodeInput={semesterId} onSemesterCodeChange={setSemesterId}
        classCodeInput={classCode} onClassCodeChange={setClassCode} capacityInput={capacity} onCapacityChange={setCapacity}
        teacherIdInput={teacherId} onTeacherIdChange={setTeacherId} teacherOptions={data.teachers}
        departments={data.departments} semesters={data.semesters} classStatusInput={classStatus}
        onClassStatusChange={setClassStatus} onClose={() => setModalOpen(false)} onConfirm={() => void save()} />
      <ClassEnrollmentModal key={enrollmentClass?.id ?? 'closed'} course={enrollmentClass} students={filteredStudents} search={studentSearch}
        enrollments={data.enrollments} loading={data.enrollmentsLoading}
        selectedStudentIds={selectedStudentIds} onSearchChange={setStudentSearch}
        onToggleStudent={(id) => setSelectedStudentIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}
        onClose={() => setEnrollmentClass(null)} onConfirm={() => {
          if (!enrollmentClass || selectedStudentIds.length === 0) return toast.error('Vui lòng chọn ít nhất một sinh viên.')
          void data.enroll(enrollmentClass.id, selectedStudentIds)
            .then(() => { toast.success('Đã ghi danh sinh viên.'); setSelectedStudentIds([]) })
            .catch(() => toast.error('Không thể ghi danh. Sinh viên có thể đã thuộc lớp khác cùng môn và học kỳ.'))
        }} onRemoveStudent={(studentId) => {
          if (!enrollmentClass) return
          void data.withdraw(enrollmentClass.id, studentId)
            .then(() => toast.success('Đã xóa sinh viên khỏi lớp.'))
            .catch(() => toast.error('Không thể xóa sinh viên đã phát sinh bài thi trong lớp.'))
        }} />
    </AdminLayout>
  )
}
