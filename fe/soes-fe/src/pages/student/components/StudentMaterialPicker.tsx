import { useMemo } from 'react'
import AppSelect from '../../../components/common/AppSelect'
import type { StudyMaterial } from '../api/student-learning.api'

interface Props {
  materials: StudyMaterial[]
  subjectId: string
  materialId: string
  onSubjectChange: (subjectId: string) => void
  onMaterialChange: (materialId: string) => void
}

export default function StudentMaterialPicker({ materials, subjectId, materialId,
  onSubjectChange, onMaterialChange }: Props) {
  const subjects = useMemo(() => Array.from(new Map(materials.map((item) => [
    item.courseOffering.subject.id, item.courseOffering.subject.name,
  ])).entries()).sort((a, b) => a[1].localeCompare(b[1], 'vi')), [materials])
  const available = useMemo(() => materials.filter((item) => item.courseOffering.subject.id === subjectId),
    [materials, subjectId])

  return <div className="grid gap-4 sm:grid-cols-2">
    <div className="space-y-2">
      <span className="block text-sm font-semibold text-slate-700">1. Môn học</span>
      <AppSelect value={subjectId} options={subjects.map(([value, label]) => ({ value, label }))}
        onChange={onSubjectChange} placeholder="Chọn môn học" ariaLabel="Chọn môn học"
        disabled={subjects.length === 0} buttonClassName="h-11 border-slate-200" />
    </div>
    <div className="space-y-2">
      <span className="block text-sm font-semibold text-slate-700">2. Tài liệu lớp học</span>
      <AppSelect value={materialId} options={available.map((item) => ({
        value: item.id, label: `${item.title || item.fileName} · ${item.courseOffering.code}`,
      }))} onChange={onMaterialChange} placeholder={subjectId ? 'Chọn tài liệu' : 'Chọn môn học trước'}
        ariaLabel="Chọn tài liệu lớp học" disabled={!subjectId || available.length === 0}
        buttonClassName="h-11 border-slate-200" />
    </div>
  </div>
}
