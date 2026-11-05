import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface Props { title?: string; children: ReactNode }

export function SectionCard({ title, children }: Props) {
  return <View style={styles.card}>
    {title && <Text style={styles.title}>{title}</Text>}
    {children}
  </View>
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', marginBottom: 12 },
  title: { color: '#0f172a', fontWeight: '700', fontSize: 16, marginBottom: 10 },
})
