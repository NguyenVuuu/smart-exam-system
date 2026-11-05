import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'

interface Props { title: string; description?: string; showBack?: boolean; onBack?: () => void }

export function ScreenHeader({ title, description, showBack = true, onBack }: Props) {
  return <View style={styles.root}>
    {showBack && <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" style={styles.back}
      onPress={onBack ?? (() => router.canGoBack() ? router.back() : router.replace('/(app)/(teacher)' as never))}>
      <ArrowLeft size={18} color="#2563eb" /><Text style={styles.backText}>Quay lại</Text>
    </Pressable>}
    <Text style={styles.title}>{title}</Text>
    {description && <Text style={styles.description}>{description}</Text>}
  </View>
}

const styles = StyleSheet.create({
  root: { marginBottom: 18 },
  back: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  backText: { color: '#2563eb', fontWeight: '700', fontSize: 13 },
  title: { color: '#0f172a', fontSize: 22, fontWeight: '800' },
  description: { color: '#64748b', fontSize: 13, lineHeight: 19, marginTop: 4 },
})
