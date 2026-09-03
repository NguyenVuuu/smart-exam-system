import { Clock, FileText, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../../../api/errors'
import { getAiGenerationHistories } from '../../api/teacher-questions.api'
import type { AiGenerationHistoryDto } from '../../types/teacher-question-api.types'

interface AIGenerationHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
})

const statusStyles: Record<AiGenerationHistoryDto['status'], string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  PROCESSING: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  FAILED: 'bg-rose-50 text-rose-700',
}

const statusLabels: Record<AiGenerationHistoryDto['status'], string> = {
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  FAILED: 'Thất bại',
}

const generatedPromptPrefixes = [
  'Chỉ tạo câu hỏi trắc nghiệm',
  'Chỉ tạo câu hỏi lập trình',
  'Có thể tạo cả câu hỏi trắc nghiệm',
]

function toUserPrompt(prompt: string) {
  const lines = prompt
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !generatedPromptPrefixes.some((prefix) => line.startsWith(prefix)))
  return lines.join('\n')
}

export default function AIGenerationHistoryModal({ isOpen, onClose }: AIGenerationHistoryModalProps) {
  const [items, setItems] = useState<AiGenerationHistoryDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    let active = true
    void Promise.resolve().then(async () => {
      setLoading(true)
      setError('')
      try {
        const histories = await getAiGenerationHistories()
        if (active) setItems(histories)
      } catch (reason) {
        if (active) setError(getApiErrorMessage(reason, 'Không thể tải lịch sử AI.'))
      } finally {
        if (active) setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-xs">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col space-y-5 rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Lịch sử sinh câu hỏi bằng AI</h3>
              <p className="text-xs text-gray-500">Prompt, tài liệu, model và kết quả của các lần xử lý</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-gray-500">
              <Loader2 size={16} className="animate-spin" />
              Đang tải lịch sử...
            </div>
          )}
          {!loading && error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
              {error}
            </div>
          )}
          {!loading && !error && items.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-xs text-gray-500">
              Chưa có lần xử lý AI nào.
            </div>
          )}
          {!loading && !error && items.map((item) => {
            const userPrompt = toUserPrompt(item.prompt)

            return (
            <article key={item.id} className="space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-gray-900">
                  {item.subject.code} - {item.subject.name}
                </span>
                <span className="shrink-0 text-xs text-gray-400">
                  {dateTimeFormatter.format(new Date(item.createdAt))}
                </span>
              </div>

              <p className="text-xs font-medium text-gray-700">
                {userPrompt ? `Prompt: "${userPrompt}"` : 'Không có yêu cầu bổ sung.'}
              </p>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                  Model: {item.aiModel}
                </span>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                  Đã sinh: {item.questionCount} câu
                </span>
                <span className="rounded-md bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                  Đã lưu: {item.approvedCount} câu
                </span>
                <span className={`rounded-md px-2 py-0.5 font-semibold ${statusStyles[item.status]}`}>
                  {statusLabels[item.status]}
                </span>
              </div>

              <div className="flex items-start gap-1.5 border-t border-gray-200/60 pt-2 text-xs text-gray-500">
                <FileText size={14} className="mt-0.5 shrink-0 text-blue-600" />
                <span>Tài liệu: {item.sourceNames.join(', ') || 'Không xác định'}</span>
              </div>
              {item.errorMessage && <p className="text-xs text-rose-600">{item.errorMessage}</p>}
            </article>
            )
          })}
        </div>

        <div className="flex justify-end border-t border-gray-100 pt-2">
          <button onClick={onClose} className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200">
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
