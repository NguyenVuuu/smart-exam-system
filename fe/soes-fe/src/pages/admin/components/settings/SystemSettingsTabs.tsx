import { Bot, Building2, Hash, PlugZap, ShieldCheck } from 'lucide-react'
import type { SystemSettingsTab } from '../../types/admin-system-settings.types'

const tabs: Array<{ id: SystemSettingsTab; label: string; icon: typeof Building2 }> = [
  { id: 'GENERAL', label: 'Thông tin đơn vị', icon: Building2 },
  { id: 'EXAM_DEFAULTS', label: 'Quy tắc thi mặc định', icon: ShieldCheck },
  { id: 'CODE_GENERATION', label: 'Định dạng mã tài khoản', icon: Hash },
  { id: 'AI', label: 'Cấu hình Trợ lý AI', icon: Bot },
  { id: 'INTEGRATIONS', label: 'Trạng thái hạ tầng', icon: PlugZap },
]

export default function SystemSettingsTabs({
  value,
  onChange,
}: {
  value: SystemSettingsTab
  onChange: (value: SystemSettingsTab) => void
}) {
  return (
    <div className="flex overflow-x-auto gap-1" role="tablist">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          onClick={() => onChange(id)}
          className={`inline-flex h-12 shrink-0 items-center gap-2 border-b-2 px-3 sm:px-4 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            value === id
              ? 'border-emerald-600 bg-white text-emerald-700 shadow-2xs font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Icon size={16} />
          {label}
        </button>
      ))}
    </div>
  )
}

