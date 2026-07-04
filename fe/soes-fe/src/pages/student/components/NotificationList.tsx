import { Bell } from 'lucide-react'
import type { NotificationDotColor, NotificationItem } from '../types/dashboard.types'

const DOT_COLOR: Record<NotificationDotColor, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
}

interface NotificationListProps {
  notifications: NotificationItem[]
}

export default function NotificationList({ notifications }: NotificationListProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex-1">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
        <Bell size={15} className="text-gray-400" />
        Thông báo
      </h3>

      <ul className="space-y-2.5">
        {notifications.map((notif) => (
          <li key={notif.id} className="flex items-center gap-2.5 text-sm text-gray-700">
            <span className={`w-2 h-2 rounded-full shrink-0 ${DOT_COLOR[notif.dot]}`} />
            <span>{notif.message}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
