import { FileText, X } from 'lucide-react'

interface FileSelectionListProps {
  files: File[]
  onRemove: (index: number) => void
  onClear?: () => void
  className?: string
}

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export default function FileSelectionList({ files, onRemove, onClear, className = '' }: FileSelectionListProps) {
  if (!files.length) return null

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-gray-600">{files.length} file đã chọn</span>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-gray-400 transition-colors hover:text-rose-600"
          >
            Bỏ tất cả
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {files.map((file, index) => (
          <div
            key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
            className="flex min-h-10 items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs"
          >
            <FileText size={15} className="shrink-0 text-blue-600" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-gray-800">{file.name}</p>
              <p className="text-gray-400">{formatFileSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(index)}
              title="Bỏ file"
              aria-label={`Bỏ file ${file.name}`}
              className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
