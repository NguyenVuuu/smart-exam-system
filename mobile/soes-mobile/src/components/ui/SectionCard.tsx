import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface Props { title?: string; headerRight?: ReactNode; children: ReactNode }

export function SectionCard({ title, headerRight, children }: Props) {
  return <View style={styles.card}>
    {title && <View style={styles.header}><Text style={styles.title}>{title}</Text>{headerRight}</View>}
    {children}
  </View>
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  title: { flex: 1, color: '#0f172a', fontWeight: '700', fontSize: 16 },
})
