import { ChevronDown, Check } from 'lucide-react-native'
import { useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export interface ChoiceOption { value: string; label: string; description?: string }
interface Props { label: string; placeholder: string; options: ChoiceOption[]; selectedValues: string[]
  onToggle: (value: string) => void; multiple?: boolean; disabled?: boolean }

export function ChoicePicker({ label, placeholder, options, selectedValues, onToggle, multiple = false, disabled = false }: Props) {
  const [open, setOpen] = useState(false)
  const insets = useSafeAreaInsets()
  const selected = options.filter((option) => selectedValues.includes(option.value))
  const summary = selected.length ? multiple ? `${selected.length} đã chọn` : selected[0].label : placeholder
  return <>
    <Text style={styles.label}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${summary}`} disabled={disabled}
      onPress={() => setOpen(true)} style={[styles.field, disabled && styles.disabled]}>
      <Text numberOfLines={1} style={styles.value}>{summary}</Text><ChevronDown size={18} color="#64748b" />
    </Pressable>
    <Modal visible={open} transparent presentationStyle="overFullScreen" animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessibilityLabel="Đóng danh sách" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
          <Text style={styles.heading}>{label}</Text>
          <FlatList data={options} keyExtractor={(item) => item.value} style={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>Không có lựa chọn phù hợp.</Text>}
            renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityState={{ selected: selectedValues.includes(item.value) }}
              style={styles.option} onPress={() => { onToggle(item.value); if (!multiple) setOpen(false) }}>
              <View style={styles.optionText}><Text style={styles.optionLabel}>{item.label}</Text>
                {item.description && <Text style={styles.description}>{item.description}</Text>}</View>
              {selectedValues.includes(item.value) && <Check size={18} color="#059669" />}
            </Pressable>} />
          <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.close}>
            <Text style={styles.closeText}>{multiple ? 'Xong' : 'Đóng'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  </>
}

const styles = StyleSheet.create({
  label: { color: '#334155', fontWeight: '700', marginTop: 14, marginBottom: 8 },
  field: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 12 },
  disabled: { opacity: 0.45 }, value: { flex: 1, color: '#334155', fontSize: 13 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.4)' },
  sheet: { maxHeight: '75%', backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16 },
  heading: { color: '#0f172a', fontWeight: '800', fontSize: 17, marginBottom: 8 }, list: { flexGrow: 0 },
  option: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', gap: 8 },
  optionText: { flex: 1 }, optionLabel: { color: '#0f172a', fontSize: 14 }, description: { color: '#64748b', fontSize: 12, marginTop: 3 },
  empty: { color: '#64748b', paddingVertical: 20, textAlign: 'center' },
  close: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8, backgroundColor: '#eff6ff', borderRadius: 10 },
  closeText: { color: '#2563eb', fontWeight: '700' },
})
