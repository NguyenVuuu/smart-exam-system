import { useEffect, useRef, useState } from 'react'
import { findNodeHandle, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import type { ScrollViewInstance, TextInputInstance } from 'react-native'
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
  const scrollRef = useRef<ScrollViewInstance>(null)
  const countRef = useRef<TextInputInstance>(null)
  const promptRef = useRef<TextInputInstance>(null)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true))
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false))
    return () => { show.remove(); hide.remove() }
  }, [])
  function focusInput(input: TextInputInstance | null) {
    const handle = input && findNodeHandle(input)
    if (handle) focusHandle(handle)
  }
  function focusHandle(handle: number) {
    setTimeout(() => scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(handle, 16, true), 280)
  }
  if (ai.loading) return <ScreenState kind="loading" />
  if (ai.error) return <ScreenState kind="error" onRetry={() => void ai.reload()} />
  return <View style={styles.root}>
    <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="never"
      keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}>
    <ScreenHeader title="Sinh câu hỏi AI" description="Chọn nguồn tài liệu, xem và lưu câu trắc nghiệm đạt yêu cầu" />
    {!ai.generation ? <>
      <Text style={styles.label}>Cách xử lý</Text>
      <View style={styles.choices}>{[
        { key: 'GENERATE_FROM_MATERIAL' as const, label: 'Sinh câu hỏi' },
        { key: 'EXTRACT_EXISTING_EXAM' as const, label: 'Bóc tách đề có sẵn' },
      ].map((entry) => <Pressable key={entry.key} accessibilityRole="button" onPress={() => ai.setMode(entry.key)}
        style={[styles.chip, ai.mode === entry.key && styles.selectedChip]}><Text style={styles.chipText}>{entry.label}</Text></Pressable>)}</View>
      <AiSourceSelector subjects={ai.subjects} subjectId={ai.subjectId} onSubject={(id) => { void ai.chooseSubject(id) }}
        sourceType={ai.sourceType} onSourceType={ai.setSource} materials={ai.materials} materialIds={ai.materialIds}
        onToggleMaterial={ai.toggleMaterial} sourceFile={ai.sourceFile} pendingFileName={ai.pendingFileName}
        onPickFile={() => { void ai.pickFile() }} busy={ai.busy} />
      {ai.mode === 'GENERATE_FROM_MATERIAL' && <><Text style={styles.label}>Số câu (1–10)</Text>
      <TextInput ref={countRef} value={ai.count} onChangeText={ai.setCount} onFocus={() => focusInput(countRef.current)} keyboardType="number-pad" style={styles.input} />
      <Text style={styles.label}>Độ khó</Text>
      <View style={styles.choices}>{difficulties.map((entry) => <Pressable key={entry.key} accessibilityRole="button"
        onPress={() => ai.setDifficulty(entry.key)} style={[styles.chip, ai.difficulty === entry.key && styles.selectedChip]}>
        <Text style={styles.chipText}>{entry.label}</Text></Pressable>)}</View></>}
      <Text style={styles.label}>Yêu cầu thêm (tùy chọn)</Text>
      <TextInput ref={promptRef} value={ai.prompt} onChangeText={ai.setPrompt} onFocus={() => focusInput(promptRef.current)} multiline maxLength={3000}
        textAlignVertical="top" placeholder="Ví dụ: Tập trung chương 2" placeholderTextColor="#94a3b8" style={[styles.input, styles.multiline]} />
    </> : <>
      <View style={styles.resultHead}><Text style={styles.summary}>{ai.questions.length} câu trắc nghiệm · {ai.selected.length} câu được chọn</Text>
        <Pressable accessibilityRole="button" onPress={ai.acceptAll} style={styles.acceptAll}><Text style={styles.acceptAllText}>Chấp nhận tất cả</Text></Pressable></View>
      {ai.questions.map((question, index) => <AiReviewCard key={question.id} number={index + 1} question={question}
        decision={ai.selected.includes(question.id) ? 'accepted' : ai.rejected.includes(question.id) ? 'rejected' : 'pending'}
        onAccept={() => ai.acceptQuestion(question.id)} onReject={() => ai.rejectQuestion(question.id)} onChange={ai.updateQuestion} onInputFocus={focusHandle} />)}
      <Pressable accessibilityRole="button" onPress={() => { Keyboard.dismiss(); ai.clearResult() }} style={styles.back}><Text style={styles.backText}>Tạo lượt mới</Text></Pressable>
    </>}
    <Pressable accessibilityRole="button" accessibilityLabel="Đóng bàn phím" onPress={Keyboard.dismiss} style={styles.dismissArea} />
  </ScrollView>{!keyboardOpen && <View style={styles.footer}>
    <Pressable accessibilityRole="button" disabled={ai.busy || Boolean(ai.generation && !ai.selected.length)}
      style={[styles.submit, (ai.busy || Boolean(ai.generation && !ai.selected.length)) && styles.disabled]}
      onPress={() => { void (ai.generation ? ai.save() : ai.generate()) }}>
      <Text style={styles.submitText}>{ai.busy ? 'Đang xử lý...' : ai.generation ? `Lưu ${ai.selected.length} câu đã chọn` : ai.mode === 'EXTRACT_EXISTING_EXAM' ? 'Bóc tách câu hỏi' : 'Sinh câu hỏi'}</Text>
    </Pressable>
  </View>}</View>
}

const styles = StyleSheet.create({
  root: { flex: 1 }, scroll: { flex: 1 }, content: { padding: 16, paddingBottom: 16 }, footer: { padding: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' }, label: { color: '#334155', fontWeight: '700', marginTop: 14, marginBottom: 8 },
  input: { minHeight: 46, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 10, color: '#0f172a', backgroundColor: '#fff' }, multiline: { minHeight: 80 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { minHeight: 42, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 10, justifyContent: 'center' },
  selectedChip: { backgroundColor: '#eff6ff', borderColor: '#2563eb' }, chipText: { color: '#334155', fontSize: 13 },
  submit: { minHeight: 46, borderRadius: 10, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontWeight: '700' }, resultHead: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  summary: { color: '#475569', flexGrow: 1, fontSize: 12 }, acceptAll: { minHeight: 34, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: '#ecfdf5', borderRadius: 8 }, acceptAllText: { color: '#047857', fontSize: 12, fontWeight: '700' },
  dismissArea: { minHeight: 24 }, back: { minHeight: 44, alignItems: 'center', justifyContent: 'center' }, backText: { color: '#2563eb', fontWeight: '700' },
})

