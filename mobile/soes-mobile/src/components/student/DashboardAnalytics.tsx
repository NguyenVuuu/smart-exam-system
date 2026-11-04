import { useState, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import type { AnalyticsItem, ExamType } from '../../types/dashboard.types'

const SCREEN_W = Dimensions.get('window').width
const CHART_H = 160
const PLOT_H = CHART_H - 24        // bottom label space
const BAR_W = 18
const GROUP_GAP = 10               // gap between the 2 bars in a group
const GROUP_W = BAR_W * 2 + GROUP_GAP
const ITEM_GAP = 28               // gap between groups
const PAD_L = 28

const EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: 'QUIZ', label: 'Thường kỳ' },
  { value: 'MIDTERM', label: 'Giữa kỳ' },
  { value: 'FINAL', label: 'Cuối kỳ' },
]

function short(s: string, n = 7) { return s.length > n ? s.slice(0, n - 1) + '…' : s }

function Pill({ label, active, onPress, color = '#2563eb' }: { label: string; active: boolean; onPress: () => void; color?: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
        backgroundColor: active ? color : '#f1f5f9',
        marginRight: 6,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '600', color: active ? '#fff' : '#64748b' }}>{label}</Text>
    </TouchableOpacity>
  )
}

export default function DashboardAnalytics({ items }: { items: AnalyticsItem[] }) {
  const semOpts = useMemo(() => {
    const seen = new Map<string, string>()
    for (const it of items) if (!seen.has(it.semesterId)) seen.set(it.semesterId, it.semesterName)
    return [...seen.entries()].map(([v, l]) => ({ value: v, label: l }))
  }, [items])

  const [sem, setSem] = useState('')
  const [type, setType] = useState<ExamType>('QUIZ')

  const effectiveSem = sem || semOpts[0]?.value || ''

  const filtered = useMemo(() =>
    items.filter(i => i.examType === type && (!effectiveSem || i.semesterId === effectiveSem)),
    [items, type, effectiveSem])

  const chartW = Math.max(filtered.length * (GROUP_W + ITEM_GAP) + PAD_L + 16, SCREEN_W - 260)

  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, borderWidth: 1, borderColor: '#f1f5f9' }}>
      {/* Header */}
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>So sánh điểm theo môn học</Text>
      <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, marginBottom: 12 }}>
        Điểm của bạn vs trung bình lớp
      </Text>

      {/* Filters */}
      {semOpts.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row' }}>
            {semOpts.map(o => <Pill key={o.value} label={o.label} active={effectiveSem === o.value} onPress={() => setSem(o.value)} />)}
          </View>
        </ScrollView>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row' }}>
          {EXAM_TYPES.map(o => <Pill key={o.value} label={o.label} active={type === o.value} onPress={() => setType(o.value)} color="#6366f1" />)}
        </View>
      </ScrollView>

      {/* Chart */}
      {filtered.length === 0 ? (
        <View style={{ height: 80, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: 12 }}>
          <Text style={{ fontSize: 13, color: '#94a3b8' }}>Không có dữ liệu</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ width: chartW, height: CHART_H, position: 'relative' }}>
            {/* Y grid */}
            {[0, 5, 10].map(tick => {
              const y = PLOT_H - (tick / 10) * PLOT_H
              return (
                <View key={tick} style={{ position: 'absolute', top: y, left: 0, right: 0, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 8, color: '#cbd5e1', width: PAD_L - 4, textAlign: 'right', marginRight: 4 }}>{tick}</Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: tick === 0 ? '#cbd5e1' : '#f1f5f9' }} />
                </View>
              )
            })}

            {/* Bars */}
            {filtered.map((item, i) => {
              const x = PAD_L + i * (GROUP_W + ITEM_GAP)
              const cH = Math.max((item.classAverage / 10) * PLOT_H, 3)
              const mH = Math.max((item.myScore / 10) * PLOT_H, 3)
              return (
                <View key={item.subjectId} style={{ position: 'absolute', left: x, bottom: 20, flexDirection: 'row', alignItems: 'flex-end', gap: GROUP_GAP }}>
                  {/* Class avg */}
                  <View style={{ width: BAR_W, height: cH, borderRadius: 5, backgroundColor: '#6366f1', opacity: 0.85 }} />
                  {/* My score */}
                  <View style={{ width: BAR_W, height: mH, borderRadius: 5, backgroundColor: '#06b6d4' }} />
                  {/* Score labels on top */}
                  <Text style={{ position: 'absolute', top: -13, left: 0, width: BAR_W, fontSize: 7.5, color: '#6366f1', textAlign: 'center', fontWeight: '600' }}>
                    {item.classAverage.toFixed(1)}
                  </Text>
                  <Text style={{ position: 'absolute', top: -13, left: BAR_W + GROUP_GAP, width: BAR_W, fontSize: 7.5, color: '#0891b2', textAlign: 'center', fontWeight: '600' }}>
                    {item.myScore.toFixed(1)}
                  </Text>
                </View>
              )
            })}

            {/* X labels */}
            {filtered.map((item, i) => {
              const x = PAD_L + i * (GROUP_W + ITEM_GAP)
              return (
                <Text key={item.subjectId + '_lbl'} style={{ position: 'absolute', bottom: 2, left: x - 4, width: GROUP_W + 8, fontSize: 8, color: '#94a3b8', textAlign: 'center' }} numberOfLines={1}>
                  {short(item.subjectName)}
                </Text>
              )
            })}
          </View>
        </ScrollView>
      )}

      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#6366f1', opacity: 0.85 }} />
          <Text style={{ fontSize: 11, color: '#64748b' }}>TB lớp</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#06b6d4' }} />
          <Text style={{ fontSize: 11, color: '#64748b' }}>Điểm bạn</Text>
        </View>
      </View>
    </View>
  )
}
