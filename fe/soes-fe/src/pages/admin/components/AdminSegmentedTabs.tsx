interface AdminSegmentedTabsProps<T extends string> {
  value: T
  tabs: Array<{ value: T; label: string }>
  onChange: (value: T) => void
  className?: string
}

export default function AdminSegmentedTabs<T extends string>({
  value,
  tabs,
  onChange,
  className = '',
}: AdminSegmentedTabsProps<T>) {
  return (
    <div className={`inline-flex rounded-full bg-white p-1 shadow-sm ring-1 ring-gray-100 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`min-w-32 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
            value === tab.value
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
              : 'text-slate-700 hover:bg-gray-50 hover:text-slate-950'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
