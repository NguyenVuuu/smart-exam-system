import { BarChart2, BookOpen, CalendarClock, ClipboardList } from 'lucide-react'
import type { StatCard } from '../types/dashboard.types'

const ICON_MAP = {
  subject: { icon: <BookOpen size={20} />, bg: 'bg-blue-50', color: 'text-blue-500' },
  exam: { icon: <ClipboardList size={20} />, bg: 'bg-yellow-50', color: 'text-yellow-500' },
  gpa: { icon: <BarChart2 size={20} />, bg: 'bg-green-50', color: 'text-green-500' },
  upcoming: { icon: <CalendarClock size={20} />, bg: 'bg-pink-50', color: 'text-pink-500' },
}

interface DashboardStatCardsProps {
  cards: StatCard[]
}

export default function DashboardStatCards({ cards }: DashboardStatCardsProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const { icon, bg, color } = ICON_MAP[card.icon]
        return (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4"
          >
            <div className={`${bg} ${color} p-2.5 rounded-lg`}>{icon}</div>
            <div>
              <p className="text-xs text-gray-400">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 leading-tight">{card.value}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
