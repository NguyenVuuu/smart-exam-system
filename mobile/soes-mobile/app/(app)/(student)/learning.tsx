import { BackToTopScrollView } from '../../../src/components/ui/BackToTop'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View, type ScrollViewInstance } from 'react-native'
import { ArrowRight, BookOpenCheck, Bot, Lightbulb, MessageCircle, Send, Target } from 'lucide-react-native'
import { useRequireAuth } from '../../../src/hooks/useRequireAuth'
import { askLearningAgent, getLearningAgentError, getLearningConversation, getLearningInsights, getStudyMaterials, listLearningConversations,
  type LearningConversationSummary, type LearningConversationTurn, type StudentLearningInsights, type StudyMaterial } from '../../../src/api/student-learning.api'
import StudentLayout from '../../../src/components/student/StudentLayout'
import { StudentConversationHistory } from '../../../src/components/student/StudentConversationHistory'
import StudentPracticeSection from '../../../src/components/student/StudentPracticeSection'
import { ChoicePicker } from '../../../src/components/ui/ChoicePicker'
import { scrollToFocusedInput } from '../../../src/utils/keyboardScroll'

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
  const [topicSubjectId, setTopicSubjectId] = useState('')
  const [loading, setLoading] = useState(true)
  const [asking, setAsking] = useState(false)
  const [pendingMessage, setPendingMessage] = useState('')
  const [error, setError] = useState('')
  const [practiceRequest, setPracticeRequest] = useState<{ topicId: string; requestId: number } | null>(null)
  const scrollRef = useRef<ScrollViewInstance>(null)
  const questionRef = useRef<React.ElementRef<typeof TextInput>>(null)
  const focusInput = (input: React.ElementRef<typeof TextInput> | null) => scrollToFocusedInput(scrollRef.current, { current: input }, 16)

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

  const topicSubjects = useMemo(() => Array.from(new Map(
    (insights?.topics ?? []).map((topic) => [topic.subjectId, {
      id: topic.subjectId,
      name: topic.subjectName,
    }]),
  ).values()), [insights?.topics])

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
    setPendingMessage(message)
    setQuestion('')
    setError('')
    const request = conversationRequest.current
    try {
      const result = await askLearningAgent(message, materialId, conversationId || undefined)
      if (request !== conversationRequest.current) return
      setConversationId(result.conversationId)
      setTurns((current) => [...current, { id: `${Date.now()}-${current.length}`, message,
        answer: result.answer, createdAt: new Date().toISOString() }])
      void listLearningConversations(materialId).then((items) => {
        if (request === conversationRequest.current) setConversations(items)
      }).catch(() => {})
    } catch (cause) {
      if (request === conversationRequest.current) {
        setQuestion((current) => current || message)
        setError(getLearningAgentError(cause, 'Trợ lý hiện chưa thể trả lời. Hãy thử lại sau.'))
      }
    } finally {
      setAsking(false)
      setPendingMessage('')
    }
  }
  const subjects = Array.from(new Map(materials.map((item) => [item.courseOffering.subject.id, item.courseOffering.subject])).values())
  const subjectMaterials = materials.filter((item) => item.courseOffering.subject.id === subjectId)
  const selectedTopicSubjectId = topicSubjects.some((subject) => subject.id === topicSubjectId)
    ? topicSubjectId
    : topicSubjects[0]?.id ?? ''
  const visibleTopics = (insights?.topics ?? []).filter((topic) => topic.subjectId === selectedTopicSubjectId)
  const recommendTopic = (topic: StudentLearningInsights['topics'][number]) => {
    if (!topic.sufficientData) return {
      label: 'Cần thêm dữ liệu', color: '#b45309', backgroundColor: '#fffbeb',
      content: `Bạn mới có ${topic.questionCount} lượt trả lời trên ${topic.distinctQuestionCount} câu khác nhau về ${topic.name}. Hãy ôn thêm và làm các câu khác nhau; hệ thống cần ít nhất 5 lượt trên 3 câu để nhận định mức độ hiểu bài.`,
    }
    if (topic.percentage <= 40) return {
      label: 'Ưu tiên cao', color: '#b91c1c', backgroundColor: '#fef2f2',
      content: `Với ${topic.name}, hãy đọc lại phần tương ứng trong tài liệu lớp, tự giải thích khái niệm chính rồi làm câu nhận biết trước khi chuyển sang bài áp dụng. Sau mỗi câu sai, đối chiếu lời giải để tìm bước hiểu nhầm.`,
    }
    if (topic.needsPractice) return {
      label: 'Cần củng cố', color: '#b45309', backgroundColor: '#fffbeb',
      content: `Hãy luyện thêm câu hỏi mới về ${topic.name}, ưu tiên tình huống áp dụng. Với câu đã xem lại, thử giải thích vì sao đáp án đúng và các phương án còn lại sai trước khi mở lời giải.`,
    }
    return {
      label: 'Duy trì', color: '#047857', backgroundColor: '#ecfdf5',
      content: `Bạn đã có kết quả tốt ở ${topic.name}. Hãy thử câu vận dụng khác với câu đã làm và ôn xen kẽ cùng các chủ đề còn yếu để duy trì kiến thức.`,
    }
  }

  return <StudentLayout activeRoute="learning">
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <BackToTopScrollView ref={scrollRef} keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}>
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
          {topicSubjects.length > 0 && <ChoicePicker label="Môn học" placeholder="Chọn môn học"
            options={topicSubjects.map((subject) => ({ value: subject.id, label: subject.name }))}
            selectedValues={selectedTopicSubjectId ? [selectedTopicSubjectId] : []} onToggle={setTopicSubjectId} />}
          {visibleTopics.map((topic) => {
            const recommendation = recommendTopic(topic)
            return <View key={topic.topicId} style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', gap: 8 }}>
              <Text style={{ fontWeight: '700', color: '#0f172a' }}>{topic.name} · {topic.sufficientData ? `${topic.percentage}%` : 'Chưa đủ mẫu'}</Text>
              <Text style={{ fontSize: 12, color: topic.sufficientData ? '#64748b' : '#b45309' }}>
                {topic.questionCount} lượt trả lời trên {topic.distinctQuestionCount} câu · {topic.sufficientData ? 'Đủ dữ liệu để tham khảo' : 'Chưa đủ dữ liệu để kết luận'}
              </Text>
              <View style={{ padding: 10, borderRadius: 10, backgroundColor: '#f8fafc', gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Lightbulb size={16} color="#2563eb" />
                  <Text style={{ fontWeight: '700', color: '#1e293b' }}>Gợi ý nội dung</Text>
                  <Text style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
                    color: recommendation.color, backgroundColor: recommendation.backgroundColor, fontSize: 12, fontWeight: '700' }}>
                    {recommendation.label}
                  </Text>
                </View>
                <Text style={{ color: '#475569', lineHeight: 20 }}>{recommendation.content}</Text>
              </View>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Ôn chủ đề ${topic.name}`}
                onPress={() => {
                  setPracticeRequest({ topicId: topic.topicId, requestId: Date.now() })
                  setActiveTab('practice')
                }} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: '#1d4ed8', fontWeight: '700' }}>Ôn chủ đề này</Text>
                <ArrowRight size={16} color="#1d4ed8" />
              </TouchableOpacity>
            </View>
          })}
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
          turns={turns} pendingMessage={pendingMessage} material={materials.find((item) => item.id === materialId)} onSelect={(id) => void selectConversation(id)} />}
        <TextInput ref={questionRef} value={question} onChangeText={setQuestion} maxLength={500} multiline
          onFocus={() => focusInput(questionRef.current)}
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
      {activeTab === 'practice' && <StudentPracticeSection key={practiceRequest?.requestId ?? 'practice'}
        materials={materials} topics={insights?.topics ?? []} initialTopicId={practiceRequest?.topicId}
        onFocusInput={focusInput} />}
    </BackToTopScrollView>
    </KeyboardAvoidingView>
  </StudentLayout>
}
