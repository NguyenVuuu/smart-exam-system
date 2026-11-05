import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { AiReviewCard } from '../../components/teacher/ai/AiReviewCard'
import { AiSourceSelector } from '../../components/teacher/ai/AiSourceSelector'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ScreenState } from '../../components/ui/ScreenState'
import { useTeacherAiGenerator } from '../../hooks/useTeacherAiGenerator'
import type { Difficulty } from '../../types/teacher-questions.types'

const difficulties: { key: 'AUTO' | Difficulty; label: string }[] = [
  { key: 'AUTO', label: 'Tự động' }, { key: 'EASY', label: 'Dễ' },
  { key: 'MEDIUM', label: 'Trung bình' }, { key: 'HARD', label: 'Khó' },
]

export function TeacherAiGeneratorPage() {
  const ai = useTeacherAiGenerator()
  if (ai.loading) return <ScreenState kind="loading" />
  if (ai.error) return <ScreenState kind="error" onRetry={() => void ai.reload()} />
  return <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <ScreenHeader title="Sinh câu hỏi AI" description="Chọn nguồn tài liệu, xem và lưu câu trắc nghiệm đạt yêu cầu" />
    {!ai.generation ? <>
      <AiSourceSelector subjects={ai.subjects} subjectId={ai.subjectId} onSubject={(id) => { void ai.chooseSubject(id) }}
        sourceType={ai.sourceType} onSourceType={ai.setSource} materials={ai.materials} materialIds={ai.materialIds}
        onToggleMaterial={ai.toggleMaterial} sourceFile={ai.sourceFile} onPickFile={() => { void ai.pickFile() }} busy={ai.busy} />
      <Text style={styles.label}>Số câu (1–10)</Text>
      <TextInput value={ai.count} onChangeText={ai.setCount} keyboardType="number-pad" style={styles.input} />
      <Text style={styles.label}>Độ khó</Text>
      <View style={styles.choices}>{difficulties.map((entry) => <Pressable key={entry.key} accessibilityRole="button"
        onPress={() => ai.setDifficulty(entry.key)} style={[styles.chip, ai.difficulty === entry.key && styles.selectedChip]}>
        <Text style={styles.chipText}>{entry.label}</Text></Pressable>)}</View>
      <Text style={styles.label}>Yêu cầu thêm (tùy chọn)</Text>
      <TextInput value={ai.prompt} onChangeText={ai.setPrompt} multiline maxLength={3000}
        textAlignVertical="top" placeholder="Ví dụ: Tập trung chương 2" placeholderTextColor="#94a3b8" style={[styles.input, styles.multiline]} />
      <Pressable accessibilityRole="button" disabled={ai.busy} style={styles.submit} onPress={() => { void ai.generate() }}>
        <Text style={styles.submitText}>{ai.busy ? 'Đang xử lý...' : 'Sinh câu hỏi'}</Text></Pressable>
    </> : <>
      <Text style={styles.summary}>{ai.questions.length} câu trắc nghiệm đã sinh · {ai.selected.length} câu được chọn lưu</Text>
      {ai.questions.map((question, index) => <AiReviewCard key={question.id} number={index + 1} question={question}
        selected={ai.selected.includes(question.id)} onSelect={() => ai.toggleSelected(question.id)} onChange={ai.updateQuestion} />)}
      <Pressable accessibilityRole="button" disabled={ai.busy || !ai.selected.length} style={styles.submit} onPress={() => { void ai.save() }}>
        <Text style={styles.submitText}>{ai.busy ? 'Đang lưu...' : `Lưu ${ai.selected.length} câu đã chọn`}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={ai.clearResult} style={styles.back}><Text style={styles.backText}>Tạo lượt mới</Text></Pressable>
    </>}
  </ScrollView>
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { padding: 16, paddingBottom: 36 }, label: { color: '#334155', fontWeight: '700', marginTop: 14, marginBottom: 8 },
  input: { minHeight: 46, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 10, color: '#0f172a', backgroundColor: '#fff' }, multiline: { minHeight: 80 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { minHeight: 42, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 10, justifyContent: 'center' },
  selectedChip: { backgroundColor: '#eff6ff', borderColor: '#2563eb' }, chipText: { color: '#334155', fontSize: 13 },
  submit: { minHeight: 46, borderRadius: 10, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  submitText: { color: '#fff', fontWeight: '700' }, summary: { color: '#475569', marginBottom: 12 }, back: { minHeight: 44, alignItems: 'center', justifyContent: 'center' }, backText: { color: '#2563eb', fontWeight: '700' },
})

