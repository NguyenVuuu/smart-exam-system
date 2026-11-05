import { studentNavigation } from '../../navigation/student-navigation'
import { PortalSidebar } from '../layout/PortalSidebar'

export default function StudentSidebar({ activeRoute = 'dashboard' }: { activeRoute?: string }) {
  return <PortalSidebar groups={studentNavigation} activeRoute={activeRoute} portalLabel="Sinh viên" />
}
