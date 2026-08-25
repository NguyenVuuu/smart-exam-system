import type { ReactNode } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminTopBar from './AdminTopBar'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-slate-800">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar />
        <main className="min-w-0 flex-1 overflow-x-hidden px-6 py-7 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
