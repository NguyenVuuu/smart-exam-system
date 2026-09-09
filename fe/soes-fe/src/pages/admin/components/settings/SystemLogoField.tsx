import { Image, RotateCcw, Trash2, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const ALLOWED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024

export interface SystemLogoFieldProps {
  savedLogoUrl: string
  selectedFile: File | null
  isRemoved: boolean
  onFileSelect: (file: File) => void
  onRemoveLogo: () => void
  onRevertLogo: () => void
  disabled?: boolean
}

function validateLogo(file: File): string | null {
  if (!ALLOWED_LOGO_TYPES.has(file.type)) return 'Logo chỉ hỗ trợ định dạng PNG, JPG hoặc WebP.'
  if (file.size > MAX_LOGO_SIZE_BYTES) return 'Logo có kích thước tối đa 2MB.'
  return null
}

export default function SystemLogoField({
  savedLogoUrl,
  selectedFile,
  isRemoved,
  onFileSelect,
  onRemoveLogo,
  onRevertLogo,
  disabled = false,
}: SystemLogoFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreviewUrl(null)
  }, [selectedFile])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const validationMessage = validateLogo(file)
    if (validationMessage) {
      toast.error(validationMessage)
      return
    }

    onFileSelect(file)
  }

  // Determine active display logo
  const displayLogoUrl = previewUrl || (!isRemoved ? savedLogoUrl : '')
  const hasChanges = Boolean(selectedFile || isRemoved)

  return (
    <div className="space-y-3">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Image size={14} className="text-emerald-600" />
          Logo hệ thống
        </p>
        <p className="mt-0.5 text-xs text-slate-500">Hiển thị trên trang đăng nhập, thanh điều hướng và tiêu đề trình duyệt.</p>
      </div>

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        {/* Logo Preview Box */}
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-slate-50 shadow-2xs">
          {displayLogoUrl ? (
            <img src={displayLogoUrl} alt="Logo xem trước" className="h-full w-full object-contain p-2" />
          ) : (
            <span className="text-2xl font-bold text-emerald-600">S</span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <label
              className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-gray-50 transition-colors ${
                disabled ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              <Upload size={14} />
              {selectedFile ? 'Đổi ảnh khác' : 'Chọn ảnh logo'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={disabled}
                onChange={handleFileChange}
              />
            </label>

            {/* If user picked a new file or marked as removed, allow reverting to saved logo */}
            {hasChanges && (
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-60 cursor-pointer"
                disabled={disabled}
                onClick={onRevertLogo}
              >
                <RotateCcw size={14} />
                Khôi phục ảnh cũ
              </button>
            )}

            {/* If has saved logo and haven't removed it yet, allow remove */}
            {!selectedFile && savedLogoUrl && !isRemoved && (
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-60 cursor-pointer"
                disabled={disabled}
                onClick={onRemoveLogo}
              >
                <Trash2 size={14} />
                Xóa logo
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-400">
            Định dạng PNG, JPG hoặc WebP (tối đa 2MB).
          </p>
        </div>
      </div>
    </div>
  )
}
