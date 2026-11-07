import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'

interface Props { title: string; description?: string; showBack?: boolean; onBack?: () => void }

export function ScreenHeader({ title, description, showBack = false, onBack }: Props) {
  return <View style={styles.root}>
    {showBack && <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" style={styles.back}
      onPress={onBack ?? (() => router.canGoBack() ? router.back() : router.replace('/(app)/(teacher)' as never))}>
      <ArrowLeft size={22} color="#2563eb" />
    </Pressable>}
    <View style={styles.content}>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  </View>
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -10, marginRight: 2, marginTop: -6 },
  content: { flex: 1, minWidth: 0 },
  title: { color: '#0f172a', fontSize: 22, fontWeight: '800' },
  description: { color: '#64748b', fontSize: 13, lineHeight: 19, marginTop: 4 },
})
