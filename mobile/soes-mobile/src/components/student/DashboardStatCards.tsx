import { View, Text } from 'react-native'
import type { StatCard } from '../../types/dashboard.types'

const CONFIGS = {
  subject:  { emoji: '📖', bg: '#eff6ff', accent: '#2563eb', label_color: '#1d4ed8' },
  exam:     { emoji: '📋', bg: '#fefce8', accent: '#ca8a04', label_color: '#a16207' },
  gpa:      { emoji: '📊', bg: '#f0fdf4', accent: '#16a34a', label_color: '#15803d' },
  upcoming: { emoji: '🗓️', bg: '#fdf4ff', accent: '#9333ea', label_color: '#7e22ce' },
}

export default function DashboardStatCards({ cards }: { cards: StatCard[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
      {cards.map((card) => {
        const cfg = CONFIGS[card.icon]
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
              <Text style={{ fontSize: 20 }}>{cfg.emoji}</Text>
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
