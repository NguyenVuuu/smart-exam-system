import {
  Send,
  ShieldAlert,
  X,
} from 'lucide-react'
import { useState } from 'react'

interface SendWarningModalProps {
  isOpen: boolean
  studentName: string
  studentCode: string
  onClose: () => void
  onSend: (message: string) => void
}

const TEMPLATE_MESSAGES = [
  'Yêu cầu bạn ngồi ngay ngắn trước webcam, không quay mặt sang hướng khác.',
  'Hệ thống phát hiện chuyển tab / mất tiêu điểm màn hình. Đề nghị tập trung làm bài!',
  'Cảnh báo: Phát hiện có người khác xuất hiện trong khung hình webcam.',
  'Vui lòng bật lại chế độ toàn màn hình (Fullscreen) để tiếp tục làm bài.',
]

export default function SendWarningModal({
  isOpen,
  studentName,
  studentCode,
  onClose,
  onSend,
}: SendWarningModalProps) {
  const [warningMessage, setWarningMessage] = useState(TEMPLATE_MESSAGES[0])
  const [customInput, setCustomInput] = useState('')
  const [useCustom, setUseCustom] = useState(false)

  if (!isOpen) return null

  const handleConfirmSend = (e: React.FormEvent) => {
    e.preventDefault()
    const finalMsg = useCustom ? customInput.trim() : warningMessage
    if (!finalMsg) return
    onSend(finalMsg)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-sans">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 font-sans">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">Gửi Cảnh Báo Trực Tiếp</h3>
              <p className="text-xs text-gray-500">Tin nhắn popup sẽ hiện ngay trên màn hình thi của thí sinh</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Student Target Banner */}
        <div className="p-3 bg-gray-50 rounded-xl text-xs flex items-center justify-between">
          <span className="text-gray-500">Thí sinh nhận:</span>
          <span className="font-bold text-gray-900">
            {studentName} ({studentCode})
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleConfirmSend} className="space-y-3.5">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700">Chọn nội dung cảnh báo nhanh:</label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {TEMPLATE_MESSAGES.map((msg, idx) => (
                <label
                  key={idx}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    !useCustom && warningMessage === msg
                      ? 'bg-rose-50/70 border-rose-200 text-rose-900 font-medium'
                      : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="warningTemplate"
                    checked={!useCustom && warningMessage === msg}
                    onChange={() => {
                      setUseCustom(false)
                      setWarningMessage(msg)
                    }}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <span>{msg}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer mb-1.5">
              <input
                type="checkbox"
                checked={useCustom}
                onChange={(e) => setUseCustom(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span>Hoặc tự nhập nội dung cảnh báo riêng:</span>
            </label>
            {useCustom && (
              <textarea
                rows={3}
                required
                placeholder="Nhập nội dung nhắc nhở thí sinh..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-rose-500"
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Send size={13} /> Gửi cảnh báo ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
