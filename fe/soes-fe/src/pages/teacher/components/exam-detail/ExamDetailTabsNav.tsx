import { CalendarClock, Clock, FileCheck, ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'

export type ExamDetailTab = 'sessions' | 'overview' | 'submissions' | 'proctoring'

const detailTabs: Array<{
  id: ExamDetailTab
  label: string
  icon: ReactNode
}> = [
  { id: 'sessions', label: 'Ca thi / Lớp áp dụng', icon: <CalendarClock size={18} /> },
  { id: 'proctoring', label: 'Giám sát Real-time & Bằng chứng Webcam', icon: <ShieldAlert size={18} /> },
  { id: 'submissions', label: 'Bài nộp & Phúc khảo', icon: <FileCheck size={18} /> },
  { id: 'overview', label: 'Tổng quan cài đặt', icon: <Clock size={18} /> },
]

export function ExamDetailTabs({
  activeTab,
  onChange,
}: {
  activeTab: ExamDetailTab
  onChange: (tab: ExamDetailTab) => void
}) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-200/80">
      {detailTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === tab.id
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
