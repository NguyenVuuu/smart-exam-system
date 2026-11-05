import type { ReactNode } from 'react'
import { PortalLayout } from '../layout/PortalLayout'
import { studentNavigation } from '../../navigation/student-navigation'

interface Props { children: ReactNode; activeRoute?: string }

export default function StudentLayout({ children, activeRoute = 'dashboard' }: Props) {
  return <PortalLayout groups={studentNavigation} activeRoute={activeRoute} portalLabel="Sinh viên"
    notificationsHref="/(app)/(student)/notifications">{children}</PortalLayout>
}
