import { AlertTriangle, Eye, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'

interface ScheduleRulesPanelProps {
  allowStudentReview: boolean
  enableTabLock: boolean
  maxTabSwitches: number
  requireFullscreen: boolean
  enableWebcam: boolean
  enableScreenMonitoring: boolean
  blockCopyPaste: boolean
  blockRightClick: boolean
  onAllowStudentReviewChange: (checked: boolean) => void
  onEnableTabLockChange: (checked: boolean) => void
  onMaxTabSwitchesChange: (count: number) => void
  onRequireFullscreenChange: (checked: boolean) => void
  onEnableWebcamChange: (checked: boolean) => void
  onEnableScreenMonitoringChange: (checked: boolean) => void
  onBlockCopyPasteChange: (checked: boolean) => void
  onBlockRightClickChange: (checked: boolean) => void
}

export default function ScheduleRulesPanel({
  allowStudentReview,
  enableTabLock,
  maxTabSwitches,
  requireFullscreen,
  enableWebcam,
  enableScreenMonitoring,
  blockCopyPaste,
  blockRightClick,
  onAllowStudentReviewChange,
  onEnableTabLockChange,
  onMaxTabSwitchesChange,
  onRequireFullscreenChange,
  onEnableWebcamChange,
  onEnableScreenMonitoringChange,
  onBlockCopyPasteChange,
  onBlockRightClickChange,
}: ScheduleRulesPanelProps) {
  return (
    <div className="lg:col-span-2 space-y-4">
      {/* Khối Quy định thi cuối kỳ */}
      <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-2xs space-y-3">
        <SectionTitle icon={<ShieldCheck size={16} className="text-emerald-600" />} title="Quy định thi cuối kỳ" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AdminToggle checked={requireFullscreen} onChange={onRequireFullscreenChange} label="Bắt buộc toàn màn hình" />
          <AdminToggle checked={enableWebcam} onChange={onEnableWebcamChange} label="Giám sát webcam" />
          <AdminToggle checked={enableScreenMonitoring} onChange={onEnableScreenMonitoringChange} label="Giám sát màn hình" />
          <AdminToggle checked={enableTabLock} onChange={onEnableTabLockChange} label="Theo dõi chuyển tab" />
          <AdminToggle checked={blockCopyPaste} onChange={onBlockCopyPasteChange} label="Chặn copy/paste" />
          <AdminToggle checked={blockRightClick} onChange={onBlockRightClickChange} label="Chặn chuột phải" />
        </div>

        {enableTabLock && (
          <div className="flex items-center gap-2 pt-2.5 border-t border-gray-100 text-xs text-slate-700">
            <span className="flex items-center gap-1.5 font-medium">
              <AlertTriangle size={14} className="text-amber-600" />
              Số lần chuyển tab tối đa:
            </span>
            <input
              type="number"
              min={1}
              max={20}
              value={maxTabSwitches}
              onChange={(e) => onMaxTabSwitchesChange(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 h-8 px-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-center outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-slate-500">lần cảnh báo</span>
          </div>
        )}
      </div>

      {/* Khối Xem lại bài làm */}
      <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-2xs space-y-2">
        <SectionTitle icon={<Eye size={16} className="text-emerald-600" />} title="Xem lại bài làm" />
        <div className="pt-1">
          <AdminToggle
            checked={allowStudentReview}
            onChange={onAllowStudentReviewChange}
            label="Cho phép sinh viên xem lại bài sau khi điểm được công bố"
          />
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
      {icon}
      <span>{title}</span>
    </div>
  )
}

function AdminToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-gray-300 accent-emerald-600 cursor-pointer"
      />
      <span>{label}</span>
    </label>
  )
}
