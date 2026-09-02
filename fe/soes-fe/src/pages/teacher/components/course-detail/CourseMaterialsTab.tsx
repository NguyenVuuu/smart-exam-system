import { AlertCircle, CheckCircle2, Download, Upload } from 'lucide-react'
import { useState } from 'react'
import type { CourseMaterial } from '../../types/teacher-course.types'

let draftMaterialSequence = 0

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('')

const calculateChecksum = async (file: File) => {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return toHex(digest)
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const toMaterialType = (file: File): CourseMaterial['fileType'] => {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pptx') || file.type.includes('presentation')) return 'PPTX'
  if (name.endsWith('.docx') || file.type.includes('word')) return 'DOCX'
  return 'PDF'
}

export default function CourseMaterialsTab({
  courseOfferingId,
  materials,
  setMaterials,
}: {
  courseOfferingId: string
  materials: CourseMaterial[]
  setMaterials: React.Dispatch<React.SetStateAction<CourseMaterial[]>>
}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [fileMessage, setFileMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
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
      setFileMessage({ type: 'error', text: `Tệp "${duplicateFile.name}" đã tồn tại hoặc bị chọn trùng.` })
      return
    }

    setIsUploading(true)
    const existingChecksums = new Set(materials.map((material) => material.checksum).filter(Boolean))
    let hasSameContent = false
    const newMaterials = await Promise.all(
      selectedFiles.map(async (file) => {
        const checksum = await calculateChecksum(file)
        hasSameContent ||= existingChecksums.has(checksum)
        existingChecksums.add(checksum)

        const fileName = file.name.trim()
        return {
          id: `mat-draft-${++draftMaterialSequence}`,
          courseOfferingId,
          title: fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
          fileName,
          fileType: toMaterialType(file),
          fileSize: formatFileSize(file.size),
          checksum,
          storageProvider: 'SUPABASE',
          uploadedAt: 'Vừa xong',
          selectedForAI: false,
          downloadUrl: '#',
        } satisfies CourseMaterial
      }),
    )

    setMaterials([...newMaterials, ...materials])
    setSelectedFiles([])
    setIsUploading(false)
    setFileMessage(
      hasSameContent
        ? { type: 'info', text: 'Có file trùng nội dung với tài liệu đã có, hệ thống vẫn giữ riêng theo lớp.' }
        : null,
    )
  }

  const toggleSelectForAI = (id: string) => {
    setMaterials((prev) =>
      prev.map((material) => (material.id === id ? { ...material, selectedForAI: !material.selectedForAI } : material)),
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Tải Lên Tài Liệu Học Tập</h3>
          <p className="mt-1 text-sm text-gray-500">
            Hỗ trợ PDF, DOCX, PPTX. File có checksum để nhận diện trùng nội dung.
          </p>
        </div>

        {fileMessage && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl border p-3.5 text-sm font-medium ${
              fileMessage.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}
          >
            <AlertCircle size={18} className="shrink-0" />
            <span>{fileMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleUploadMaterial} className="mt-4 flex items-center gap-3">
          <label className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 transition-colors hover:border-blue-300 hover:bg-blue-50/40">
            <span className="truncate text-gray-500">
              {selectedFiles.length
                ? `${selectedFiles.length} file đã chọn: ${selectedFiles.map((file) => file.name).join(', ')}`
                : 'Chọn file PDF, DOCX hoặc PPTX...'}
            </span>
            <Upload size={18} className="shrink-0 text-blue-600" />
            <input
              type="file"
              accept=".pdf,.docx,.pptx"
              multiple
              className="hidden"
              onChange={(event) => {
                setSelectedFiles(Array.from(event.target.files ?? []))
                setFileMessage(null)
              }}
            />
          </label>
          <button
            type="submit"
            disabled={!selectedFiles.length || isUploading}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-xs transition-all hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400"
          >
            <CheckCircle2 size={18} />
            {isUploading ? 'Đang xử lý...' : 'Lưu tài liệu'}
          </button>
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
                    {material.title ?? material.fileName}
                  </span>
                </label>
                <p className="mt-1 truncate pl-7 text-xs text-gray-400">{material.fileName}</p>
              </div>

              <div className="flex shrink-0 items-center gap-4 text-sm text-gray-500">
                <span className="hidden rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 sm:inline">
                  {material.storageProvider ?? 'LOCAL'}
                </span>
                <span>{material.fileSize}</span>
                <span>{material.uploadedAt}</span>
                <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600">
                  <Download size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
