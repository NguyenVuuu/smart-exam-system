export type CourseTab = 'timeline' | 'members' | 'scores'

interface CourseTabsProps {
  activeTab: CourseTab
  onTabChange: (tab: CourseTab) => void
}

const TABS: { key: CourseTab; label: string }[] = [
  { key: 'timeline', label: 'Bài đăng' },
  { key: 'members', label: 'Thành viên' },
  { key: 'scores', label: 'Điểm' },
]

export default function CourseTabs({ activeTab, onTabChange }: CourseTabsProps) {
  return (
    <div className="flex gap-1 border-b border-gray-200 mb-5">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === tab.key
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
