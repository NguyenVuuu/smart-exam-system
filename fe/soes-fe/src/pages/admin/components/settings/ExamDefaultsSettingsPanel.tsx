import { Camera, CopySlash, Lock, Monitor, MonitorUp, MousePointer, Save, Wifi } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '../../../../api/errors'
import { updateExamDefaultsSettings } from '../../api/admin-system-settings.api'
import type { ExamDefaultsSettings } from '../../types/admin-system-settings.types'
import AdminButton from '../AdminButton'

const HEARTBEAT_TIMEOUT_MIN_SECONDS = 10
const HEARTBEAT_TIMEOUT_MAX_SECONDS = 300

function getHeartbeatTimeoutError(value: string): string | null {
  if (value.trim() === '') return 'Vui lòng nhập ngưỡng timeout.'

  const seconds = Number(value)
  if (!Number.isInteger(seconds)) return 'Ngưỡng timeout phải là số nguyên.'
  if (seconds < HEARTBEAT_TIMEOUT_MIN_SECONDS || seconds > HEARTBEAT_TIMEOUT_MAX_SECONDS) {
    return `Ngưỡng timeout phải từ ${HEARTBEAT_TIMEOUT_MIN_SECONDS} đến ${HEARTBEAT_TIMEOUT_MAX_SECONDS} giây.`
  }

  return null
}

export default function ExamDefaultsSettingsPanel({
  settings,
  onUpdated,
}: {
  settings: ExamDefaultsSettings
  onUpdated: () => void
}) {
  const [form, setForm] = useState<ExamDefaultsSettings>(settings)
  const [heartbeatTimeoutInput, setHeartbeatTimeoutInput] = useState(String(settings.heartbeatTimeoutSeconds))
  const [heartbeatTimeoutTouched, setHeartbeatTimeoutTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const heartbeatTimeoutError = getHeartbeatTimeoutError(heartbeatTimeoutInput)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setHeartbeatTimeoutTouched(true)
    if (heartbeatTimeoutError) return

    setSaving(true)
    try {
      await updateExamDefaultsSettings({
        ...form,
        heartbeatTimeoutSeconds: Number(heartbeatTimeoutInput),
      })
      toast.success('Đã lưu quy tắc thi & an ninh mặc định thành công')
      onUpdated()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể lưu quy tắc thi. Vui lòng kiểm tra lại.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ToggleCard
          icon={<Lock size={18} className="text-amber-600" />}
          title="Theo dõi chuyển tab & ứng dụng ngoài"
          description="Phát hiện và cảnh báo khi thí sinh rời màn hình làm bài hoặc chuyển sang tab khác."
          checked={form.enableTabLock}
          onChange={(checked) => setForm({ ...form, enableTabLock: checked })}
        />

        <ToggleCard
          icon={<Monitor size={18} className="text-blue-600" />}
          title="Bắt buộc chế độ Toàn màn hình (Fullscreen)"
          description="Yêu cầu sinh viên bật Fullscreen trước khi bắt đầu và trong suốt quá trình làm bài."
          checked={form.requireFullscreen}
          onChange={(checked) => setForm({ ...form, requireFullscreen: checked })}
        />

        <ToggleCard
          icon={<Camera size={18} className="text-emerald-600" />}
          title="Bật Giám sát Camera & AI nhận diện"
          description="Bật webcam để AI quét khuôn mặt, phát hiện nhiều người hoặc quay mặt khỏi màn hình."
          checked={form.enableWebcam}
          onChange={(checked) => setForm({ ...form, enableWebcam: checked })}
        />

        <ToggleCard
          icon={<MonitorUp size={18} className="text-cyan-600" />}
          title="Giám sát màn hình trực tiếp"
          description="Yêu cầu chia sẻ toàn bộ màn hình để giảng viên theo dõi trong thời gian thi."
          checked={form.enableScreenMonitoring}
          onChange={(checked) => setForm({ ...form, enableScreenMonitoring: checked })}
        />

        <ToggleCard
          icon={<CopySlash size={18} className="text-rose-600" />}
          title="Chặn Sao chép & Dán (Copy / Paste)"
          description="Vô hiệu hóa phím tắt Ctrl+C, Ctrl+V, Ctrl+X trong khung làm bài thi trắc nghiệm và tự luận."
          checked={form.blockCopyPaste}
          onChange={(checked) => setForm({ ...form, blockCopyPaste: checked })}
        />

        <ToggleCard
          icon={<MousePointer size={18} className="text-purple-600" />}
          title="Chặn Chuột phải & Inspect Element"
          description="Ngăn chặn mở Context Menu chuột phải và phím tắt F12 kiểm tra mã nguồn."
          checked={form.blockRightClick}
          onChange={(checked) => setForm({ ...form, blockRightClick: checked })}
        />

        <div className="flex flex-col justify-between gap-2 rounded-lg border border-gray-200/80 bg-white p-4 shadow-2xs md:col-span-2">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
              <Wifi size={17} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Ngưỡng Timeout Heartbeat mất kết nối</p>
              <p className="text-xs text-slate-500 mt-0.5">Thời gian không nhận được tín hiệu ping từ máy thí sinh trước khi chuyển sang trạng thái "Mất kết nối".</p>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={HEARTBEAT_TIMEOUT_MIN_SECONDS}
                max={HEARTBEAT_TIMEOUT_MAX_SECONDS}
                step={5}
                value={heartbeatTimeoutInput}
                onBlur={() => setHeartbeatTimeoutTouched(true)}
                onChange={(e) => setHeartbeatTimeoutInput(e.target.value)}
                aria-invalid={heartbeatTimeoutTouched && Boolean(heartbeatTimeoutError)}
                aria-describedby={heartbeatTimeoutError ? 'heartbeat-timeout-error' : undefined}
                className={`w-24 h-9 px-3 rounded-lg border bg-white text-sm font-semibold text-slate-900 text-center outline-none focus:ring-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  heartbeatTimeoutTouched && heartbeatTimeoutError
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-100'
                }`}
              />
              <span className="text-xs font-medium text-slate-600">giây (Khuyến nghị: 30 - 60s)</span>
            </div>
            {heartbeatTimeoutTouched && heartbeatTimeoutError && (
              <p id="heartbeat-timeout-error" className="mt-1.5 text-xs font-medium text-red-600">
                {heartbeatTimeoutError}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
        <AdminButton
          type="submit"
          icon={<Save size={16} />}
          disabled={saving}
        >
          {saving ? 'Đang lưu...' : 'Lưu quy tắc thi mặc định'}
        </AdminButton>
      </div>
    </form>
  )
}

function ToggleCard({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex cursor-pointer select-none items-start justify-between gap-4 rounded-lg border p-4 transition-all ${
        checked
          ? 'border-emerald-200 bg-emerald-50/25 hover:bg-emerald-50/40 shadow-2xs'
          : 'border-gray-200/80 bg-white hover:bg-gray-50/70 shadow-2xs'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="relative inline-flex items-center shrink-0 mt-1">
        <div
          className={`w-11 h-6 rounded-full transition-colors ${
            checked ? 'bg-emerald-600' : 'bg-gray-200'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform mt-1 ml-1 shadow-sm ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </div>
      </div>
    </button>
  )
}
