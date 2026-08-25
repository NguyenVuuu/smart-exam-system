import type { ReactNode } from 'react'

interface AdminPageHeaderProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export default function AdminPageHeader({
  icon,
  title,
  description,
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className="text-[18px] font-semibold leading-[22.5px] text-slate-950">
            {title}
          </h1>
          <p className="mt-1 text-[13px] font-normal leading-[19.5px] text-slate-500">
            {description}
          </p>
        </div>
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
