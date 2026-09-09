import { Bot, Cpu, Info, Layers, Save, Sparkles, Timer } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '../../../../api/errors'
import { updateAiSettings } from '../../api/admin-system-settings.api'
import type { AdminSystemSettings } from '../../types/admin-system-settings.types'
import AdminButton from '../AdminButton'

const PRESET_MODELS = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    tag: 'Khuyên dùng',
    badge: 'Khuyên dùng cho SOES',
    description: 'Phản hồi cực nhanh, tối ưu chi phí token và rất phù hợp để trích xuất & sinh câu hỏi trắc nghiệm.',
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    tag: 'Mới nhất',
    badge: 'Tốc độ & Thông minh',
    description: 'Mô hình Flash thế hệ mới nhất của Google, độ chính xác cao và xử lý văn bản phức tạp.',
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    tag: 'Hiệu năng cao',
    badge: 'Ổn định',
    description: 'Phiên bản cân bằng hiệu năng và suy luận logic đa ngữ cảnh.',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    tag: 'Chuyên sâu',
    badge: 'Nâng cao',
    description: 'Mô hình suy luận mạnh nhất cho các bài toán lập trình, sinh bộ ca kiểm thử (testcases) và tự luận chuyên sâu.',
  },
]

export default function AiSettingsPanel({
  settings,
  onUpdated,
}: {
  settings: AdminSystemSettings['ai']
  onUpdated: () => void
}) {
  const initialModel = settings.model || 'gemini-3.1-flash-lite'
  const initialModelIsCustom = !PRESET_MODELS.some(({ id }) => id === initialModel)
  const [model, setModel] = useState(initialModel)
  const [customModel, setCustomModel] = useState(initialModelIsCustom ? initialModel : '')
  const [isCustom, setIsCustom] = useState(initialModelIsCustom)
  const [maxQuestions, setMaxQuestions] = useState(settings.maxQuestionsPerRun)
  const [timeoutSeconds, setTimeoutSeconds] = useState(settings.timeoutSeconds)
  const [saving, setSaving] = useState(false)

  const handleSelectModel = (val: string) => {
    if (val === 'CUSTOM') {
      setIsCustom(true)
    } else {
      setIsCustom(false)
      setModel(val)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const activeModel = isCustom ? customModel.trim() || model : model
    try {
      await updateAiSettings({
        model: activeModel,
        maxQuestionsPerRun: maxQuestions,
        timeoutSeconds,
      })
      toast.success('Đã lưu cấu hình Trợ lý AI (Gemini) thành công')
      onUpdated()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể lưu cấu hình AI. Vui lòng thử lại.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="flex items-start gap-3.5 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 mt-0.5">
          <Sparkles size={18} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            Quản trị Mô hình Ngôn ngữ Lớn (LLM - Google Gemini Engine)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Hệ thống SOES ứng dụng Google Gemini để phân tích giáo trình, tài liệu PDF/Word và sinh câu hỏi trắc nghiệm, tự luận, lập trình tự động. Bạn có thể chọn mô hình, giới hạn số câu và thời gian chờ bên dưới.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Cpu size={14} className="text-blue-600" />
            Phiên bản Mô hình Gemini (Active Model)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESET_MODELS.map((item) => {
              const selected = !isCustom && model === item.id
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleSelectModel(item.id)}
                  className={`p-4 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    selected
                      ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900 tracking-tight">{item.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap shrink-0 ${
                        selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block shrink-0" />
                    <span className="truncate">Mã: <code>{item.id}</code></span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-2 flex items-center gap-3">
            <label className="text-xs text-slate-600 flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCustom}
                onChange={(e) => {
                  setIsCustom(e.target.checked)
                  if (e.target.checked && !customModel) setCustomModel(model)
                }}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span>Tùy chỉnh mã định danh model khác (Custom Model ID)</span>
            </label>
            {isCustom && (
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="VD: gemini-3.1-flash-lite hoặc gemini-3.6-flash"
                className="h-9 flex-1 max-w-sm rounded-xl border border-gray-200 bg-white px-3 text-xs font-mono text-slate-800 outline-none focus:border-blue-500"
              />
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-gray-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Layers size={17} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Giới hạn sinh câu hỏi & Thời gian chờ</p>
              <p className="text-xs text-slate-500">Bảo vệ tài nguyên server và tránh treo tiến trình</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Bot size={13} className="text-blue-600" />
                Số câu tối đa / lần sinh
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={maxQuestions}
                onChange={(e) => setMaxQuestions(parseInt(e.target.value) || 50)}
                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500"
              />
              <p className="text-[10.5px] text-slate-400">Khuyên dùng: 20 - 50 câu</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Timer size={13} className="text-blue-600" />
                Thời gian chờ tối đa (giây)
              </label>
              <input
                type="number"
                min={10}
                max={600}
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(parseInt(e.target.value) || 120)}
                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500"
              />
              <p className="text-[10.5px] text-slate-400">Khuyên dùng: 60s - 180s</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11.5px] text-slate-600 flex items-center gap-2">
            <Info size={14} className="text-blue-600 shrink-0" />
            <span>Nhà cung cấp: <strong>Google AI Studio (Gemini Engine)</strong>. Hệ thống tự động áp dụng độ chính xác tối ưu để bám sát nội dung tài liệu.</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <AdminButton
          type="submit"
          tone="primary"
          icon={<Save size={16} />}
          disabled={saving}
        >
          {saving ? 'Đang lưu cấu hình AI...' : 'Lưu cấu hình Trợ lý AI'}
        </AdminButton>
      </div>
    </form>
  )
}
