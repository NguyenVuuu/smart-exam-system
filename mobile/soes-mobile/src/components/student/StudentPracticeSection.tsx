import { useEffect, useState } from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import { createPracticeSet, getLearningAgentError, getPracticeSet, listPracticeSets, submitPracticeSet,
  type PracticeSet, type PracticeSummary, type StudyMaterial, type StudentLearningInsights } from '../../api/student-learning.api'
import { ChoicePicker } from '../ui/ChoicePicker'

const card = { padding: 16, borderRadius: 16, backgroundColor: '#fff' } as const

export default function StudentPracticeSection({ materials, topics }: {
  materials: StudyMaterial[]; topics: StudentLearningInsights['topics']
}) {
  const [selectedMaterial, setSelectedMaterial] = useState('')
  const [focusTopicId, setFocusTopicId] = useState('')
  const [instruction, setInstruction] = useState('')
  const [questionCount, setQuestionCount] = useState('5')
  const [sets, setSets] = useState<PracticeSummary[]>([])
  const [current, setCurrent] = useState<PracticeSet | null>(null)
  const [choices, setChoices] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const subjectId = materials.find((item) => item.id === selectedMaterial)?.courseOffering.subject.id
  const weakTopics = topics.filter((topic) => topic.subjectId === subjectId && topic.needsPractice)
  const count = Number(questionCount)
  const validCount = /^\d+$/.test(questionCount) && count >= 1 && count <= 10

  useEffect(() => { listPracticeSets().then(setSets).catch(() => {}) }, [])

  const create = async () => {
    if (!selectedMaterial || !validCount || busy) return
    setBusy(true); setError('')
    try {
      setCurrent(await createPracticeSet(selectedMaterial, count, focusTopicId || undefined, instruction.trim() || undefined)); setChoices({})
      listPracticeSets().then(setSets).catch(() => {})
    } catch (cause) { setError(getLearningAgentError(cause, 'Chưa thể tạo bài luyện. Vui lòng thử lại sau.')) }
    finally { setBusy(false) }
  }

  const open = async (id: string) => {
    setBusy(true); setError('')
    try { setCurrent(await getPracticeSet(id)); setChoices({}) }
    catch { setError('Không thể mở bài luyện.') }
    finally { setBusy(false) }
  }

  const submit = async () => {
    if (!current || current.items.some((item) => choices[item.id] === undefined)) return
    setBusy(true); setError('')
    try {
      setCurrent(await submitPracticeSet(current.id,
        current.items.map((item) => ({ itemId: item.id, selectedIndex: choices[item.id] }))))
      listPracticeSets().then(setSets).catch(() => {})
    } catch { setError('Không thể nộp bài luyện. Hãy thử lại.') }
    finally { setBusy(false) }
  }

  return <View style={{ ...card, gap: 12 }}>
    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>Bài luyện từ tài liệu lớp học</Text>
    <Text style={{ color: '#64748b' }}>Bài luyện tách khỏi điểm thi. Câu hỏi do AI tạo nên hãy đối chiếu với tài liệu.</Text>
    {materials.map((material) => <TouchableOpacity key={material.id} accessibilityRole="button"
      onPress={() => { setSelectedMaterial(material.id); setFocusTopicId('') }} style={{ padding: 10, borderRadius: 10,
        backgroundColor: selectedMaterial === material.id ? '#dbeafe' : '#f1f5f9' }}>
      <Text>{material.title || material.fileName}</Text>
    </TouchableOpacity>)}
    {weakTopics.length > 0 && <View style={{ gap: 8 }}>
      <Text style={{ fontWeight: '600', color: '#334155' }}>Chủ đề ưu tiên</Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => setFocusTopicId('')}
        style={{ padding: 10, borderRadius: 10, backgroundColor: focusTopicId ? '#f1f5f9' : '#dbeafe' }}>
        <Text>Ôn tập chung</Text>
      </TouchableOpacity>
      {weakTopics.map((topic) => <TouchableOpacity key={topic.topicId} accessibilityRole="button"
        onPress={() => setFocusTopicId(topic.topicId)} style={{ padding: 10, borderRadius: 10,
          backgroundColor: focusTopicId === topic.topicId ? '#dbeafe' : '#f1f5f9' }}>
        <Text>{topic.name} · {topic.percentage}% qua {topic.questionCount} câu</Text>
      </TouchableOpacity>)}
    </View>}
    <Text style={{ color: '#334155', fontWeight: '700' }}>Bạn muốn luyện nội dung nào? (tùy chọn)</Text>
    <TextInput value={instruction} onChangeText={setInstruction} multiline maxLength={500}
      textAlignVertical="top" placeholder="Ví dụ: Luyện cách chọn vòng lặp for hoặc while."
      placeholderTextColor="#94a3b8" style={{ minHeight: 88, borderWidth: 1, borderColor: '#cbd5e1',
        borderRadius: 10, padding: 12, color: '#0f172a' }} />
    <Text style={{ color: '#64748b', fontSize: 12, textAlign: 'right' }}>{instruction.length}/500 ký tự</Text>
    <Text style={{ color: '#334155', fontWeight: '700' }}>Số câu muốn tạo</Text>
    <TextInput value={questionCount} onChangeText={setQuestionCount} keyboardType="number-pad" maxLength={2}
      accessibilityLabel="Số câu muốn tạo" style={{ width: 110, borderWidth: 1, borderColor: validCount ? '#cbd5e1' : '#dc2626',
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#0f172a' }} />
    <Text style={{ color: validCount ? '#64748b' : '#b91c1c', fontSize: 12 }}>Từ 1 đến 10 câu</Text>
    <TouchableOpacity accessibilityRole="button" disabled={!selectedMaterial || !validCount || busy} onPress={() => void create()}
      style={{ padding: 12, borderRadius: 10, backgroundColor: '#2563eb', opacity: !selectedMaterial || !validCount || busy ? 0.5 : 1 }}>
      <Text style={{ textAlign: 'center', color: '#fff', fontWeight: '700' }}>{busy ? 'Đang tạo bài...' : `Tạo ${count} câu ôn tập`}</Text>
    </TouchableOpacity>
    {!!error && <Text accessibilityRole="alert" style={{ color: '#b91c1c', backgroundColor: '#fef2f2',
      borderColor: '#fecaca', borderWidth: 1, borderRadius: 12, padding: 12 }}>{error}</Text>}
    {sets.length > 0 && <ChoicePicker label="Lịch sử bài luyện" placeholder="Chọn bài luyện để xem lại"
      options={sets.map((set) => ({ value: set.id,
        label: `${set.subject.name} · ${new Date(set.createdAt).toLocaleString('vi-VN')}`,
        description: set.completedAt ? `${set.score}/${set._count.items} câu đúng` : 'Chưa nộp' }))}
      selectedValues={current ? [current.id] : []} onToggle={(id) => void open(id)} disabled={busy} />}
    {current && <View style={{ gap: 12 }}>
      {!!current.completedAt && <Text style={{ color: '#1d4ed8', fontWeight: '700' }}>Kết quả: {current.score}/{current.items.length}</Text>}
      {current.items.map((item) => <View key={item.id} style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', gap: 8 }}>
        <Text style={{ fontWeight: '700', color: '#0f172a' }}>Câu {item.orderIndex}: {item.stem}</Text>
        {item.options.map((option, index) => <TouchableOpacity key={index} accessibilityRole="button"
          disabled={!!current.completedAt || busy} onPress={() => setChoices((previous) => ({ ...previous, [item.id]: index }))}
          style={{ padding: 9, borderRadius: 8, backgroundColor: (item.result?.selectedIndex ?? choices[item.id]) === index ? '#dbeafe' : '#f8fafc' }}>
          <Text>{option}{item.result?.correctIndex === index ? ' ✓' : ''}</Text>
        </TouchableOpacity>)}
        {item.result && <>
          <Text style={{ color: '#64748b' }}>{item.result.explanation}</Text>
          <Text style={{ color: '#64748b', fontSize: 12 }}>Nguồn: {item.result.materialTitle || 'Tài liệu lớp học'} · “{item.result.supportQuote}”</Text>
        </>}
      </View>)}
      {!current.completedAt && <TouchableOpacity accessibilityRole="button" disabled={busy || current.items.some((item) => choices[item.id] === undefined)}
        onPress={() => void submit()} style={{ padding: 12, borderRadius: 10, backgroundColor: '#059669' }}>
        <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>Nộp bài luyện</Text>
      </TouchableOpacity>}
    </View>}
  </View>
}
