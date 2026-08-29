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
import { useAdminClassSections } from './hooks/useAdminClassSections'
import type { CourseOfferingAdmin } from './types/admin.types'

export default function AdminClassSectionsPage() {
  const data = useAdminClassSections()
  const [subjectFilter, setSubjectFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | CourseOfferingAdmin['status']>('ALL')
  const [search, setSearch] = useState('')
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
  const filteredItems = data.items.filter((item) =>
    (subjectFilter === 'ALL' || item.subjectId === subjectFilter) &&
    (statusFilter === 'ALL' || item.status === statusFilter) &&
    `${item.code} ${item.subjectName} ${item.teacherName}`.toLowerCase().includes(search.toLowerCase()),
  )
  const filteredStudents = data.students.filter((item) =>
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
        action={<div className="flex gap-2">
          <AdminButton tone="secondary" icon={<Upload size={17} />} onClick={() => data.items[0] && setEnrollmentClass(data.items[0])}>Nhập sinh viên</AdminButton>
          <AdminButton icon={<Plus size={17} />} onClick={openCreate}>Thêm lớp học phần</AdminButton>
        </div>} />
      <AdminTablePanel>
        <AdminToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Tìm mã lớp, môn học hoặc giảng viên..."
          onReset={() => { setSearch(''); setSubjectFilter('ALL'); setStatusFilter('ALL') }} filters={<>
            <AdminSelect value={subjectFilter} onChange={setSubjectFilter} className="w-64" options={[
              { value: 'ALL', label: 'Môn học' }, ...data.subjects.map(({ id, code, name }) => ({ value: id, label: `${code} - ${name}` })),
            ]} />
            <AdminSelect value={statusFilter} onChange={setStatusFilter} className="w-44" options={[
              { value: 'ALL', label: 'Trạng thái' }, { value: 'OPEN', label: 'Đang mở' }, { value: 'CLOSED', label: 'Đã đóng' },
            ]} />
          </>} />
        {data.loading && <p className="py-8 text-center text-sm text-slate-500">Đang tải lớp học phần...</p>}
        {data.error && <p className="py-8 text-center text-sm text-red-500">{data.error} <button className="ml-2 underline" onClick={data.retry}>Thử lại</button></p>}
        {!data.loading && !data.error && <ClassSectionsTable items={filteredItems}
          onOpenEnrollment={(item) => { setEnrollmentClass(item); setSelectedStudentIds([]); setStudentSearch('') }}
          onOpenEdit={openEdit} onToggleStatus={(item) => void toggleStatus(item)} />}
      </AdminTablePanel>
      <ClassSectionFormModal open={modalOpen} editingClassId={editing?.id ?? null} departmentInput={departmentId}
        onDepartmentChange={changeDepartment} subjectCodeInput={subjectId} onSubjectCodeChange={setSubjectId}
        selectedDepartmentSubjects={departmentSubjects} semesterCodeInput={semesterId} onSemesterCodeChange={setSemesterId}
        classCodeInput={classCode} onClassCodeChange={setClassCode} capacityInput={capacity} onCapacityChange={setCapacity}
        teacherIdInput={teacherId} onTeacherIdChange={setTeacherId} teacherOptions={data.teachers}
        departments={data.departments} semesters={data.semesters} classStatusInput={classStatus}
        onClassStatusChange={setClassStatus} onClose={() => setModalOpen(false)} onConfirm={() => void save()} />
      <ClassEnrollmentModal course={enrollmentClass} students={filteredStudents} search={studentSearch}
        selectedStudentIds={selectedStudentIds} onSearchChange={setStudentSearch}
        onToggleStudent={(id) => setSelectedStudentIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}
        onClose={() => setEnrollmentClass(null)} onConfirm={() => {
          if (!enrollmentClass || selectedStudentIds.length === 0) return toast.error('Vui lòng chọn ít nhất một sinh viên.')
          void data.enroll(enrollmentClass.id, selectedStudentIds)
            .then(() => { toast.success('Đã ghi danh sinh viên.'); setEnrollmentClass(null) })
            .catch(() => toast.error('Không thể ghi danh. Lớp có thể đã đủ sức chứa.'))
        }} />
    </AdminLayout>
  )
}
