import type { ReactNode } from 'react'

interface TeacherPageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  titleContent?: ReactNode
}

export default function TeacherPageHeader({
  title,
  description,
  actions,
  titleContent,
}: TeacherPageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
          {titleContent}
        </div>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
