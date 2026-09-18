import { Bell, ChartNoAxesColumnIncreasing, MessageSquareWarning } from 'lucide-react'
import type { ReactNode } from 'react'

export type GradeReportTab = 'reports' | 'appeals' | 'notifications'

interface GradeReportTabsProps {
  activeTab: GradeReportTab
  appealCount: number
  notificationCount: number
  onChange: (tab: GradeReportTab) => void
}

const tabs: Array<{ id: GradeReportTab; label: string; icon: ReactNode }> = [
  { id: 'reports', label: 'Kết quả & Phổ điểm', icon: <ChartNoAxesColumnIncreasing size={16} /> },
  { id: 'appeals', label: 'Phúc khảo', icon: <MessageSquareWarning size={16} /> },
  { id: 'notifications', label: 'Thông báo', icon: <Bell size={16} /> },
]

export default function GradeReportTabs({
  activeTab,
  appealCount,
  notificationCount,
  onChange,
}: GradeReportTabsProps) {
  const countFor = (tab: GradeReportTab) => {
    if (tab === 'appeals') return appealCount
    if (tab === 'notifications') return notificationCount
    return 0
  }

  return (
    <div className="flex overflow-x-auto border-b border-slate-200" role="tablist" aria-label="Kết quả và phúc khảo">
      {tabs.map((tab) => {
        const count = countFor(tab.id)
        const active = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              active ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {count > 0 && (
              <span className="min-w-5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[11px] text-blue-700">{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
