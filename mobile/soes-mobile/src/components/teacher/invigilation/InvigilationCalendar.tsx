import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { listInvigilationMonth } from '../../../api/teacher-invigilation.api'
import type { InvigilationAssignment } from '../../../types/teacher-invigilation.types'
import { ScreenState } from '../../ui/ScreenState'
import { InvigilationCard } from './InvigilationCard'

const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

export function InvigilationCalendar() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selected, setSelected] = useState(() => dayKey(new Date()))
  const [items, setItems] = useState<InvigilationAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    listInvigilationMonth(month).then((next) => { if (active) { setItems(next); setError(false) } })
      .catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [month, retry])

  const startOffset = (month.getDay() + 6) % 7
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((startOffset + daysInMonth) / 7) * 7 }, (_, index) => index - startOffset + 1)
  const itemsByDay = useMemo(() => {
    const grouped = new Map<string, InvigilationAssignment[]>()
    items.forEach((item) => {
      const key = dayKey(new Date(item.startTime))
      grouped.set(key, [...(grouped.get(key) ?? []), item])
    })
    return grouped
  }, [items])
  const dayItems = itemsByDay.get(selected) ?? []

  function moveMonth(delta: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1)
    setMonth(next); setSelected(dayKey(next)); setLoading(true)
  }

  return <ScrollView contentContainerStyle={styles.content}>
    <View style={styles.calendar}>
      <View style={styles.toolbar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Tháng trước" onPress={() => moveMonth(-1)} style={styles.arrow}><ChevronLeft size={19} color="#334155" /></Pressable>
        <Text style={styles.month}>Tháng {month.getMonth() + 1}/{month.getFullYear()}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Tháng sau" onPress={() => moveMonth(1)} style={styles.arrow}><ChevronRight size={19} color="#334155" /></Pressable>
      </View>
      <View style={styles.grid}>{weekdays.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}
        {cells.map((day, index) => {
          if (day < 1 || day > daysInMonth) return <View key={index} style={styles.cell} />
          const key = dayKey(new Date(month.getFullYear(), month.getMonth(), day))
          const count = itemsByDay.get(key)?.length ?? 0
          return <Pressable key={index} accessibilityRole="button" accessibilityLabel={`Ngày ${day}, ${count} ca coi thi`}
            accessibilityState={{ selected: selected === key }} onPress={() => setSelected(key)} style={[styles.cell, selected === key && styles.activeCell]}>
            <Text style={[styles.day, selected === key && styles.activeDay]}>{day}</Text>
            {count > 0 && <View style={[styles.dot, selected === key && styles.activeDot]} />}
          </Pressable>
        })}</View>
    </View>
    <Text style={styles.dayHeading}>Ngày {selected.split('-')[2]} · {dayItems.length} ca coi thi</Text>
    {loading ? <ScreenState kind="loading" /> : error ? <ScreenState kind="error" onRetry={() => { setLoading(true); setRetry((value) => value + 1) }} /> :
      dayItems.length ? dayItems.map((item) => <InvigilationCard key={item.id} assignment={item} />) :
        <Text style={styles.empty}>Ngày này chưa có ca coi thi.</Text>}
  </ScrollView>
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 36 }, calendar: { padding: 10, backgroundColor: '#fff', borderRadius: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  arrow: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }, month: { color: '#0f172a', fontSize: 16, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' }, weekday: { width: '14.2857%', textAlign: 'center', color: '#64748b', fontSize: 11, fontWeight: '700', paddingVertical: 7 },
  cell: { width: '14.2857%', minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  activeCell: { backgroundColor: '#2563eb' }, day: { color: '#334155', fontSize: 13, fontWeight: '600' }, activeDay: { color: '#fff' },
  dot: { width: 5, height: 5, marginTop: 3, borderRadius: 3, backgroundColor: '#2563eb' }, activeDot: { backgroundColor: '#fff' },
  dayHeading: { color: '#0f172a', fontSize: 15, fontWeight: '700', marginVertical: 15 }, empty: { color: '#64748b', textAlign: 'center', padding: 22 },
})
