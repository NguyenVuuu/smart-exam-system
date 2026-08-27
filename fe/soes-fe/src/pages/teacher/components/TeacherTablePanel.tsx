import type { ReactNode } from 'react'

export default function TeacherTablePanel({ children }: { children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {children}
    </section>
  )
}
