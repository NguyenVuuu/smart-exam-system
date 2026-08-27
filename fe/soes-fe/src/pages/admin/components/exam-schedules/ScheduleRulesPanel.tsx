import { Eye, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'

interface ScheduleRulesPanelProps {
  allowStudentReview: boolean
  requireFullscreen: boolean
  enableWebcam: boolean
  blockCopyPaste: boolean
  blockRightClick: boolean
  onAllowStudentReviewChange: (checked: boolean) => void
  onRequireFullscreenChange: (checked: boolean) => void
  onEnableWebcamChange: (checked: boolean) => void
  onBlockCopyPasteChange: (checked: boolean) => void
  onBlockRightClickChange: (checked: boolean) => void
}

export default function ScheduleRulesPanel({
  allowStudentReview,
  requireFullscreen,
  enableWebcam,
  blockCopyPaste,
  blockRightClick,
  onAllowStudentReviewChange,
  onRequireFullscreenChange,
  onEnableWebcamChange,
  onBlockCopyPasteChange,
  onBlockRightClickChange,
}: ScheduleRulesPanelProps) {
  return (
    <div className="lg:col-span-2">
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-4">
          <SectionTitle icon={<ShieldCheck size={16} className="text-emerald-600" />} title="Quy định thi cuối kỳ" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <AdminToggle checked={requireFullscreen} onChange={onRequireFullscreenChange} label="Bắt buộc toàn màn hình" />
            <AdminToggle checked={enableWebcam} onChange={onEnableWebcamChange} label="Giám sát webcam" />
            <AdminToggle checked={blockCopyPaste} onChange={onBlockCopyPasteChange} label="Chặn copy/paste" />
            <AdminToggle checked={blockRightClick} onChange={onBlockRightClickChange} label="Chặn chuột phải" />
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-4">
          <SectionTitle icon={<Eye size={16} className="text-emerald-600" />} title="Xem lại bài làm" />
          <AdminToggle
            checked={allowStudentReview}
            onChange={onAllowStudentReviewChange}
            label="Cho phép sinh viên xem lại bài sau khi điểm được công bố"
          />
          <p className="text-[13px] leading-[19px] text-slate-500">
            Điểm và quyền xem lại bài là hai cấu hình riêng của từng ca thi.
          </p>
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
    <label className="flex cursor-pointer select-none items-center gap-2 text-sm font-normal text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-gray-300 accent-emerald-600"
      />
      <span>{label}</span>
    </label>
  )
}
