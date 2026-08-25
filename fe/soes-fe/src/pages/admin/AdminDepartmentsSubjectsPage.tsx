import { Archive, BookOpen, Crown, Edit, Plus, UserMinus, UserPlus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import AppBadge from '../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import { ADMIN_DEPARTMENTS, ADMIN_SUBJECTS, ADMIN_USERS } from './mock/admin.mock'
import type { AdminSubject, AdminUser, Department } from './types/admin.types'
import { AdminStatusBadge } from './components/AdminBadges'
import AdminButton from './components/AdminButton'
import { AdminField, AdminInput } from './components/AdminFormFields'
import AdminLayout from './components/AdminLayout'
import AdminModal from './components/AdminModal'
import AdminPageHeader from './components/AdminPageHeader'
import AdminSelect from './components/AdminSelect'
import AdminSegmentedTabs from './components/AdminSegmentedTabs'
import AdminTablePanel from './components/AdminTablePanel'
import AdminToolbar from './components/AdminToolbar'

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

  const filteredDepartments = departments.filter((item) =>
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
    setDepartments((prev) => prev.map((department) => {
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
    }))

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

      const isDuplicate = departments.some((department) =>
        department.id !== editingDepartmentId &&
        department.name.toLowerCase() === departmentName.toLowerCase(),
      )
      if (isDuplicate) {
        toast.error('Tên bộ môn đã tồn tại.')
        return
      }

      const selectedTeacher = teacherCandidates.find((teacher) => teacher.id === departmentHeadInput)
      if (editingDepartmentId) {
        setDepartments((prev) => prev.map((department) => department.id === editingDepartmentId
          ? {
              ...department,
              name: departmentName,
              headUserId: selectedTeacher?.id,
              headName: selectedTeacher?.fullName,
              headCode: selectedTeacher?.code,
            }
          : department,
        ))
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

    const isDuplicate = subjects.some((subject) =>
      subject.id !== editingSubjectId &&
      subject.code.toLowerCase() === subjectCode.toLowerCase(),
    )
    if (isDuplicate) {
      toast.error('Mã môn học đã tồn tại.')
      return
    }

    const creditValue = Math.max(1, Number(subjectCreditsInput) || 3)
    if (editingSubjectId) {
      const previousSubject = subjects.find((subject) => subject.id === editingSubjectId)
      setSubjects((prev) => prev.map((subject) => subject.id === editingSubjectId
        ? {
            ...subject,
            code: subjectCode,
            name: subjectName,
            departmentId: subjectDepartmentInput,
            credits: creditValue,
            status: subjectStatusInput,
          }
        : subject,
      ))
      if (previousSubject && previousSubject.departmentId !== subjectDepartmentInput) {
        setDepartments((prev) => prev.map((department) => {
          if (department.id === previousSubject.departmentId) {
            return { ...department, subjectCount: Math.max(0, department.subjectCount - 1) }
          }
          if (department.id === subjectDepartmentInput) {
            return { ...department, subjectCount: department.subjectCount + 1 }
          }
          return department
        }))
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
    setDepartments((prev) => prev.map((department) =>
      department.id === subjectDepartmentInput
        ? { ...department, subjectCount: department.subjectCount + 1 }
        : department,
    ))
    setModalOpen(false)
    toast.success(`Đã thêm môn học ${subjectCode}.`)
  }

  const handleArchiveSubject = (subject: AdminSubject) => {
    if (subject.status === 'INACTIVE') {
      toast.info(`${subject.code} đã ở trạng thái tạm ngưng.`)
      return
    }

    setSubjects((prev) => prev.map((item) =>
      item.id === subject.id ? { ...item, status: 'INACTIVE' } : item,
    ))
    toast.success(`Đã lưu trữ môn học ${subject.code}.`)
  }

  const modalTitle = tab === 'DEPARTMENTS'
    ? editingDepartmentId ? 'Cập nhật bộ môn' : 'Thêm bộ môn mới'
    : editingSubjectId ? 'Cập nhật môn học' : 'Thêm môn học mới'

  const modalDescription = tab === 'DEPARTMENTS'
    ? 'Bộ môn là phạm vi chuyên môn để quản lý môn học và bổ nhiệm Trưởng bộ môn.'
    : 'Môn học là đơn vị để mở các lớp học phần trong từng học kỳ.'

  const modalConfirmText = tab === 'DEPARTMENTS'
    ? editingDepartmentId ? 'Cập nhật bộ môn' : 'Tạo bộ môn'
    : editingSubjectId ? 'Cập nhật môn học' : 'Tạo môn học'

  const departmentColumns: ColumnDef<Department>[] = [
    { header: 'TÊN BỘ MÔN', render: (item) => <span className="text-sm font-semibold text-slate-950">{item.name}</span> },
    {
      header: 'TRƯỞNG BỘ MÔN',
      width: '260px',
      render: (item) => item.headName ? (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">{getInitials(item.headName)}</div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{item.headName}</p>
            <p className="text-xs text-slate-400">{item.headCode}</p>
          </div>
        </div>
      ) : <span className="text-sm text-slate-400">Chưa bổ nhiệm</span>,
    },
    { header: 'MÔN HỌC', width: '130px', render: (item) => <AppBadge tone={item.subjectCount > 0 ? 'emerald' : 'gray'}>{item.subjectCount} môn</AppBadge> },
    {
      header: 'THAO TÁC',
      width: '130px',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end gap-1 text-slate-500">
          <button
            className={`rounded-lg p-1.5 transition-colors hover:bg-emerald-50 hover:text-emerald-600 ${
              item.headName ? 'text-emerald-600' : ''
            }`}
            title={item.headName ? 'Đổi Trưởng bộ môn' : 'Bổ nhiệm Trưởng bộ môn'}
            onClick={() => openHeadModal(item)}
          >
            <Crown size={17} fill="none" />
          </button>
          <button
            className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600"
            title="Chỉnh sửa"
            onClick={() => openEditDepartmentModal(item)}
          >
            <Edit size={17} />
          </button>
        </div>
      ),
    },
  ]

  const subjectColumns: ColumnDef<AdminSubject>[] = [
    { header: 'MÃ MÔN', width: '120px', render: (item) => <span className="text-sm font-semibold text-slate-950">{item.code}</span> },
    { header: 'TÊN MÔN HỌC', render: (item) => <span className="text-sm text-slate-800">{item.name}</span> },
    { header: 'BỘ MÔN', width: '260px', render: (item) => <span className="text-sm text-slate-700">{departmentsById.get(item.departmentId)?.name}</span> },
    { header: 'TÍN CHỈ', width: '90px', align: 'center', render: (item) => <span className="text-sm font-semibold text-slate-800">{item.credits}</span> },
    { header: 'SỐ LỚP', width: '100px', render: (item) => <AppBadge tone="emerald">{item.courseCount} lớp</AppBadge> },
    { header: 'TRẠNG THÁI', width: '150px', render: (item) => <AdminStatusBadge status={item.status} /> },
    {
      header: 'THAO TÁC',
      width: '120px',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end gap-1 text-slate-500">
          <button
            className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600"
            title="Chỉnh sửa"
            onClick={() => openEditSubjectModal(item)}
          >
            <Edit size={17} />
          </button>
          <button
            className="rounded-lg p-1.5 hover:bg-slate-50 hover:text-slate-700"
            title="Lưu trữ"
            onClick={() => handleArchiveSubject(item)}
          >
            <Archive size={17} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<BookOpen size={20} />}
        title="Bộ môn và Môn học"
        description="Quản lý bộ môn, phạm vi chuyên môn, bổ nhiệm Trưởng bộ môn và danh mục môn học."
        action={<AdminButton icon={<Plus size={17} />} onClick={openCreateModal}>{tab === 'DEPARTMENTS' ? 'Thêm bộ môn' : 'Thêm môn học'}</AdminButton>}
      />

      <div className="mb-5">
        <AdminSegmentedTabs value={tab} onChange={setTab} tabs={[
          { value: 'DEPARTMENTS', label: 'Bộ môn' },
          { value: 'SUBJECTS', label: 'Môn học' },
        ]} />
      </div>

      <AdminTablePanel>
        <AdminToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={tab === 'DEPARTMENTS' ? 'Tìm bộ môn hoặc trưởng bộ môn...' : 'Tìm mã môn, tên môn hoặc bộ môn...'}
          onReset={() => {
            setSearch('')
            setDepartmentFilter('ALL')
          }}
          filters={tab === 'SUBJECTS' && (
            <AdminSelect
              value={departmentFilter}
              onChange={setDepartmentFilter}
              className="w-64"
              options={[
                { value: 'ALL', label: 'Tất cả bộ môn' },
                ...departments.map((department) => ({ value: department.id, label: department.name })),
              ]}
            />
          )}
        />
        {tab === 'DEPARTMENTS' ? (
          <DataTable columns={departmentColumns} data={filteredDepartments} keyExtractor={(item) => item.id} emptyText="Chưa có bộ môn phù hợp." />
        ) : (
          <DataTable columns={subjectColumns} data={filteredSubjects} keyExtractor={(item) => item.id} emptyText="Chưa có môn học phù hợp." />
        )}
      </AdminTablePanel>

      <AdminModal
        open={modalOpen}
        title={modalTitle}
        description={modalDescription}
        confirmText={modalConfirmText}
        onClose={() => {
          setModalOpen(false)
          setEditingDepartmentId(null)
          setEditingSubjectId(null)
        }}
        onConfirm={handleCreateStructureItem}
      >
        <div className="space-y-4">
          {tab === 'DEPARTMENTS' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <AdminField label="Tên bộ môn">
                <AdminInput
                  value={departmentNameInput}
                  onChange={(event) => setDepartmentNameInput(event.target.value)}
                  placeholder="VD: Bộ môn Công nghệ phần mềm"
                />
              </AdminField>
              <AdminField label="Trưởng bộ môn">
                <AdminSelect
                  value={departmentHeadInput}
                  onChange={setDepartmentHeadInput}
                  options={[
                    { value: 'NONE', label: 'Chưa bổ nhiệm' },
                    ...teacherCandidates.map((teacher) => ({
                      value: teacher.id,
                      label: `${teacher.fullName} - ${teacher.code}`,
                    })),
                  ]}
                />
              </AdminField>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <AdminField label="Mã môn học">
                  <AdminInput
                    value={subjectCodeInput}
                    onChange={(event) => setSubjectCodeInput(event.target.value)}
                    placeholder="VD: CS101"
                  />
                </AdminField>
                <AdminField label="Số tín chỉ">
                  <AdminInput
                    type="number"
                    min={1}
                    value={subjectCreditsInput}
                    onChange={(event) => setSubjectCreditsInput(event.target.value)}
                    placeholder="3"
                  />
                </AdminField>
              </div>
              <AdminField label="Tên môn học">
                <AdminInput
                  value={subjectNameInput}
                  onChange={(event) => setSubjectNameInput(event.target.value)}
                  placeholder="VD: Lập trình Java"
                />
              </AdminField>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <AdminField label="Bộ môn phụ trách">
                  <AdminSelect
                    value={subjectDepartmentInput}
                    onChange={setSubjectDepartmentInput}
                    options={departments.map((department) => ({ value: department.id, label: department.name }))}
                  />
                </AdminField>
                <AdminField label="Trạng thái">
                  <AdminSelect
                    value={subjectStatusInput}
                    onChange={(value) => setSubjectStatusInput(value as AdminSubject['status'])}
                    options={[
                      { value: 'ACTIVE', label: 'Đang sử dụng' },
                      { value: 'INACTIVE', label: 'Tạm ngưng' },
                    ]}
                  />
                </AdminField>
              </div>
            </>
          )}
        </div>
      </AdminModal>

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

function DepartmentHeadModal({
  department,
  teacherCandidates,
  selectedHeadUserId,
  onSelect,
  onClose,
  onConfirm,
}: {
  department: Department | null
  teacherCandidates: AdminUser[]
  selectedHeadUserId: string
  onSelect: (userId: string) => void
  onClose: () => void
  onConfirm: () => void
}) {
  if (!department) return null

  const isRemoving = selectedHeadUserId === 'NONE'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Bổ nhiệm trưởng bộ môn - {department.name}
            </h2>
            <p className="mt-1 text-[13px] leading-[19px] text-slate-500">
              Chọn giảng viên làm Trưởng bộ môn. Chọn mục chưa có để gỡ bổ nhiệm hiện tại.
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

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-5">
          <HeadOption
            checked={selectedHeadUserId === 'NONE'}
            title="Chưa có trưởng bộ môn"
            onClick={() => onSelect('NONE')}
          />

          {teacherCandidates.map((teacher) => (
            <HeadOption
              key={teacher.id}
              checked={selectedHeadUserId === teacher.id}
              title={teacher.fullName}
              subtitle={`${teacher.code} • ${teacher.departmentName ?? 'Chưa gán bộ môn'}`}
              initials={getInitials(teacher.fullName)}
              onClick={() => onSelect(teacher.id)}
            />
          ))}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <AdminButton tone="secondary" onClick={onClose}>Hủy</AdminButton>
          <AdminButton icon={isRemoving ? <UserMinus size={17} /> : <UserPlus size={17} />} onClick={onConfirm}>
            {isRemoving ? 'Gỡ bổ nhiệm' : 'Bổ nhiệm'}
          </AdminButton>
        </div>
      </div>
    </div>
  )
}

function HeadOption({
  checked,
  title,
  subtitle,
  initials,
  onClick,
}: {
  checked: boolean
  title: string
  subtitle?: string
  initials?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-colors ${
        checked
          ? 'border-emerald-400 bg-emerald-50/40'
          : 'border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {initials && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{title}</p>
          {subtitle && <p className="mt-0.5 truncate text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>

      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          checked ? 'border-emerald-600' : 'border-slate-400'
        }`}
      >
        {checked && <span className="h-3 w-3 rounded-full bg-emerald-600" />}
      </span>
    </button>
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
