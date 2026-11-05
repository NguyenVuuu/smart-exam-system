import { StyleSheet, Text, View } from 'react-native'

interface Props { label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' }

const colors = {
  neutral: ['#f1f5f9', '#475569'], success: ['#ecfdf5', '#047857'],
  warning: ['#fffbeb', '#b45309'], danger: ['#fef2f2', '#b91c1c'],
} as const

export function StatusBadge({ label, tone = 'neutral' }: Props) {
  const [backgroundColor, color] = colors[tone]
  return <View style={[styles.badge, { backgroundColor }]}><Text style={[styles.text, { color }]}>{label}</Text></View>
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  text: { fontSize: 11, fontWeight: '700' },
})
