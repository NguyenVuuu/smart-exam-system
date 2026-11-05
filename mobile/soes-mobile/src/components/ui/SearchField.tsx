import { Search } from 'lucide-react-native'
import { StyleSheet, TextInput, View } from 'react-native'

interface Props { value: string; onChangeText: (value: string) => void; placeholder?: string }

export function SearchField({ value, onChangeText, placeholder = 'Tìm kiếm...' }: Props) {
  return <View style={styles.root}>
    <Search size={18} color="#94a3b8" />
    <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder}
      placeholderTextColor="#94a3b8" autoCapitalize="none" returnKeyType="search" />
  </View>
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', minHeight: 46, gap: 9, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#fff' },
  input: { flex: 1, minWidth: 0, fontSize: 14, color: '#0f172a' },
})
