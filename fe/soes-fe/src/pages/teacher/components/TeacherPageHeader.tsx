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
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-[18px] font-semibold leading-[22.5px] text-slate-950">{title}</h1>
            {titleContent}
          </div>
          {description && (
            <p className="mt-1 text-[13px] font-normal leading-[19.5px] text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
    </div>
  )
}
