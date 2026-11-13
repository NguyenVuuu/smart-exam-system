import { BackToTopScrollView } from '../../../src/components/ui/BackToTop'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { BookOpenCheck, Bot, MessageCircle, Send, Target } from 'lucide-react-native'
import { useRequireAuth } from '../../../src/hooks/useRequireAuth'
import { askLearningAgent, getLearningAgentError, getLearningConversation, getLearningInsights, getStudyMaterials, listLearningConversations,
  type LearningConversationSummary, type LearningConversationTurn, type StudentLearningInsights, type StudyMaterial } from '../../../src/api/student-learning.api'
import StudentLayout from '../../../src/components/student/StudentLayout'
import { StudentConversationHistory } from '../../../src/components/student/StudentConversationHistory'
import StudentPracticeSection from '../../../src/components/student/StudentPracticeSection'
import { ChoicePicker } from '../../../src/components/ui/ChoicePicker'

export default function StudentLearningScreen() {
  const { isInitialized, isAuthenticated } = useRequireAuth()
  const [activeTab, setActiveTab] = useState<'ask' | 'practice' | 'topics'>('ask')
  const [insights, setInsights] = useState<StudentLearningInsights | null>(null)
  const [conversationId, setConversationId] = useState('')
  const [conversations, setConversations] = useState<LearningConversationSummary[]>([])
  const [turns, setTurns] = useState<LearningConversationTurn[]>([])
  const conversationRequest = useRef(0)
  const [question, setQuestion] = useState('')
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [materialId, setMaterialId] = useState('')
  const [subjectId, setSubjectId] = useState('')
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

  useEffect(() => {
    if (!materialId) return
    let active = true
    listLearningConversations(materialId)
      .then((items) => { if (active) setConversations(items) })
      .catch(() => { if (active) setError('Không thể tải lịch sử hội thoại.') })
    return () => { active = false }
  }, [materialId])

  const changeMaterial = (value: string) => {
    conversationRequest.current += 1
    setMaterialId(value)
    setConversationId('')
    setConversations([])
    setTurns([])
    setError('')
  }

  const selectConversation = async (id: string) => {
    const request = ++conversationRequest.current
    setConversationId(id)
    setTurns([])
    setError('')
    if (!id) return
    try {
      const history = await getLearningConversation(id, materialId)
      if (request === conversationRequest.current) setTurns(history)
    } catch (cause) {
      if (request === conversationRequest.current) {
        setConversationId('')
        setError(getLearningAgentError(cause, 'Không thể mở hội thoại.'))
      }
    }
  }

  const ask = async () => {
    const message = question.trim()
    if (!message || asking || !materialId) return
    setAsking(true)
    setError('')
    const request = conversationRequest.current
    try {
      const result = await askLearningAgent(message, materialId, conversationId || undefined)
      if (request !== conversationRequest.current) return
      setConversationId(result.conversationId)
      setTurns((current) => [...current, { id: `${Date.now()}-${current.length}`, message,
        answer: result.answer, createdAt: new Date().toISOString() }])
      setQuestion('')
      void listLearningConversations(materialId).then((items) => {
        if (request === conversationRequest.current) setConversations(items)
      }).catch(() => {})
    } catch (cause) {
      if (request === conversationRequest.current) setError(getLearningAgentError(cause, 'Trợ lý hiện chưa thể trả lời. Hãy thử lại sau.'))
    } finally {
      setAsking(false)
    }
  }
  const subjects = Array.from(new Map(materials.map((item) => [item.courseOffering.subject.id, item.courseOffering.subject])).values())
  const subjectMaterials = materials.filter((item) => item.courseOffering.subject.id === subjectId)

  return <StudentLayout activeRoute="learning">
    <BackToTopScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ padding: 10, borderRadius: 12, backgroundColor: '#eff6ff' }}><Bot size={22} color="#2563eb" /></View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>Trợ lý học tập</Text>
          <Text style={{ fontSize: 13, color: '#64748b' }}>Hỏi về tài liệu lớp học, luyện tập và xem chủ đề cần ôn.</Text>
        </View>
      </View>

      <View accessibilityRole="tablist" style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
        {([
          ['ask', 'Hỏi trợ lý', MessageCircle],
          ['practice', 'Bài luyện', BookOpenCheck],
          ['topics', 'Chủ đề', Target],
        ] as const).map(([key, label, Icon]) => <TouchableOpacity key={key} accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === key }} onPress={() => setActiveTab(key)}
          style={{ flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
            borderBottomWidth: 2, borderBottomColor: activeTab === key ? '#2563eb' : 'transparent' }}>
          <Icon size={16} color={activeTab === key ? '#1d4ed8' : '#64748b'} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: activeTab === key ? '#1d4ed8' : '#64748b' }}>{label}</Text>
        </TouchableOpacity>)}
      </View>

      {activeTab === 'topics' && <View style={{ padding: 16, borderRadius: 16, backgroundColor: '#fff', gap: 8 }}>
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
              {topic.questionCount} lượt trả lời · {topic.sufficientData ? 'Đủ dữ liệu để tham khảo' : 'Chưa đủ dữ liệu để kết luận'}
            </Text>
          </View>)}
        </>}
      </View>}

      {activeTab === 'ask' && <View style={{ padding: 16, borderRadius: 16, backgroundColor: '#fff', gap: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>Hỏi trợ lý</Text>
        <Text style={{ color: '#64748b' }}>Chọn tài liệu lớp học để hỏi về nội dung ôn tập.</Text>
        <ChoicePicker label="Môn học" placeholder="Chọn môn học" options={subjects.map((subject) => ({ value: subject.id, label: subject.name }))}
          selectedValues={subjectId ? [subjectId] : []} onToggle={(value) => { setSubjectId(value); changeMaterial('') }} />
        <ChoicePicker label="Tài liệu lớp học" placeholder={subjectId ? 'Chọn tài liệu' : 'Chọn môn học trước'}
          options={subjectMaterials.map((material) => ({ value: material.id, label: material.title || material.fileName,
            description: material.fileName }))} selectedValues={materialId ? [materialId] : []}
          onToggle={changeMaterial} disabled={!subjectId} />
        {materials.length === 0 && <Text style={{ color: '#64748b' }}>Chưa có tài liệu lớp học phù hợp để hỏi.</Text>}
        {!!materialId && <StudentConversationHistory conversations={conversations} currentId={conversationId}
          turns={turns} material={materials.find((item) => item.id === materialId)} onSelect={(id) => void selectConversation(id)} />}
        <TextInput value={question} onChangeText={setQuestion} maxLength={500} multiline
          placeholder="Ví dụ: Giải thích khái niệm trong tài liệu này." accessibilityLabel="Câu hỏi cho trợ lý học tập"
          style={{ minHeight: 80, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', textAlignVertical: 'top' }} />
        <TouchableOpacity accessibilityRole="button" onPress={() => void ask()} disabled={asking || !question.trim() || !materialId}
          style={{ minHeight: 46, borderRadius: 10, backgroundColor: '#2563eb', opacity: asking || !question.trim() || !materialId ? 0.5 : 1,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Send size={16} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700' }}>{asking ? 'Đang phân tích...' : 'Gửi'}</Text>
        </TouchableOpacity>
        {!!error && <Text accessibilityRole="alert" style={{ color: '#b91c1c' }}>{error}</Text>}
        {turns.length > 0 && <Text style={{ fontSize: 12, color: '#64748b' }}>Đề xuất AI chỉ để tham khảo; hãy đối chiếu với giảng viên.</Text>}
      </View>}
      {activeTab === 'practice' && <StudentPracticeSection materials={materials} topics={insights?.topics ?? []} />}
    </BackToTopScrollView>
  </StudentLayout>
}
