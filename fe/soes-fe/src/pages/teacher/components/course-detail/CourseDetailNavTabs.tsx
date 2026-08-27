import { BookOpen, FileCheck, FileSpreadsheet, FileText, Users } from 'lucide-react'
import type { ReactNode } from 'react'

export type CourseTab = 'materials' | 'students' | 'timeline' | 'exams' | 'scores'

const TABS: Array<{ id: CourseTab; label: string; icon: ReactNode }> = [
  { id: 'materials', label: 'Tài liệu học tập & AI', icon: <FileText size={18} /> },
  { id: 'students', label: 'Danh sách sinh viên', icon: <Users size={18} /> },
  { id: 'timeline', label: 'Bảng tin lớp học', icon: <BookOpen size={18} /> },
  { id: 'exams', label: 'Bài thi & Kiểm tra', icon: <FileCheck size={18} /> },
  { id: 'scores', label: 'Bảng điểm lớp HP', icon: <FileSpreadsheet size={18} /> },
]

export default function CourseDetailNavTabs({
  activeTab,
  onChange,
}: {
  activeTab: CourseTab
  onChange: (tab: CourseTab) => void
}) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-200/80">
      {TABS.map((tab) => (
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
