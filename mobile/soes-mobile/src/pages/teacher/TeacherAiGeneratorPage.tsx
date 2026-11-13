import { BackToTopScrollView } from '../../components/ui/BackToTop'
import { useEffect, useRef, useState, type ElementRef } from 'react'
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { AiReviewCard } from '../../components/teacher/ai/AiReviewCard'
import { AiSourceSelector } from '../../components/teacher/ai/AiSourceSelector'
import { QuestionTopicPicker } from '../../components/teacher/question-bank/QuestionTopicPicker'
import { listLearningTopics } from '../../api/teacher-questions.api'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ScreenState } from '../../components/ui/ScreenState'
import { useKeyboardBottomOffset } from '../../hooks/useKeyboardBottomOffset'
import { useTeacherAiGenerator } from '../../hooks/useTeacherAiGenerator'
import type { Difficulty, LearningTopic } from '../../types/teacher-questions.types'
import { scrollToY } from '../../utils/keyboardScroll'

const difficulties: { key: 'AUTO' | Difficulty; label: string }[] = [
  { key: 'AUTO', label: 'Tự động' }, { key: 'EASY', label: 'Dễ' },
  { key: 'MEDIUM', label: 'Trung bình' }, { key: 'HARD', label: 'Khó' },
]

export function TeacherAiGeneratorPage() {
  const scrollRef = useRef<ElementRef<typeof ScrollView>>(null)
  const countRef = useRef<ElementRef<typeof TextInput>>(null)
  const promptRef = useRef<ElementRef<typeof TextInput>>(null)
  const countLayoutY = useRef(0)
  const promptLayoutY = useRef(0)
  const cardLayouts = useRef<Record<string, number>>({})

  const ai = useTeacherAiGenerator()
  const [topicCache, setTopicCache] = useState<{ subjectId: string; items: LearningTopic[] } | null>(null)
  const [taggingId, setTaggingId] = useState<string | null>(null)
  const topics = topicCache?.subjectId === ai.subjectId ? topicCache.items : []
  useEffect(() => {
    if (!ai.subjectId) return
    let active = true
    listLearningTopics(ai.subjectId).then((items) => { if (active) setTopicCache({ subjectId: ai.subjectId, items }) }).catch(() => {})
    return () => { active = false }
  }, [ai.subjectId])
  const taggingQuestion = ai.questions.find((item) => item.id === taggingId)
  const { animatedOffset, isKeyboardOpen } = useKeyboardBottomOffset({ accountForBottomInset: true })

  if (ai.loading) return <ScreenState kind="loading" />
  if (ai.error) return <ScreenState kind="error" onRetry={() => void ai.reload()} />

  return (
    <Animated.View
      style={[
        styles.root,
        Platform.OS === 'ios' && { paddingBottom: animatedOffset },
      ]}
    >
      {taggingQuestion && <QuestionTopicPicker key={taggingQuestion.id} subjectId={ai.subjectId}
        title={taggingQuestion.title} content={taggingQuestion.content}
        initialTopics={topics.filter((topic) => taggingQuestion.topicIds?.includes(topic.id))}
        onClose={() => setTaggingId(null)} onSave={(selectedTopics) => {
          setTopicCache({ subjectId: ai.subjectId, items: Array.from(new Map([...topics, ...selectedTopics].map((topic) => [topic.id, topic])).values()) })
          ai.updateQuestion({ ...taggingQuestion, topicIds: selectedTopics.map((topic) => topic.id) })
        }} />}
      <BackToTopScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, isKeyboardOpen && styles.contentKeyboardOpen]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={false}
      >
        <ScreenHeader title="Sinh câu hỏi AI" description="Chọn nguồn tài liệu, xem và lưu câu trắc nghiệm đạt yêu cầu" />
        {!ai.generation ? (
          <>
            <Text style={styles.label}>Cách xử lý</Text>
            <View style={styles.choices}>{[
              { key: 'GENERATE_FROM_MATERIAL' as const, label: 'Sinh câu hỏi' },
              { key: 'EXTRACT_EXISTING_EXAM' as const, label: 'Bóc tách đề có sẵn' },
            ].map((entry) => (
              <Pressable
                key={entry.key}
                accessibilityRole="button"
                onPress={() => ai.setMode(entry.key)}
                style={[styles.chip, ai.mode === entry.key && styles.selectedChip]}
              >
                <Text style={styles.chipText}>{entry.label}</Text>
              </Pressable>
            ))}</View>
            <AiSourceSelector
              subjects={ai.subjects}
              subjectId={ai.subjectId}
              onSubject={(id) => { void ai.chooseSubject(id) }}
              sourceType={ai.sourceType}
              onSourceType={ai.setSource}
              materials={ai.materials}
              materialIds={ai.materialIds}
              onToggleMaterial={ai.toggleMaterial}
              sourceFile={ai.sourceFile}
              pendingFileName={ai.pendingFileName}
              onPickFile={() => { void ai.pickFile() }}
              busy={ai.busy}
            />
            {ai.mode === 'GENERATE_FROM_MATERIAL' && (
              <View onLayout={(e) => { countLayoutY.current = e.nativeEvent.layout.y }}>
                <Text style={styles.label}>Số câu (1–10)</Text>
                <TextInput
                  ref={countRef}
                  value={ai.count}
                  onChangeText={ai.setCount}
                  keyboardType="number-pad"
                  style={styles.input}
                  onFocus={() => scrollToY(scrollRef.current, countLayoutY.current, 16)}
                />
                <Text style={styles.label}>Độ khó</Text>
                <View style={styles.choices}>
                  {difficulties.map((entry) => (
                    <Pressable
                      key={entry.key}
                      accessibilityRole="button"
                      onPress={() => ai.setDifficulty(entry.key)}
                      style={[styles.chip, ai.difficulty === entry.key && styles.selectedChip]}
                    >
                      <Text style={styles.chipText}>{entry.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
            <View onLayout={(e) => { promptLayoutY.current = e.nativeEvent.layout.y }}>
              <Text style={styles.label}>Yêu cầu thêm (tùy chọn)</Text>
              <TextInput
                ref={promptRef}
                value={ai.prompt}
                onChangeText={ai.setPrompt}
                multiline
                maxLength={3000}
                textAlignVertical="top"
                placeholder="Ví dụ: Tập trung chương 2"
                placeholderTextColor="#94a3b8"
                style={[styles.input, styles.multiline]}
                onFocus={() => scrollToY(scrollRef.current, promptLayoutY.current, 16)}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.resultHead}>
              <Text style={styles.summary}>{ai.questions.length} câu trắc nghiệm · {ai.selected.length} câu được chọn</Text>
              <Pressable accessibilityRole="button" onPress={ai.acceptAll} style={styles.acceptAll}>
                <Text style={styles.acceptAllText}>Chấp nhận tất cả</Text>
              </Pressable>
            </View>
            {ai.questions.map((question, index) => (
              <View
                key={question.id}
                onLayout={(e) => {
                  cardLayouts.current[question.id] = e.nativeEvent.layout.y
                }}
              >
                <AiReviewCard
                  number={index + 1}
                  question={question}
                  decision={ai.selected.includes(question.id) ? 'accepted' : ai.rejected.includes(question.id) ? 'rejected' : 'pending'}
                  onAccept={() => ai.acceptQuestion(question.id)}
                  onReject={() => ai.rejectQuestion(question.id)}
                  onChange={ai.updateQuestion}
                  onTopics={() => setTaggingId(question.id)}
                  topicNames={topics.filter((topic) => question.topicIds?.includes(topic.id)).map((topic) => topic.name)}
                  onFocusField={(fieldOffsetY) => {
                    const cardY = cardLayouts.current[question.id] ?? 0
                    scrollToY(scrollRef.current, cardY + fieldOffsetY, 16)
                  }}
                />
              </View>
            ))}
            <Pressable accessibilityRole="button" onPress={ai.clearResult} style={styles.back}>
              <Text style={styles.backText}>Tạo lượt mới</Text>
            </Pressable>
          </>
        )}
      </BackToTopScrollView>
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          disabled={ai.busy || Boolean(ai.generation && !ai.selected.length)}
          style={[styles.submit, (ai.busy || Boolean(ai.generation && !ai.selected.length)) && styles.disabled]}
          onPress={() => { void (ai.generation ? ai.save() : ai.generate()) }}
        >
          <Text style={styles.submitText}>
            {ai.busy ? 'Đang xử lý...' : ai.generation ? `Lưu ${ai.selected.length} câu đã chọn` : ai.mode === 'EXTRACT_EXISTING_EXAM' ? 'Bóc tách câu hỏi' : 'Sinh câu hỏi'}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 56 },
  contentKeyboardOpen: { paddingBottom: 240 },
  footer: { padding: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  label: { color: '#334155', fontWeight: '700', marginTop: 14, marginBottom: 8 },
  input: { minHeight: 46, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 10, color: '#0f172a', backgroundColor: '#fff' },
  multiline: { minHeight: 80 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 42, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 10, justifyContent: 'center' },
  selectedChip: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  chipText: { color: '#334155', fontSize: 13 },
  submit: { minHeight: 46, borderRadius: 10, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontWeight: '700' },
  resultHead: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  summary: { color: '#475569', flexGrow: 1, fontSize: 12 },
  acceptAll: { minHeight: 34, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: '#ecfdf5', borderRadius: 8 },
  acceptAllText: { color: '#047857', fontSize: 12, fontWeight: '700' },
  back: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#2563eb', fontWeight: '700' },
})
