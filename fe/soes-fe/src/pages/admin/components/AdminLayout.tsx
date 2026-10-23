import type { ReactNode } from 'react'
import AdminSidebar from './AdminSidebar'
import { useSyncBackofficePermissions } from '../../../auth/hooks/useSyncBackofficePermissions'
import AdminTopBar from './AdminTopBar'

interface AdminLayoutProps {
  children: ReactNode
  noScroll?: boolean
}

export default function AdminLayout({ children, noScroll = false }: AdminLayoutProps) {
  useSyncBackofficePermissions()
  return (
    <div className={`${noScroll ? 'fixed inset-0' : 'h-screen'} flex overflow-hidden bg-gray-50 font-sans text-slate-800`}>
      <AdminSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminTopBar />
        <main
          className={`min-h-0 min-w-0 flex-1 overflow-x-hidden px-6 py-6 lg:px-8 ${
            noScroll ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
