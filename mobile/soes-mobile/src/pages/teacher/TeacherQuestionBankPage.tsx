import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { listQuestions, shareQuestion } from '../../api/teacher-questions.api'
import { QuestionCard } from '../../components/teacher/question-bank/QuestionCard'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ScreenState } from '../../components/ui/ScreenState'
import { SearchField } from '../../components/ui/SearchField'
import { ChoicePicker } from '../../components/ui/ChoicePicker'
import { PaginationControls } from '../../components/ui/PaginationControls'
import { TeacherQuestionEditorPage } from './TeacherQuestionEditorPage'
import type { QuestionPage, QuestionType, TeacherQuestion } from '../../types/teacher-questions.types'

type Scope = 'personal' | 'shared' | 'archived'
const scopes: { key: Scope; label: string }[] = [
  { key: 'personal', label: 'Cá nhân' }, { key: 'shared', label: 'Dùng chung' }, { key: 'archived', label: 'Đã lưu trữ' },
]
const questionTypes = [
  { value: 'ALL', label: 'Tất cả loại câu hỏi' }, { value: 'SINGLE_CHOICE', label: 'Một đáp án' },
  { value: 'MULTIPLE_CHOICE', label: 'Nhiều đáp án' }, { value: 'TRUE_FALSE', label: 'Đúng/sai' },
  { value: 'PROGRAMMING', label: 'Lập trình' },
]

export function TeacherQuestionBankPage() {
  const [scope, setScope] = useState<Scope>('personal')
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState<QuestionType | 'ALL'>('ALL')
  const [items, setItems] = useState<TeacherQuestion[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [editing, setEditing] = useState<TeacherQuestion | 'new' | null>(null)
  const [sharingId, setSharingId] = useState<string | null>(null)
  const requestId = useRef(0)
  const filters = useCallback((nextScope: Scope, query: string, nextType: QuestionType | 'ALL') => ({
    scope: nextScope === 'shared' ? 'SHARED' as const : 'PERSONAL' as const,
    archived: nextScope === 'archived', keyword: query, type: nextType === 'ALL' ? undefined : nextType,
  }), [])
  const applyPage = useCallback((result: QuestionPage, nextPage: number) => {
    setItems(result.items)
    setPage(nextPage); setTotalPages(result.pagination.totalPages); setError(false)
  }, [])
  const load = useCallback(async (nextPage: number, nextScope: Scope, query: string, nextType: QuestionType | 'ALL') => {
    const currentRequest = ++requestId.current
    setLoading(true)
    try {
      const result = await listQuestions(nextPage, filters(nextScope, query, nextType))
      if (currentRequest === requestId.current) applyPage(result, nextPage)
    } catch { if (currentRequest === requestId.current) setError(true) }
    finally { if (currentRequest === requestId.current) { setLoading(false); setRefreshing(false) } }
  }, [filters, applyPage])
  useEffect(() => {
    requestId.current += 1
    const timer = setTimeout(() => { setItems([]); void load(1, scope, keyword, type) }, 250)
    return () => { clearTimeout(timer); requestId.current += 1 }
  }, [scope, keyword, type, load])
  function confirmShare(question: TeacherQuestion) {
    Alert.alert('Gửi câu hỏi', 'Gửi câu hỏi vào ngân hàng chung để nhóm duyệt?', [
      { text: 'Hủy', style: 'cancel' }, { text: 'Gửi duyệt', onPress: () => {
        if (sharingId) return
        setSharingId(question.id)
        void shareQuestion(question.id).then(() => { Alert.alert('Đã gửi', 'Câu hỏi đang chờ duyệt.'); return load(page || 1, scope, keyword, type) })
          .catch(() => Alert.alert('Không thể gửi', 'Câu hỏi có thể đã được gửi hoặc chưa đạt yêu cầu.'))
          .finally(() => setSharingId(null))
      } },
    ])
  }

  if (editing) return <TeacherQuestionEditorPage initial={editing === 'new' ? null : editing}
    onCancel={() => setEditing(null)} onDone={() => { setEditing(null); setScope('personal'); void load(1, 'personal', keyword, type) }} />
  return <View style={styles.root}>
    <View style={styles.header}><ScreenHeader title="Ngân hàng câu hỏi" description="Xem câu hỏi cá nhân và câu đã được duyệt dùng chung" />
      <Pressable accessibilityRole="button" style={styles.create} onPress={() => setEditing('new')}><Text style={styles.createText}>Tạo câu trắc nghiệm</Text></Pressable>
      <SearchField value={keyword} onChangeText={setKeyword} placeholder="Tìm câu hỏi" />
      <ChoicePicker label="Loại câu hỏi" placeholder="Tất cả loại câu hỏi" options={questionTypes} selectedValues={[type]}
        onToggle={(value) => setType(value as QuestionType | 'ALL')} />
      <View style={styles.tabs}>{scopes.map((entry) => <Pressable key={entry.key} accessibilityRole="button"
        onPress={() => setScope(entry.key)} style={[styles.tab, scope === entry.key && styles.active]}>
        <Text style={[styles.tabText, scope === entry.key && styles.activeText]}>{entry.label}</Text></Pressable>)}</View>
    </View>
    {loading && items.length === 0 ? <ScreenState kind="loading" /> : error && items.length === 0 ? <ScreenState kind="error" onRetry={() => void load(1, scope, keyword, type)} /> :
      <FlatList data={items} keyExtractor={(question) => question.id} renderItem={({ item }) => <QuestionCard question={item}
        onEdit={scope === 'personal' && item.type !== 'PROGRAMMING' &&
          (!item.sharedBank || item.sharedBank.status === 'REJECTED' || Boolean(item.sharedBank.removedAt)) ? () => setEditing(item) : undefined}
        onShare={scope === 'personal' && !sharingId && !item.archivedAt &&
          (!item.sharedBank || item.sharedBank.status === 'REJECTED' || Boolean(item.sharedBank.removedAt)) ? () => confirmShare(item) : undefined} />}
        contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<ScreenState kind="empty" message="Chưa có câu hỏi phù hợp." />}
        ListFooterComponent={<>{error && <Text style={styles.error}>Không thể tải trang này.</Text>}
          <PaginationControls page={page} totalPages={totalPages} loading={loading} onPage={(next) => void load(next, scope, keyword, type)} /></>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(page || 1, scope, keyword, type) }} />} />}
  </View>
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { padding: 16, paddingBottom: 0 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tab: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff' },
  active: { backgroundColor: '#2563eb', borderColor: '#2563eb' }, tabText: { color: '#475569', fontWeight: '600', fontSize: 13 }, activeText: { color: '#fff' },
  list: { padding: 16, paddingBottom: 32, flexGrow: 1 }, error: { color: '#b91c1c', textAlign: 'center', padding: 12 },
  create: { minHeight: 44, paddingHorizontal: 12, alignSelf: 'flex-start', justifyContent: 'center', borderRadius: 10, backgroundColor: '#2563eb', marginBottom: 12 },
  createText: { color: '#fff', fontWeight: '700' },
})
