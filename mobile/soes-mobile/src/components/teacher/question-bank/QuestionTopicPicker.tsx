import { useEffect, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Check, Plus, Sparkles, X } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { createLearningTopic, listLearningTopics, suggestQuestionTopic, type TopicSuggestion } from '../../../api/teacher-questions.api'
import type { LearningTopic } from '../../../types/teacher-questions.types'

interface Props {
  subjectId: string
  title: string
  content: string
  initialTopics: LearningTopic[]
  onClose: () => void
  onSave: (topics: LearningTopic[]) => Promise<void> | void
}

export function QuestionTopicPicker({ subjectId, title, content, initialTopics, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets()
  const [topics, setTopics] = useState<LearningTopic[]>([])
  const [selected, setSelected] = useState(initialTopics.map((item) => item.id))
  const [suggestion, setSuggestion] = useState<TopicSuggestion | null>(null)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listLearningTopics(subjectId).then((items) => { if (active) setTopics(items) })
      .catch(() => { if (active) setError('Không thể tải chủ đề.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [subjectId])

  const toggle = (id: string) => setSelected((current) => current.includes(id)
    ? current.filter((value) => value !== id) : current.length < 10 ? [...current, id] : current)
  const suggest = async () => {
    if (busy) return
    setBusy(true); setError('')
    try { setSuggestion(await suggestQuestionTopic({ subjectId, title, content })) }
    catch { setError('AI chưa thể gợi ý chủ đề. Bạn vẫn có thể tự chọn.') }
    finally { setBusy(false) }
  }
  const add = async () => {
    if (busy || code.trim().length < 2 || name.trim().length < 3) return
    setBusy(true); setError('')
    try {
      const created = await createLearningTopic(subjectId, { code: code.trim(), name: name.trim() })
      setTopics((current) => [...current, created].sort((a, b) => a.code.localeCompare(b.code)))
      setSelected((current) => current.length < 10 ? [...current, created.id] : current)
      setCode(''); setName('')
    } catch { setError('Không thể thêm chủ đề. Kiểm tra mã chủ đề đã tồn tại chưa.') }
    finally { setBusy(false) }
  }
  const save = async () => {
    if (busy || loading) return
    setBusy(true); setError('')
    try { await onSave(topics.filter((topic) => selected.includes(topic.id))); onClose() }
    catch { setError('Không thể lưu nhãn chủ đề. Vui lòng thử lại.') }
    finally { setBusy(false) }
  }

  return <Modal visible transparent animationType="slide" presentationStyle="overFullScreen" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
        <View style={styles.header}><View style={{ flex: 1 }}><Text style={styles.heading}>Gắn chủ đề câu hỏi</Text>
          <Text numberOfLines={2} style={styles.muted}>{title}</Text></View>
          <Pressable accessibilityLabel="Đóng" onPress={onClose} style={styles.icon}><X size={20} color="#64748b" /></Pressable></View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
          <Pressable accessibilityRole="button" disabled={busy || loading} onPress={() => void suggest()} style={styles.suggest}>
            <Sparkles size={17} color="#7c3aed" /><Text style={styles.suggestText}>{busy ? 'Đang xử lý...' : 'AI gợi ý chủ đề'}</Text>
          </Pressable>
          {suggestion && <View style={styles.suggestion}>
            <Text style={styles.muted}>{suggestion.rationale}</Text>
            {suggestion.existing.length > 0 && <Pressable onPress={() => setSelected((current) =>
              Array.from(new Set([...current, ...suggestion.existing.map((item) => item.id)])).slice(0, 10))}>
              <Text style={styles.link}>Chọn: {suggestion.existing.map((item) => item.name).join(', ')}</Text></Pressable>}
            {suggestion.proposed && <Pressable onPress={() => { setCode(suggestion.proposed!.code); setName(suggestion.proposed!.name) }}>
              <Text style={styles.link}>Điền chủ đề mới: {suggestion.proposed.name}</Text></Pressable>}
          </View>}
          {loading && <ActivityIndicator color="#2563eb" />}
          {!loading && topics.length === 0 && <Text style={styles.muted}>Môn học chưa có chủ đề. Hãy thêm bên dưới.</Text>}
          {topics.map((topic) => <Pressable key={topic.id} accessibilityRole="checkbox"
            accessibilityState={{ checked: selected.includes(topic.id) }} onPress={() => toggle(topic.id)} style={styles.topic}>
            <View style={[styles.check, selected.includes(topic.id) && styles.checked]}>
              {selected.includes(topic.id) && <Check size={15} color="#fff" />}</View>
            <View style={{ flex: 1 }}><Text style={styles.topicName}>{topic.name}</Text><Text style={styles.muted}>{topic.code}</Text></View>
          </Pressable>)}
          <Text style={styles.label}>Thêm chủ đề mới</Text>
          <TextInput value={code} onChangeText={setCode} maxLength={32} placeholder="Mã chủ đề, ví dụ OOP"
            accessibilityLabel="Mã chủ đề" style={styles.input} />
          <TextInput value={name} onChangeText={setName} maxLength={120} placeholder="Tên chủ đề"
            accessibilityLabel="Tên chủ đề" style={styles.input} />
          <Pressable accessibilityRole="button" disabled={busy || code.trim().length < 2 || name.trim().length < 3}
            onPress={() => void add()} style={styles.add}><Plus size={16} color="#2563eb" /><Text style={styles.link}>Thêm chủ đề</Text></Pressable>
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        </ScrollView>
        <Pressable accessibilityRole="button" disabled={busy || loading} onPress={() => void save()} style={styles.save}>
          <Text style={styles.saveText}>{busy ? 'Đang lưu...' : `Lưu chủ đề (${selected.length})`}</Text>
        </Pressable>
      </View>
    </View>
  </Modal>
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: { maxHeight: '88%', backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  heading: { color: '#0f172a', fontSize: 17, fontWeight: '800' }, muted: { color: '#64748b', fontSize: 12, marginTop: 3 },
  icon: { minWidth: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  body: { paddingVertical: 16, gap: 10 }, suggest: { alignSelf: 'flex-start', flexDirection: 'row', gap: 7, alignItems: 'center', padding: 10, borderRadius: 10, backgroundColor: '#f5f3ff' },
  suggestText: { color: '#7c3aed', fontWeight: '700' }, suggestion: { padding: 12, borderRadius: 10, backgroundColor: '#f5f3ff', gap: 8 },
  link: { color: '#2563eb', fontWeight: '700', fontSize: 13 }, topic: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  topicName: { color: '#0f172a', fontWeight: '600' }, check: { width: 20, height: 20, borderWidth: 1, borderColor: '#94a3b8', borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: '#2563eb', borderColor: '#2563eb' }, label: { color: '#334155', fontWeight: '700', marginTop: 8 },
  input: { minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 12, color: '#0f172a' },
  add: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6 }, error: { color: '#b91c1c' },
  save: { minHeight: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb' }, saveText: { color: '#fff', fontWeight: '700' },
})
