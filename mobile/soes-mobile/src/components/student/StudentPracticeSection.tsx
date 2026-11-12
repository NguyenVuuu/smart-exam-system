import { useEffect, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { createPracticeSet, getPracticeSet, listPracticeSets, submitPracticeSet,
  type PracticeSet, type PracticeSummary, type StudyMaterial } from '../../api/student-learning.api'

const card = { padding: 16, borderRadius: 16, backgroundColor: '#fff' } as const

export default function StudentPracticeSection({ materials }: { materials: StudyMaterial[] }) {
  const [selectedMaterial, setSelectedMaterial] = useState('')
  const [sets, setSets] = useState<PracticeSummary[]>([])
  const [current, setCurrent] = useState<PracticeSet | null>(null)
  const [choices, setChoices] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { listPracticeSets().then(setSets).catch(() => {}) }, [])

  const create = async () => {
    if (!selectedMaterial || busy) return
    setBusy(true); setError('')
    try {
      setCurrent(await createPracticeSet(selectedMaterial)); setChoices({})
      setSets(await listPracticeSets())
    } catch { setError('Chưa thể tạo bài luyện từ tài liệu này. Hãy thử lại sau.') }
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
      setSets(await listPracticeSets())
    } catch { setError('Không thể nộp bài luyện. Hãy thử lại.') }
    finally { setBusy(false) }
  }

  return <View style={{ ...card, gap: 12 }}>
    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>Bài luyện từ tài liệu lớp học</Text>
    <Text style={{ color: '#64748b' }}>Bài luyện tách khỏi điểm thi. Câu hỏi do AI tạo nên hãy đối chiếu với tài liệu.</Text>
    {materials.map((material) => <TouchableOpacity key={material.id} accessibilityRole="button"
      onPress={() => setSelectedMaterial(material.id)} style={{ padding: 10, borderRadius: 10,
        backgroundColor: selectedMaterial === material.id ? '#dbeafe' : '#f1f5f9' }}>
      <Text>{material.title || material.fileName}</Text>
    </TouchableOpacity>)}
    <TouchableOpacity accessibilityRole="button" disabled={!selectedMaterial || busy} onPress={() => void create()}
      style={{ padding: 12, borderRadius: 10, backgroundColor: '#2563eb', opacity: !selectedMaterial || busy ? 0.5 : 1 }}>
      <Text style={{ textAlign: 'center', color: '#fff', fontWeight: '700' }}>Tạo 5 câu ôn tập</Text>
    </TouchableOpacity>
    {!!error && <Text accessibilityRole="alert" style={{ color: '#b91c1c' }}>{error}</Text>}
    {sets.map((set) => <TouchableOpacity key={set.id} accessibilityRole="button" onPress={() => void open(set.id)}>
      <Text style={{ color: '#2563eb' }}>{set.subject.name} · {set.completedAt ? `${set.score}/${set._count.items}` : 'Chưa nộp'}</Text>
    </TouchableOpacity>)}
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
