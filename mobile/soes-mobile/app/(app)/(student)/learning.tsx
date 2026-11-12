import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { BookOpenCheck, Send } from 'lucide-react-native'
import { useRequireAuth } from '../../../src/hooks/useRequireAuth'
import { askLearningAgent, getLearningInsights, getStudyMaterials, type LearningAnswer, type StudentLearningInsights, type StudyMaterial } from '../../../src/api/student-learning.api'
import StudentLayout from '../../../src/components/student/StudentLayout'

export default function StudentLearningScreen() {
  const { isInitialized, isAuthenticated } = useRequireAuth()
  const [insights, setInsights] = useState<StudentLearningInsights | null>(null)
  const [answer, setAnswer] = useState<LearningAnswer | null>(null)
  const [question, setQuestion] = useState('')
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [materialId, setMaterialId] = useState('')
  const [answeredFromMaterial, setAnsweredFromMaterial] = useState('')
  const [loading, setLoading] = useState(true)
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return
    let active = true
    getLearningInsights()
      .then((data) => { if (active) setInsights(data) })
      .catch(() => { if (active) setError('Không thể tải dữ liệu học tập.') })
      .finally(() => { if (active) setLoading(false) })
    getStudyMaterials().then((data) => { if (active) setMaterials(data) }).catch(() => {})
    return () => { active = false }
  }, [isAuthenticated, isInitialized])

  const ask = async () => {
    const message = question.trim()
    if (!message || asking) return
    setAsking(true)
    setError('')
    try {
      setAnswer(await askLearningAgent(message, materialId || undefined))
      setAnsweredFromMaterial(materialId)
      setQuestion('')
    } catch {
      setError('Trợ lý hiện chưa thể trả lời. Hãy thử lại sau.')
    } finally {
      setAsking(false)
    }
  }

  return <StudentLayout activeRoute="learning">
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ padding: 10, borderRadius: 12, backgroundColor: '#eff6ff' }}><BookOpenCheck size={22} color="#2563eb" /></View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>Trợ lý học tập</Text>
          <Text style={{ fontSize: 13, color: '#64748b' }}>Gợi ý ôn tập từ kết quả đã công bố</Text>
        </View>
      </View>

      <View style={{ padding: 16, borderRadius: 16, backgroundColor: '#fff', gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>Chủ đề cần chú ý</Text>
        {loading && <ActivityIndicator color="#2563eb" />}
        {insights && <>
          <Text style={{ fontSize: 13, color: '#64748b' }}>{insights.analyzedAttemptCount} lượt thi đủ điều kiện xem lại
            {insights.limitedToRecentAttempts ? ' · chỉ các lượt gần đây' : ''}
          </Text>
          {insights.topics.length === 0 && <Text style={{ color: '#64748b' }}>Chưa đủ dữ liệu từ kết quả được phép xem lại để xác định chủ đề yếu. Bạn có thể chọn tài liệu lớp học để ôn tập.</Text>}
          {insights.topics.map((topic) => <View key={topic.topicId} style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
            <Text style={{ fontWeight: '700', color: '#0f172a' }}>{topic.name} · {topic.percentage}%</Text>
            <Text style={{ fontSize: 12, color: topic.sufficientData ? '#64748b' : '#b45309' }}>
              {topic.questionCount} câu · {topic.sufficientData ? 'Đủ dữ liệu để tham khảo' : 'Chưa đủ dữ liệu để kết luận'}
            </Text>
          </View>)}
        </>}
      </View>

      <View style={{ padding: 16, borderRadius: 16, backgroundColor: '#fff', gap: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>Hỏi trợ lý</Text>
        <Text style={{ color: '#64748b' }}>Chọn tài liệu lớp học để hỏi về nội dung ôn tập.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <TouchableOpacity onPress={() => setMaterialId('')} accessibilityRole="button"
            style={{ padding: 10, borderRadius: 10, backgroundColor: materialId ? '#f1f5f9' : '#dbeafe' }}>
            <Text>Chỉ kết quả thi</Text>
          </TouchableOpacity>
          {materials.map((material) => <TouchableOpacity key={material.id} onPress={() => setMaterialId(material.id)}
            accessibilityRole="button" style={{ padding: 10, borderRadius: 10, backgroundColor: materialId === material.id ? '#dbeafe' : '#f1f5f9' }}>
            <Text>{material.title || material.fileName}</Text>
          </TouchableOpacity>)}
        </ScrollView>
        <TextInput value={question} onChangeText={setQuestion} maxLength={500} multiline
          placeholder="Ví dụ: Tôi nên ôn chủ đề nào trước?" accessibilityLabel="Câu hỏi cho trợ lý học tập"
          style={{ minHeight: 80, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', textAlignVertical: 'top' }} />
        <TouchableOpacity accessibilityRole="button" onPress={() => void ask()} disabled={asking || !question.trim()}
          style={{ minHeight: 46, borderRadius: 10, backgroundColor: '#2563eb', opacity: asking || !question.trim() ? 0.5 : 1,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Send size={16} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700' }}>{asking ? 'Đang phân tích...' : 'Gửi'}</Text>
        </TouchableOpacity>
        {!!error && <Text accessibilityRole="alert" style={{ color: '#b91c1c' }}>{error}</Text>}
        {answer && <View style={{ padding: 14, borderRadius: 12, backgroundColor: '#eff6ff', gap: 8 }}>
          <Text style={{ color: '#0f172a', fontWeight: '600' }}>{answer.summary}</Text>
          {answer.actions.map((action, index) => <Text key={index} style={{ color: '#334155' }}>• {action}</Text>)}
          {!!answer.caveat && <Text style={{ color: '#64748b' }}>{answer.caveat}</Text>}
          {!!answeredFromMaterial && answer.evidenceIds.includes(answeredFromMaterial) && <Text style={{ color: '#1d4ed8', fontSize: 12 }}>
            Nguồn: {materials.find((item) => item.id === answeredFromMaterial)?.title || materials.find((item) => item.id === answeredFromMaterial)?.fileName}
          </Text>}
          <Text style={{ fontSize: 12, color: '#64748b' }}>Đề xuất AI chỉ để tham khảo; hãy đối chiếu với giảng viên.</Text>
        </View>}
      </View>
    </ScrollView>
  </StudentLayout>
}
