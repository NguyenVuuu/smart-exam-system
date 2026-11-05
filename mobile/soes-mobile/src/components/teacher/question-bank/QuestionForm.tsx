import { useRef, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { ChoicePicker } from '../../ui/ChoicePicker'
import { RichContent } from '../../ui/RichContent'
import { useModalScroll } from '../../ui/FullScreenFormModal'
import { QuestionOptionsEditor } from './QuestionOptionsEditor'
import type { Difficulty, ObjectiveQuestionPayload, QuestionSubject, TeacherQuestion } from '../../../types/teacher-questions.types'

const types: { key: ObjectiveQuestionPayload['type']; label: string }[] = [
  { key: 'SINGLE_CHOICE', label: 'Một đáp án' }, { key: 'MULTIPLE_CHOICE', label: 'Nhiều đáp án' }, { key: 'TRUE_FALSE', label: 'Đúng/sai' },
]
const difficulties: { key: Difficulty; label: string }[] = [
  { key: 'EASY', label: 'Dễ' }, { key: 'MEDIUM', label: 'Trung bình' }, { key: 'HARD', label: 'Khó' },
]
interface Props { initial: TeacherQuestion | null; subjects: QuestionSubject[]; busy: boolean
  onSave: (payload: ObjectiveQuestionPayload) => void; onCancel: () => void }

export function QuestionForm({ initial, subjects, busy, onSave, onCancel }: Props) {
  const { scrollToY } = useModalScroll()
  const titleY = useRef(0)
  const optionsY = useRef(0)
  const explanationY = useRef(0)

  const [subjectId, setSubjectId] = useState(initial?.subject.id ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [explanation, setExplanation] = useState(initial?.explanation ?? '')
  const [type, setType] = useState<ObjectiveQuestionPayload['type']>(initial?.type === 'PROGRAMMING' ? 'SINGLE_CHOICE' : initial?.type ?? 'SINGLE_CHOICE')
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? 'MEDIUM')
  const [options, setOptions] = useState<ObjectiveQuestionPayload['options']>(initial?.options.map(({ content, isCorrect }) => ({ content, isCorrect })) ?? [
    { content: '', isCorrect: true }, { content: '', isCorrect: false },
  ])
  const [preview, setPreview] = useState(false)

  function selectType(nextType: ObjectiveQuestionPayload['type']) {
    setType(nextType)
    setOptions(nextType === 'TRUE_FALSE' ? [{ content: 'Đúng', isCorrect: true }, { content: 'Sai', isCorrect: false }] : [
      { content: '', isCorrect: true }, { content: '', isCorrect: false },
    ])
  }

  function save() {
    const cleanTitle = title.trim()
    const cleanOptions = options.map((option) => ({ content: option.content.trim(), isCorrect: option.isCorrect }))
    const values = cleanOptions.map((option) => option.content.toLocaleLowerCase('vi'))
    const correctCount = cleanOptions.filter((option) => option.isCorrect).length
    if (!subjectId || cleanTitle.length < 3 || cleanTitle.length > 200) return Alert.alert('Thiếu thông tin', 'Chọn môn học và nhập tiêu đề từ 3 đến 200 ký tự.')
    if (cleanOptions.length < 2 || cleanOptions.some((option) => !option.content) || new Set(values).size !== values.length) return Alert.alert('Phương án chưa hợp lệ', 'Cần ít nhất hai phương án, không được để trống hoặc trùng nhau.')
    if (type === 'MULTIPLE_CHOICE' ? correctCount === 0 || correctCount === cleanOptions.length : correctCount !== 1) return Alert.alert('Đáp án chưa hợp lệ', 'Hãy chọn số đáp án đúng theo loại câu hỏi.')
    onSave({ subjectId, title: cleanTitle, content: cleanTitle, explanation: explanation.trim() || null,
      type, difficulty, options: cleanOptions, testCases: [] })
  }

  return (
    <View>
      <ChoicePicker
        label="Môn học"
        placeholder="Chọn môn học"
        options={subjects.map((subject) => ({ value: subject.id, label: subject.code ? `${subject.code} · ${subject.name}` : subject.name }))}
        selectedValues={subjectId ? [subjectId] : []}
        onToggle={setSubjectId}
      />
      <Text style={styles.label}>Loại câu hỏi</Text>
      <View style={styles.choices}>
        {types.map((entry) => (
          <Chip key={entry.key} label={entry.label} selected={type === entry.key} onPress={() => selectType(entry.key)} />
        ))}
      </View>
      <Text style={styles.label}>Độ khó</Text>
      <View style={styles.choices}>
        {difficulties.map((entry) => (
          <Chip key={entry.key} label={entry.label} selected={difficulty === entry.key} onPress={() => setDifficulty(entry.key)} />
        ))}
      </View>
      <View onLayout={(e) => { titleY.current = e.nativeEvent.layout.y }}>
        <Text style={styles.label}>Nội dung câu hỏi</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={title}
          onChangeText={setTitle}
          multiline
          maxLength={200}
          textAlignVertical="top"
          placeholder="Nhập nội dung câu hỏi"
          placeholderTextColor="#94a3b8"
          onFocus={() => scrollToY(titleY.current, 16)}
        />
      </View>
      <View onLayout={(e) => { optionsY.current = e.nativeEvent.layout.y }}>
        <QuestionOptionsEditor
          type={type}
          options={options}
          onChange={setOptions}
          onFocusOption={(_idx, rowY) => scrollToY(optionsY.current + rowY, 16)}
        />
      </View>
      <View onLayout={(e) => { explanationY.current = e.nativeEvent.layout.y }}>
        <Text style={styles.label}>Giải thích (tùy chọn)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={explanation}
          onChangeText={setExplanation}
          multiline
          maxLength={5000}
          textAlignVertical="top"
          placeholder="Giải thích đáp án"
          placeholderTextColor="#94a3b8"
          onFocus={() => scrollToY(explanationY.current, 16)}
        />
      </View>
      <Pressable accessibilityRole="button" onPress={() => setPreview((value) => !value)} style={styles.action}>
        <Text style={styles.link}>{preview ? 'Ẩn xem trước' : 'Xem trước câu hỏi'}</Text>
      </Pressable>
      {preview && (
        <View style={styles.preview}>
          <RichContent content={title} />
          {options.map((option, index) => (
            <Text key={index} style={styles.previewOption}>{option.isCorrect ? 'Đáp án · ' : ''}{option.content}</Text>
          ))}
        </View>
      )}
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onCancel} style={[styles.action, styles.cancel]}>
          <Text style={styles.link}>Hủy</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={busy} onPress={save} style={[styles.action, styles.submit]}>
          <Text style={styles.submitText}>{busy ? 'Đang lưu...' : 'Lưu câu hỏi'}</Text>
        </Pressable>
      </View>
    </View>
  )
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.chip, selected && styles.chipActive]}>
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  label: { color: '#334155', fontWeight: '700', marginTop: 12, marginBottom: 8 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { minHeight: 42, paddingHorizontal: 10, justifyContent: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { color: '#475569', fontSize: 12 },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 10, color: '#0f172a', backgroundColor: '#fff' },
  multiline: { minHeight: 80 },
  action: { minHeight: 46, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  link: { color: '#2563eb', fontWeight: '700' },
  preview: { padding: 12, borderRadius: 10, backgroundColor: '#f8fafc' },
  previewOption: { color: '#475569', marginTop: 6 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancel: { flex: 1, backgroundColor: '#eff6ff' },
  submit: { flex: 1, backgroundColor: '#2563eb' },
  submitText: { color: '#fff', fontWeight: '700' },
})
