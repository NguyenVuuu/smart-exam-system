import type { ReactNode } from 'react'

export function TeacherTwoColumnLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] items-start gap-5">
      {children}
    </div>
  )
}

export function TeacherTwoColumnMain({ children }: { children: ReactNode }) {
  return <section className="min-w-0 w-full space-y-4">{children}</section>
}
