import { useCallback, useEffect, useRef, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { listQuestions } from '../../api/teacher-questions.api'
import { QuestionCard } from '../../components/teacher/question-bank/QuestionCard'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ScreenState } from '../../components/ui/ScreenState'
import { SearchField } from '../../components/ui/SearchField'
import { TeacherQuestionEditorPage } from './TeacherQuestionEditorPage'
import type { QuestionPage, TeacherQuestion } from '../../types/teacher-questions.types'

type Scope = 'personal' | 'shared' | 'archived'
const scopes: { key: Scope; label: string }[] = [
  { key: 'personal', label: 'Cá nhân' }, { key: 'shared', label: 'Dùng chung' }, { key: 'archived', label: 'Đã lưu trữ' },
]

export function TeacherQuestionBankPage() {
  const [scope, setScope] = useState<Scope>('personal')
  const [keyword, setKeyword] = useState('')
  const [items, setItems] = useState<TeacherQuestion[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [editing, setEditing] = useState<TeacherQuestion | 'new' | null>(null)
  const requestId = useRef(0)
  const filters = useCallback((nextScope: Scope, query: string) => ({
    scope: nextScope === 'shared' ? 'SHARED' as const : 'PERSONAL' as const,
    archived: nextScope === 'archived', keyword: query,
  }), [])
  const applyPage = useCallback((result: QuestionPage, nextPage: number) => {
    setItems((current) => nextPage === 1 ? result.items : [...current, ...result.items])
    setPage(nextPage); setTotalPages(result.pagination.totalPages); setError(false)
  }, [])
  const load = useCallback(async (nextPage: number, nextScope: Scope, query: string) => {
    const currentRequest = ++requestId.current
    try {
      const result = await listQuestions(nextPage, filters(nextScope, query))
      if (currentRequest === requestId.current) applyPage(result, nextPage)
    } catch { if (currentRequest === requestId.current) setError(true) }
    finally { if (currentRequest === requestId.current) { setLoading(false); setRefreshing(false) } }
  }, [filters, applyPage])
  useEffect(() => {
    requestId.current += 1
    const timer = setTimeout(() => { setItems([]); setLoading(true); void load(1, scope, keyword) }, 250)
    return () => { clearTimeout(timer); requestId.current += 1 }
  }, [scope, keyword, load])

  if (editing) return <TeacherQuestionEditorPage initial={editing === 'new' ? null : editing}
    onCancel={() => setEditing(null)} onDone={() => { setEditing(null); setScope('personal'); void load(1, 'personal', keyword) }} />
  return <View style={styles.root}>
    <View style={styles.header}><ScreenHeader title="Ngân hàng câu hỏi" description="Xem câu hỏi cá nhân và câu đã được duyệt dùng chung" />
      <Pressable accessibilityRole="button" style={styles.create} onPress={() => setEditing('new')}><Text style={styles.createText}>Tạo câu trắc nghiệm</Text></Pressable>
      <SearchField value={keyword} onChangeText={setKeyword} placeholder="Tìm câu hỏi" />
      <View style={styles.tabs}>{scopes.map((entry) => <Pressable key={entry.key} accessibilityRole="button"
        onPress={() => setScope(entry.key)} style={[styles.tab, scope === entry.key && styles.active]}>
        <Text style={[styles.tabText, scope === entry.key && styles.activeText]}>{entry.label}</Text></Pressable>)}</View>
    </View>
    {loading && items.length === 0 ? <ScreenState kind="loading" /> : error && items.length === 0 ? <ScreenState kind="error" onRetry={() => void load(1, scope, keyword)} /> :
      <FlatList data={items} keyExtractor={(question) => question.id} renderItem={({ item }) => <QuestionCard question={item}
        onEdit={scope === 'personal' && item.type !== 'PROGRAMMING' ? () => setEditing(item) : undefined} />}
        contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<ScreenState kind="empty" message="Chưa có câu hỏi phù hợp." />}
        ListFooterComponent={error ? <Text style={styles.error}>Không thể tải thêm câu hỏi.</Text> : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(1, scope, keyword) }} />}
        onEndReached={() => { if (!loading && !error && page < totalPages) { setLoading(true); void load(page + 1, scope, keyword) } }} onEndReachedThreshold={0.3} />}
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
