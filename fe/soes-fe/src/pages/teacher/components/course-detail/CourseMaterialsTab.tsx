import { CheckCircle2, Download, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import ConfirmDialog from '../../../../components/common/ConfirmDialog'
import { getApiErrorMessage } from '../../../../api/errors'
import FileSelectionList from '../FileSelectionList'
import type { CourseMaterial } from '../../types/teacher-course.types'

interface CourseMaterialsTabProps {
  materials: CourseMaterial[]
  setMaterials: React.Dispatch<React.SetStateAction<CourseMaterial[]>>
  onUpload: (files: File[]) => Promise<CourseMaterial[]>
  onDownload: (materialId: string, fileName: string) => Promise<void>
  onRemove: (materialId: string) => Promise<void>
  onToggleAi?: (materialId: string, aiEnabled: boolean) => Promise<unknown>
}

export default function CourseMaterialsTab({
  materials,
  setMaterials,
  onUpload,
  onDownload,
  onRemove,
  onToggleAi,
}: CourseMaterialsTabProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [busyMaterialId, setBusyMaterialId] = useState<string | null>(null)
  const [materialToRemove, setMaterialToRemove] = useState<CourseMaterial | null>(null)

  const handleUploadMaterial = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedFiles.length) return

    const existingNames = new Set(materials.map((material) => material.fileName.toLowerCase()))
    const incomingNames = new Set<string>()
    const duplicateFile = selectedFiles.find((file) => {
      const fileName = file.name.trim().toLowerCase()
      const duplicated = existingNames.has(fileName) || incomingNames.has(fileName)
      incomingNames.add(fileName)
      return duplicated
    })

    if (duplicateFile) {
      toast.error(`Tệp "${duplicateFile.name}" đã tồn tại hoặc bị chọn trùng.`)
      return
    }

    setIsUploading(true)
    try {
      const uploadedMaterials = await onUpload(selectedFiles)
      const knownChecksums = new Set(materials.map((material) => material.checksum).filter(Boolean))
      const hasSameContent = uploadedMaterials.some((material) => {
        const duplicated = Boolean(material.checksum && knownChecksums.has(material.checksum))
        if (material.checksum) knownChecksums.add(material.checksum)
        return duplicated
      })

      setMaterials((current) => [...uploadedMaterials, ...current])
      setSelectedFiles([])
      if (hasSameContent) {
        toast.info('Có file trùng nội dung với tài liệu đã có, hệ thống vẫn giữ riêng theo lớp.')
      } else {
        toast.success(`Đã tải lên ${uploadedMaterials.length} tài liệu thành công.`)
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải tài liệu lên. Vui lòng kiểm tra lại file hoặc cấu hình Supabase.'))
    } finally {
      setIsUploading(false)
    }
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  const toggleSelectForAI = async (id: string) => {
    const target = materials.find((m) => m.id === id)
    if (!target) return
    const nextState = !target.selectedForAI

    setMaterials((prev) =>
      prev.map((material) => (material.id === id ? { ...material, selectedForAI: nextState } : material)),
    )

    if (onToggleAi) {
      try {
        await onToggleAi(id, nextState)
        toast.success(nextState ? 'Đã bật quyền cho AI sử dụng tài liệu này.' : 'Đã tắt quyền AI cho tài liệu này.')
      } catch (error) {
        setMaterials((prev) =>
          prev.map((material) => (material.id === id ? { ...material, selectedForAI: !nextState } : material)),
        )
        toast.error(getApiErrorMessage(error, 'Không thể cập nhật quyền AI cho tài liệu.'))
      }
    }
  }

  const handleDownload = async (material: CourseMaterial) => {
    setBusyMaterialId(material.id)
    try {
      await onDownload(material.id, material.fileName)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải tài liệu xuống.'))
    } finally {
      setBusyMaterialId(null)
    }
  }

  const confirmRemove = async () => {
    if (!materialToRemove) return
    const targetName = materialToRemove.fileName
    setBusyMaterialId(materialToRemove.id)
    try {
      await onRemove(materialToRemove.id)
      setMaterials((current) => current.filter(({ id }) => id !== materialToRemove.id))
      toast.success(`Đã xóa tài liệu "${targetName}" khỏi lớp học phần.`)
      setMaterialToRemove(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể xóa tài liệu khỏi lớp.'))
    } finally {
      setBusyMaterialId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Tải Lên Tài Liệu Học Tập</h3>
          <p className="mt-1 text-sm text-gray-500">
            Hỗ trợ PDF, DOCX, PPTX. Backend lưu file lên Supabase và tự nhận diện trùng nội dung.
          </p>
        </div>

        <form onSubmit={handleUploadMaterial} className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <label className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 transition-colors hover:border-blue-300 hover:bg-blue-50/40">
              <span className="truncate text-gray-500">Chọn file PDF, DOCX hoặc PPTX...</span>
              <Upload size={18} className="shrink-0 text-blue-600" />
              <input
                type="file"
                accept=".pdf,.docx,.pptx"
                multiple
                className="hidden"
                onChange={(event) => {
                  setSelectedFiles(Array.from(event.target.files ?? []))
                  event.currentTarget.value = ''
                }}
              />
            </label>
            <button
              type="submit"
              disabled={!selectedFiles.length || isUploading}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-xs transition-all hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 cursor-pointer disabled:cursor-not-allowed"
            >
              <CheckCircle2 size={18} />
              {isUploading ? 'Đang tải...' : 'Lưu tài liệu'}
            </button>
          </div>
          <FileSelectionList
            files={selectedFiles}
            onRemove={removeSelectedFile}
            onClear={() => setSelectedFiles([])}
          />
        </form>
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-900">Danh Sách Tài Liệu & Lựa Chọn Cho AI</h3>
          <span className="shrink-0 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
            {materials.filter((material) => material.selectedForAI).length} / {materials.length} tệp đã chọn cho AI
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-100">
          {materials.map((material) => (
            <div
              key={material.id}
              className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-gray-50 sm:p-5"
            >
              <div className="min-w-0">
                <label className="flex cursor-pointer select-none items-center gap-3">
                  <input
                    type="checkbox"
                    checked={material.selectedForAI}
                    onChange={() => toggleSelectForAI(material.id)}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="truncate text-sm font-semibold text-gray-900 hover:text-blue-600">
                    {material.fileName}
                  </span>
                </label>
              </div>

              <div className="flex shrink-0 items-center gap-4 text-sm text-gray-500">
                <span className="hidden rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 sm:inline">
                  {material.storageProvider ?? 'LOCAL'}
                </span>
                <span>{material.fileSize}</span>
                <span>{material.uploadedAt}</span>
                <button
                  type="button"
                  disabled={busyMaterialId === material.id}
                  onClick={() => void handleDownload(material)}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  title="Tải xuống"
                  aria-label="Tải xuống"
                >
                  <Download size={17} />
                </button>
                <button
                  type="button"
                  disabled={busyMaterialId === material.id}
                  onClick={() => setMaterialToRemove(material)}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 cursor-pointer"
                  title="Xóa tài liệu khỏi lớp"
                  aria-label="Xóa tài liệu khỏi lớp"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(materialToRemove)}
        title="Xác nhận xóa tài liệu"
        description={(
          <div className="flex gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600">
              <Trash2 size={20} />
            </span>
            <div className="space-y-1 text-sm text-slate-600 leading-6">
              <p>
                Bạn có chắc chắn muốn xóa tài liệu{' '}
                <strong className="font-semibold text-slate-900">
                  "{materialToRemove?.fileName}"
                </strong>{' '}
                khỏi lớp học phần không?
              </p>
              <p className="text-xs text-slate-500">
                Tệp tin sẽ bị xóa hoàn toàn khỏi hệ thống và không thể khôi phục lại.
              </p>
            </div>
          </div>
        )}
        confirmLabel="Xóa tài liệu"
        pending={busyMaterialId === materialToRemove?.id}
        tone="danger"
        onClose={() => setMaterialToRemove(null)}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  )
}
