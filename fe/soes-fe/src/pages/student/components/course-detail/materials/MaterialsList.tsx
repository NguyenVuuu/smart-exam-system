import { Download, FileText, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { downloadMaterial, getMaterials } from '../../../api/student-course-detail.api'
import type { CourseMaterial } from '../../../types/course-detail.types'

interface MaterialsListProps {
  courseOfferingId: string
}

export default function MaterialsList({ courseOfferingId }: MaterialsListProps) {
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMaterials(courseOfferingId)
      setMaterials(data.items)
    } catch {
      setError('Không thể tải tài liệu.')
    } finally {
      setLoading(false)
    }
  }, [courseOfferingId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load() }, [load])

  const handleDownload = async (material: CourseMaterial) => {
    try {
      const blob = await downloadMaterial(courseOfferingId, material.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = material.fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Không thể tải file này.')
    }
  }

  if (loading) return <Message text="Đang tải tài liệu..." />
  if (error) return <Message text={error} action={load} />
  if (materials.length === 0) return <Message text="Lớp học phần chưa có tài liệu." />

  return (
    <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h2 className="text-sm font-bold text-slate-900">Tài liệu học tập</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-gray-50"
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {materials.map((material) => (
          <div key={material.id} className="flex items-center gap-3 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FileText size={19} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{material.title || material.fileName}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {material.fileType} · {material.fileSize} · {formatDate(material.uploadedAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleDownload(material)}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              <Download size={14} /> Tải xuống
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

function Message({ text, action }: { text: string; action?: () => void }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-gray-100 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
      <FileText size={34} className="text-slate-300" />
      <span>{text}</span>
      {action && (
        <button type="button" onClick={action} className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700">
          <RefreshCw size={15} /> Thử lại
        </button>
      )}
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}
