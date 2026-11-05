import { StyleSheet, Text, View } from 'react-native'

interface Props { title: string; description?: string }

export function ScreenHeader({ title, description }: Props) {
  return <View style={styles.root}>
    <Text style={styles.title}>{title}</Text>
    {description && <Text style={styles.description}>{description}</Text>}
  </View>
}

const styles = StyleSheet.create({
  root: { marginBottom: 18 },
  title: { color: '#0f172a', fontSize: 22, fontWeight: '800' },
  description: { color: '#64748b', fontSize: 13, lineHeight: 19, marginTop: 4 },
})
