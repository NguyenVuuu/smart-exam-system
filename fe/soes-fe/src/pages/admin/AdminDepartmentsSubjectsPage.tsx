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
import { useAdminStructure } from './hooks/useAdminStructure'
import type { AdminSubject, Department } from './types/admin.types'

type StructureTab = 'DEPARTMENTS' | 'SUBJECTS'

export default function AdminDepartmentsSubjectsPage() {
  const data = useAdminStructure()
  const [tab, setTab] = useState<StructureTab>('DEPARTMENTS')
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null)
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [headDepartment, setHeadDepartment] = useState<Department | null>(null)
  const [selectedHeadId, setSelectedHeadId] = useState('NONE')
  const [departmentName, setDepartmentName] = useState('')
  const [departmentHeadId, setDepartmentHeadId] = useState('NONE')
  const [subjectCode, setSubjectCode] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [subjectDepartmentId, setSubjectDepartmentId] = useState('')
  const [subjectCredits, setSubjectCredits] = useState('3')
  const [subjectStatus, setSubjectStatus] = useState<AdminSubject['status']>('ACTIVE')

  const departmentsById = useMemo(
    () => new Map(data.departments.map((item) => [item.id, item])), [data.departments],
  )
  const filteredDepartments = data.departments.filter((item) =>
    `${item.name} ${item.headName ?? ''}`.toLowerCase().includes(search.toLowerCase()),
  )
  const filteredSubjects = data.subjects.filter((item) =>
    (departmentFilter === 'ALL' || item.departmentId === departmentFilter) &&
    `${item.code} ${item.name} ${departmentsById.get(item.departmentId)?.name ?? ''}`
      .toLowerCase().includes(search.toLowerCase()),
  )

  const resetForm = () => {
    setEditingDepartmentId(null); setEditingSubjectId(null)
    setDepartmentName(''); setDepartmentHeadId('NONE')
    setSubjectCode(''); setSubjectName(''); setSubjectCredits('3'); setSubjectStatus('ACTIVE')
    setSubjectDepartmentId(data.departments[0]?.id ?? '')
  }
  const openCreate = () => { resetForm(); setModalOpen(true) }
  const openDepartment = (item: Department) => {
    resetForm(); setEditingDepartmentId(item.id); setDepartmentName(item.name)
    setDepartmentHeadId(item.headUserId ?? 'NONE'); setModalOpen(true)
  }
  const openSubject = (item: AdminSubject) => {
    resetForm(); setEditingSubjectId(item.id); setSubjectCode(item.code); setSubjectName(item.name)
    setSubjectDepartmentId(item.departmentId); setSubjectCredits(String(item.credits))
    setSubjectStatus(item.status); setModalOpen(true)
  }

  const save = async () => {
    try {
      if (tab === 'DEPARTMENTS') {
        const name = departmentName.trim()
        if (!name) return toast.error('Vui lòng nhập tên bộ môn.')
        const current = data.departments.find(({ id }) => id === editingDepartmentId)
        await data.saveDepartment(editingDepartmentId, {
          code: current?.code ?? makeCode(name), name, status: 'ACTIVE',
        }, departmentHeadId === 'NONE' ? null : departmentHeadId)
        toast.success(editingDepartmentId ? 'Đã cập nhật bộ môn.' : 'Đã tạo bộ môn.')
      } else {
        if (!subjectCode.trim() || !subjectName.trim() || !subjectDepartmentId) {
          return toast.error('Vui lòng nhập đầy đủ thông tin môn học.')
        }
        await data.saveSubject(editingSubjectId, {
          code: subjectCode.trim().toUpperCase(), name: subjectName.trim(),
          credits: Math.max(1, Number(subjectCredits) || 3), departmentId: subjectDepartmentId,
          status: subjectStatus,
        })
        toast.success(editingSubjectId ? 'Đã cập nhật môn học.' : 'Đã tạo môn học.')
      }
      setModalOpen(false)
    } catch { toast.error('Không thể lưu dữ liệu. Vui lòng kiểm tra mã trùng và thử lại.') }
  }

  const saveHead = async () => {
    if (!headDepartment) return
    try {
      await data.setDepartmentHead(headDepartment.id, selectedHeadId === 'NONE' ? null : selectedHeadId)
      toast.success(selectedHeadId === 'NONE' ? 'Đã gỡ Trưởng bộ môn.' : 'Đã bổ nhiệm Trưởng bộ môn.')
      setHeadDepartment(null)
    } catch { toast.error('Không thể cập nhật Trưởng bộ môn.') }
  }

  const archiveSubject = async (item: AdminSubject) => {
    try {
      await data.saveSubject(item.id, {
        code: item.code, name: item.name, credits: item.credits,
        departmentId: item.departmentId, status: 'INACTIVE',
      })
      toast.success(`Đã lưu trữ ${item.code}.`)
    } catch { toast.error('Không thể lưu trữ môn học.') }
  }

  return (
    <AdminLayout>
      <AdminPageHeader icon={<BookOpen size={20} />} title="Bộ môn và Môn học"
        description="Quản lý bộ môn, phạm vi chuyên môn, bổ nhiệm Trưởng bộ môn và danh mục môn học."
        action={<AdminButton icon={<Plus size={17} />} onClick={openCreate}>{tab === 'DEPARTMENTS' ? 'Thêm bộ môn' : 'Thêm môn học'}</AdminButton>}
      />
      <div className="mb-5"><AdminSegmentedTabs value={tab} onChange={setTab} tabs={[
        { value: 'DEPARTMENTS', label: 'Bộ môn' }, { value: 'SUBJECTS', label: 'Môn học' },
      ]} /></div>
      <AdminTablePanel>
        <AdminToolbar searchValue={search} onSearchChange={setSearch}
          searchPlaceholder={tab === 'DEPARTMENTS' ? 'Tìm bộ môn hoặc trưởng bộ môn...' : 'Tìm mã môn, tên môn hoặc bộ môn...'}
          onReset={() => { setSearch(''); setDepartmentFilter('ALL') }}
          filters={tab === 'SUBJECTS' ? <AdminSelect value={departmentFilter} onChange={setDepartmentFilter} className="w-64"
            options={[{ value: 'ALL', label: 'Tất cả bộ môn' }, ...data.departments.map(({ id, name }) => ({ value: id, label: name }))]} /> : undefined}
        />
        {data.loading && <p className="py-8 text-center text-sm text-slate-500">Đang tải dữ liệu...</p>}
        {data.error && <p className="py-8 text-center text-sm text-red-500">{data.error} <button className="ml-2 underline" onClick={data.retry}>Thử lại</button></p>}
        {!data.loading && !data.error && (tab === 'DEPARTMENTS'
          ? <DepartmentsTable departments={filteredDepartments} onOpenHeadModal={(item) => { setHeadDepartment(item); setSelectedHeadId(item.headUserId ?? 'NONE') }} onEditDepartment={openDepartment} />
          : <SubjectsTable subjects={filteredSubjects} departmentsById={departmentsById} onEditSubject={openSubject} onArchiveSubject={(item) => void archiveSubject(item)} />)}
      </AdminTablePanel>
      <DepartmentSubjectFormModal open={modalOpen} tab={tab} editingDepartmentId={editingDepartmentId}
        editingSubjectId={editingSubjectId} departments={data.departments} teacherCandidates={data.teachers}
        departmentNameInput={departmentName} onDepartmentNameChange={setDepartmentName}
        departmentHeadInput={departmentHeadId} onDepartmentHeadChange={setDepartmentHeadId}
        subjectCodeInput={subjectCode} onSubjectCodeChange={setSubjectCode} subjectNameInput={subjectName}
        onSubjectNameChange={setSubjectName} subjectDepartmentInput={subjectDepartmentId}
        onSubjectDepartmentChange={setSubjectDepartmentId} subjectCreditsInput={subjectCredits}
        onSubjectCreditsChange={setSubjectCredits} subjectStatusInput={subjectStatus}
        onSubjectStatusChange={setSubjectStatus} onClose={() => setModalOpen(false)} onConfirm={() => void save()} />
      <DepartmentHeadModal department={headDepartment} teacherCandidates={data.teachers}
        selectedHeadUserId={selectedHeadId} onSelect={setSelectedHeadId} onClose={() => setHeadDepartment(null)}
        onConfirm={() => void saveHead()} />
    </AdminLayout>
  )
}

const makeCode = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 30)
