import { BookOpen, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import AdminButton from './components/AdminButton'
import AdminLayout from './components/AdminLayout'
import AdminPageHeader from './components/AdminPageHeader'
import AdminSegmentedTabs from './components/AdminSegmentedTabs'
import AdminSelect from './components/AdminSelect'
import AdminTablePanel from './components/AdminTablePanel'
import AdminToolbar from './components/AdminToolbar'
import DepartmentHeadModal from './components/academic/DepartmentHeadModal'
import DepartmentSubjectFormModal from './components/academic/DepartmentSubjectFormModal'
import DepartmentsTable from './components/academic/DepartmentsTable'
import SubjectsTable from './components/academic/SubjectsTable'
import { ADMIN_DEPARTMENTS, ADMIN_SUBJECTS, ADMIN_USERS } from './mock/admin.mock'
import type { AdminSubject, Department } from './types/admin.types'

type StructureTab = 'DEPARTMENTS' | 'SUBJECTS'

export default function AdminDepartmentsSubjectsPage() {
  const [tab, setTab] = useState<StructureTab>('DEPARTMENTS')
  const [departments, setDepartments] = useState<Department[]>(ADMIN_DEPARTMENTS)
  const [subjects, setSubjects] = useState<AdminSubject[]>(ADMIN_SUBJECTS)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null)
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [headModalDepartment, setHeadModalDepartment] = useState<Department | null>(null)
  const [selectedHeadUserId, setSelectedHeadUserId] = useState<string>('NONE')
  const [departmentNameInput, setDepartmentNameInput] = useState('')
  const [departmentHeadInput, setDepartmentHeadInput] = useState<string>('NONE')
  const [subjectCodeInput, setSubjectCodeInput] = useState('')
  const [subjectNameInput, setSubjectNameInput] = useState('')
  const [subjectDepartmentInput, setSubjectDepartmentInput] = useState(ADMIN_DEPARTMENTS[0]?.id ?? '')
  const [subjectCreditsInput, setSubjectCreditsInput] = useState('3')
  const [subjectStatusInput, setSubjectStatusInput] = useState<AdminSubject['status']>('ACTIVE')

  const departmentsById = useMemo(() => new Map(departments.map((item) => [item.id, item])), [departments])
  const teacherCandidates = useMemo(() => ADMIN_USERS.filter((user) => user.role === 'TEACHER'), [])

  const filteredDepartments = departments.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.headName?.toLowerCase().includes(search.toLowerCase()),
  )

  const filteredSubjects = subjects.filter((item) => {
    const matchesDepartment = departmentFilter === 'ALL' || item.departmentId === departmentFilter
    const matchesSearch =
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      departmentsById.get(item.departmentId)?.name.toLowerCase().includes(search.toLowerCase())
    return matchesDepartment && matchesSearch
  })

  const openHeadModal = (department: Department) => {
    setHeadModalDepartment(department)
    setSelectedHeadUserId(department.headUserId ?? 'NONE')
  }

  const openCreateModal = () => {
    setEditingDepartmentId(null)
    setEditingSubjectId(null)
    setDepartmentNameInput('')
    setDepartmentHeadInput('NONE')
    setSubjectCodeInput('')
    setSubjectNameInput('')
    setSubjectDepartmentInput(departments[0]?.id ?? '')
    setSubjectCreditsInput('3')
    setSubjectStatusInput('ACTIVE')
    setModalOpen(true)
  }

  const openEditDepartmentModal = (department: Department) => {
    setEditingDepartmentId(department.id)
    setEditingSubjectId(null)
    setDepartmentNameInput(department.name)
    setDepartmentHeadInput(department.headUserId ?? 'NONE')
    setModalOpen(true)
  }

  const openEditSubjectModal = (subject: AdminSubject) => {
    setEditingSubjectId(subject.id)
    setEditingDepartmentId(null)
    setSubjectCodeInput(subject.code)
    setSubjectNameInput(subject.name)
    setSubjectDepartmentInput(subject.departmentId)
    setSubjectCreditsInput(String(subject.credits))
    setSubjectStatusInput(subject.status)
    setModalOpen(true)
  }

  const handleSaveDepartmentHead = () => {
    if (!headModalDepartment) return

    const selectedTeacher = teacherCandidates.find((teacher) => teacher.id === selectedHeadUserId)
    setDepartments((prev) =>
      prev.map((department) => {
        if (department.id !== headModalDepartment.id) return department

        if (!selectedTeacher) {
          return {
            ...department,
            headUserId: undefined,
            headName: undefined,
            headCode: undefined,
          }
        }

        return {
          ...department,
          headUserId: selectedTeacher.id,
          headName: selectedTeacher.fullName,
          headCode: selectedTeacher.code,
        }
      }),
    )

    toast.success(
      selectedTeacher
        ? `Đã bổ nhiệm ${selectedTeacher.fullName} làm Trưởng bộ môn.`
        : `Đã gỡ Trưởng bộ môn của ${headModalDepartment.name}.`,
    )
    setHeadModalDepartment(null)
  }

  const handleCreateStructureItem = () => {
    if (tab === 'DEPARTMENTS') {
      const departmentName = departmentNameInput.trim()
      if (!departmentName) {
        toast.error('Vui lòng nhập tên bộ môn.')
        return
      }

      const isDuplicate = departments.some(
        (department) =>
          department.id !== editingDepartmentId &&
          department.name.toLowerCase() === departmentName.toLowerCase(),
      )
      if (isDuplicate) {
        toast.error('Tên bộ môn đã tồn tại.')
        return
      }

      const selectedTeacher = teacherCandidates.find((teacher) => teacher.id === departmentHeadInput)
      if (editingDepartmentId) {
        setDepartments((prev) =>
          prev.map((department) =>
            department.id === editingDepartmentId
              ? {
                  ...department,
                  name: departmentName,
                  headUserId: selectedTeacher?.id,
                  headName: selectedTeacher?.fullName,
                  headCode: selectedTeacher?.code,
                }
              : department,
          ),
        )
        setModalOpen(false)
        toast.success(`Đã cập nhật ${departmentName}.`)
        return
      }

      setDepartments((prev) => [
        ...prev,
        {
          id: createEntityId('dept', departmentName),
          name: departmentName,
          headUserId: selectedTeacher?.id,
          headName: selectedTeacher?.fullName,
          headCode: selectedTeacher?.code,
          subjectCount: 0,
        },
      ])
      setModalOpen(false)
      toast.success(`Đã thêm ${departmentName}.`)
      return
    }

    const subjectCode = subjectCodeInput.trim().toUpperCase()
    const subjectName = subjectNameInput.trim()
    if (!subjectCode || !subjectName) {
      toast.error('Vui lòng nhập mã môn và tên môn học.')
      return
    }

    const isDuplicate = subjects.some(
      (subject) =>
        subject.id !== editingSubjectId && subject.code.toLowerCase() === subjectCode.toLowerCase(),
    )
    if (isDuplicate) {
      toast.error('Mã môn học đã tồn tại.')
      return
    }

    const creditValue = Math.max(1, Number(subjectCreditsInput) || 3)
    if (editingSubjectId) {
      const previousSubject = subjects.find((subject) => subject.id === editingSubjectId)
      setSubjects((prev) =>
        prev.map((subject) =>
          subject.id === editingSubjectId
            ? {
                ...subject,
                code: subjectCode,
                name: subjectName,
                departmentId: subjectDepartmentInput,
                credits: creditValue,
                status: subjectStatusInput,
              }
            : subject,
        ),
      )
      if (previousSubject && previousSubject.departmentId !== subjectDepartmentInput) {
        setDepartments((prev) =>
          prev.map((department) => {
            if (department.id === previousSubject.departmentId) {
              return { ...department, subjectCount: Math.max(0, department.subjectCount - 1) }
            }
            if (department.id === subjectDepartmentInput) {
              return { ...department, subjectCount: department.subjectCount + 1 }
            }
            return department
          }),
        )
      }
      setModalOpen(false)
      toast.success(`Đã cập nhật môn học ${subjectCode}.`)
      return
    }

    setSubjects((prev) => [
      ...prev,
      {
        id: createEntityId('sub', subjectCode),
        code: subjectCode,
        name: subjectName,
        departmentId: subjectDepartmentInput,
        credits: creditValue,
        courseCount: 0,
        status: subjectStatusInput,
      },
    ])
    setDepartments((prev) =>
      prev.map((department) =>
        department.id === subjectDepartmentInput
          ? { ...department, subjectCount: department.subjectCount + 1 }
          : department,
      ),
    )
    setModalOpen(false)
    toast.success(`Đã thêm môn học ${subjectCode}.`)
  }

  const handleArchiveSubject = (subject: AdminSubject) => {
    if (subject.status === 'INACTIVE') {
      toast.info(`${subject.code} đã ở trạng thái tạm ngưng.`)
      return
    }

    setSubjects((prev) =>
      prev.map((item) => (item.id === subject.id ? { ...item, status: 'INACTIVE' } : item)),
    )
    toast.success(`Đã lưu trữ môn học ${subject.code}.`)
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<BookOpen size={20} />}
        title="Bộ môn và Môn học"
        description="Quản lý bộ môn, phạm vi chuyên môn, bổ nhiệm Trưởng bộ môn và danh mục môn học."
        action={
          <AdminButton icon={<Plus size={17} />} onClick={openCreateModal}>
            {tab === 'DEPARTMENTS' ? 'Thêm bộ môn' : 'Thêm môn học'}
          </AdminButton>
        }
      />

      <div className="mb-5">
        <AdminSegmentedTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'DEPARTMENTS', label: 'Bộ môn' },
            { value: 'SUBJECTS', label: 'Môn học' },
          ]}
        />
      </div>

      <AdminTablePanel>
        <AdminToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={
            tab === 'DEPARTMENTS' ? 'Tìm bộ môn hoặc trưởng bộ môn...' : 'Tìm mã môn, tên môn hoặc bộ môn...'
          }
          onReset={() => {
            setSearch('')
            setDepartmentFilter('ALL')
          }}
          filters={
            tab === 'SUBJECTS' && (
              <AdminSelect
                value={departmentFilter}
                onChange={setDepartmentFilter}
                className="w-64"
                options={[
                  { value: 'ALL', label: 'Tất cả bộ môn' },
                  ...departments.map((department) => ({ value: department.id, label: department.name })),
                ]}
              />
            )
          }
        />

        {tab === 'DEPARTMENTS' ? (
          <DepartmentsTable
            departments={filteredDepartments}
            onOpenHeadModal={openHeadModal}
            onEditDepartment={openEditDepartmentModal}
          />
        ) : (
          <SubjectsTable
            subjects={filteredSubjects}
            departmentsById={departmentsById}
            onEditSubject={openEditSubjectModal}
            onArchiveSubject={handleArchiveSubject}
          />
        )}
      </AdminTablePanel>

      <DepartmentSubjectFormModal
        open={modalOpen}
        tab={tab}
        editingDepartmentId={editingDepartmentId}
        editingSubjectId={editingSubjectId}
        departments={departments}
        teacherCandidates={teacherCandidates}
        departmentNameInput={departmentNameInput}
        onDepartmentNameChange={setDepartmentNameInput}
        departmentHeadInput={departmentHeadInput}
        onDepartmentHeadChange={setDepartmentHeadInput}
        subjectCodeInput={subjectCodeInput}
        onSubjectCodeChange={setSubjectCodeInput}
        subjectNameInput={subjectNameInput}
        onSubjectNameChange={setSubjectNameInput}
        subjectDepartmentInput={subjectDepartmentInput}
        onSubjectDepartmentChange={setSubjectDepartmentInput}
        subjectCreditsInput={subjectCreditsInput}
        onSubjectCreditsChange={setSubjectCreditsInput}
        subjectStatusInput={subjectStatusInput}
        onSubjectStatusChange={setSubjectStatusInput}
        onClose={() => {
          setModalOpen(false)
          setEditingDepartmentId(null)
          setEditingSubjectId(null)
        }}
        onConfirm={handleCreateStructureItem}
      />

      <DepartmentHeadModal
        department={headModalDepartment}
        teacherCandidates={teacherCandidates}
        selectedHeadUserId={selectedHeadUserId}
        onSelect={setSelectedHeadUserId}
        onClose={() => setHeadModalDepartment(null)}
        onConfirm={handleSaveDepartmentHead}
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
