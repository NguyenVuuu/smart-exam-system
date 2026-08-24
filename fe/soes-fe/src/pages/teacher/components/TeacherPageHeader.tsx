import type { ReactNode } from 'react'

interface TeacherPageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  titleContent?: ReactNode
  icon?: ReactNode
}

export default function TeacherPageHeader({
  title,
  description,
  actions,
  titleContent,
  icon,
}: TeacherPageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        {icon && (
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
            {titleContent}
          </div>
          {description && <p className="text-sm font-medium text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>

      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  )
}
