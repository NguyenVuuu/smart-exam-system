import { View, Text } from 'react-native'
import { BookOpen, CalendarDays, ChartNoAxesColumn, ClipboardList } from 'lucide-react-native'
import type { StatCard } from '../../types/dashboard.types'

const CONFIGS = {
  subject:  { icon: BookOpen, bg: '#eff6ff', accent: '#2563eb' },
  exam:     { icon: ClipboardList, bg: '#fefce8', accent: '#ca8a04' },
  gpa:      { icon: ChartNoAxesColumn, bg: '#f0fdf4', accent: '#16a34a' },
  upcoming: { icon: CalendarDays, bg: '#fdf4ff', accent: '#9333ea' },
}

export default function DashboardStatCards({ cards }: { cards: StatCard[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
      {cards.map((card) => {
        const cfg = CONFIGS[card.icon]
        const Icon = cfg.icon
        return (
          <View
            key={card.label}
            style={{
              flex: 1, minWidth: 130,
              backgroundColor: '#fff',
              borderRadius: 14,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              borderWidth: 1,
              borderColor: '#f1f5f9',
            }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={21} color={cfg.accent} />
            </View>
            <View>
              <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '500', marginBottom: 2 }}>{card.label}</Text>
              <Text style={{ fontSize: 26, fontWeight: '800', color: '#0f172a', lineHeight: 30 }}>{card.value}</Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}
