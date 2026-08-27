import { AlertCircle, Download, Upload } from 'lucide-react'
import { useState } from 'react'
import type { CourseMaterial } from '../../types/teacher-course.types'

let draftMaterialSequence = 0

export default function CourseMaterialsTab({
  courseOfferingId,
  materials,
  setMaterials,
}: {
  courseOfferingId: string
  materials: CourseMaterial[]
  setMaterials: React.Dispatch<React.SetStateAction<CourseMaterial[]>>
}) {
  const [fileNameInput, setFileNameInput] = useState('')
  const [fileTypeError, setFileTypeError] = useState<string | null>(null)

  const handleUploadMaterial = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fileNameInput.trim()) return

    const isDuplicate = materials.some(
      (m) => m.fileName.toLowerCase() === fileNameInput.trim().toLowerCase(),
    )

    if (isDuplicate) {
      setFileTypeError(`Tệp "${fileNameInput}" đã tồn tại trong lớp HP này! Vui lòng đổi tên tệp.`)
      return
    }

    setFileTypeError(null)
    const newMat: CourseMaterial = {
      id: `mat-draft-${++draftMaterialSequence}`,
      courseOfferingId,
      fileName: fileNameInput.trim(),
      fileType: 'PDF',
      fileSize: '3.5 MB',
      uploadedAt: 'Vừa xong',
      selectedForAI: false,
      downloadUrl: '#',
    }

    setMaterials([newMat, ...materials])
    setFileNameInput('')
  }

  const toggleSelectForAI = (id: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, selectedForAI: !m.selectedForAI } : m)),
    )
  }

  return (
    <div className="space-y-5">
      {/* Upload Form */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Tải Lên Tài Liệu Học Tập</h3>
          <p className="text-sm text-gray-500 mt-1">
            Hỗ trợ PDF, DOCX, PPTX. Tự động kiểm tra trùng tên tệp trong lớp học phần.
          </p>
        </div>

        {fileTypeError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{fileTypeError}</span>
          </div>
        )}

        <form onSubmit={handleUploadMaterial} className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Nhập tên tệp (Ví dụ: Chuong_3_Mang_Doi_Tuong.pdf)..."
            value={fileNameInput}
            onChange={(e) => setFileNameInput(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-gray-800 placeholder:text-gray-400"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0"
          >
            <Upload size={18} />
            Tải lên tài liệu
          </button>
        </form>
      </div>

      {/* Material List with Checkbox for AI */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Danh Sách Tài Liệu & Lựa Chọn Cho AI</h3>
          <span className="text-sm text-blue-700 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
            {materials.filter((m) => m.selectedForAI).length} / {materials.length} tệp đã chọn cho AI
          </span>
        </div>

        <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mat.selectedForAI}
                    onChange={() => toggleSelectForAI(mat.id)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-900 hover:text-blue-600">
                    {mat.fileName}
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-5 text-sm text-gray-500">
                <span>{mat.fileSize}</span>
                <span>{mat.uploadedAt}</span>
                <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50">
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
