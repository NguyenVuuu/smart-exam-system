import { BackToTopScrollView } from '../../../src/components/ui/BackToTop'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { ChartNoAxesColumn, RefreshCw, Search, Star, Trophy, X } from 'lucide-react-native'
import { useRequireAuth } from '../../../src/hooks/useRequireAuth'
import { getStudentScores, type StudentScore } from '../../../src/api/student-portal.api'
import { getStudentSubjects } from '../../../src/api/student-subjects.api'
import StudentLayout from '../../../src/components/student/StudentLayout'
import type { SemesterOption, SubjectCard } from '../../../src/types/subjects.types'
import type { ExamType } from '../../../src/types/course-detail.types'

const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  MIDTERM: 'Giữa kỳ', FINAL: 'Cuối kỳ', QUIZ: 'Thường kỳ',
}

function fmtScore(s: number) { return Number.isInteger(s) ? String(s) : s.toFixed(1) }

function scoreColor(s: number) {
  if (s >= 8) return '#16a34a'
  if (s >= 5) return '#ca8a04'
  return '#dc2626'
}

function calcWeightedAvg(items: StudentScore[]): number | null {
  const quizzes = items.filter(i => i.type === 'QUIZ').slice(0, 3)
  const midterm = items.find(i => i.type === 'MIDTERM')
  const final   = items.find(i => i.type === 'FINAL')
  const parts = [
    ...quizzes.map(i => ({ s: i.score, w: 1 })),
    ...(midterm ? [{ s: midterm.score, w: 2 }] : []),
    ...(final   ? [{ s: final.score,   w: 3 }] : []),
  ]
  if (!parts.length) return null
  const tw = parts.reduce((a, b) => a + b.w, 0)
  const ts = parts.reduce((a, b) => a + b.s * b.w, 0)
  return ts / tw
}

function MetricCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 24, fontWeight: '800', color }}>{value}</Text>
    </View>
  )
}

export default function ScoresScreen() {
  const { isInitialized, isAuthenticated } = useRequireAuth()
  const [scores, setScores] = useState<StudentScore[]>([])
  const [semesterOptions, setSemesterOptions] = useState<SemesterOption[]>([])
  const [subjects, setSubjects] = useState<SubjectCard[]>([])
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('ALL')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (semId?: string) => {
    setLoading(true); setError(null)
    try {
      const subData = await getStudentSubjects({ page: 1, pageSize: 100, semesterId: semId })
      const resolved = semId || subData.currentSemesterId || subData.semesterOptions[0]?.id || ''
      const scoreData = await getStudentScores({ semesterId: resolved || undefined })
      setSemesterOptions(subData.semesterOptions)
      setSelectedSemesterId(resolved)
      setSubjects(subData.items)
      setSelectedCourseId('ALL')
      setScores(scoreData.items)
    } catch {
      setError('Không thể tải điểm số.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return scores.filter(item => {
      const matchCourse = selectedCourseId === 'ALL' || item.courseOfferingId === selectedCourseId
      const matchKw = !kw || [item.title, item.courseCode, item.subjectName].some(v => v.toLowerCase().includes(kw))
      return matchCourse && matchKw
    })
  }, [scores, selectedCourseId, keyword])

  const avgScore = selectedCourseId !== 'ALL' ? calcWeightedAvg(filtered) : null
  const maxScore = filtered.length ? Math.max(...filtered.map(i => i.score)) : null

  if (!isInitialized || !isAuthenticated) return null

  return (
    <StudentLayout activeRoute="scores">
      <BackToTopScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
              <ChartNoAxesColumn size={20} color="#2563eb" />
            </View>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>Điểm số</Text>
              <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Tổng hợp điểm đã công bố</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => void load(selectedSemesterId)} disabled={loading} style={{ paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', opacity: loading ? 0.5 : 1, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <RefreshCw size={14} color="#475569" /><Text style={{ fontSize: 12, fontWeight: '600', color: '#475569' }}>Làm mới</Text>
          </TouchableOpacity>
        </View>

        {/* Metrics */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <MetricCard label="Bài có điểm" value={filtered.length} color="#2563eb" />
          <MetricCard label="TB môn" value={avgScore !== null ? fmtScore(avgScore) : '-'} color="#16a34a" />
          <MetricCard label="Cao nhất" value={maxScore !== null ? fmtScore(maxScore) : '-'} color="#ca8a04" />
        </View>

        {/* Filters */}
        {!loading && !error && (
          <View style={{ gap: 8, marginBottom: 16 }}>
            {semesterOptions.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {semesterOptions.map(s => (
                    <TouchableOpacity key={s.id} onPress={() => { setSelectedSemesterId(s.id); void load(s.id) }}
                      style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: selectedSemesterId === s.id ? '#2563eb' : '#fff', borderWidth: 1, borderColor: selectedSemesterId === s.id ? '#2563eb' : '#e2e8f0' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: selectedSemesterId === s.id ? '#fff' : '#475569' }}>{s.name}</Text>
                        {s.isCurrent && <Star size={12} fill={selectedSemesterId === s.id ? '#fff' : '#2563eb'} color={selectedSemesterId === s.id ? '#fff' : '#2563eb'} />}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
            {subjects.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {[{ courseOfferingId: 'ALL', subjectCode: 'ALL', subjectName: 'Tất cả môn' }, ...subjects].map(s => (
                    <TouchableOpacity key={s.courseOfferingId} onPress={() => setSelectedCourseId(s.courseOfferingId)}
                      style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: selectedCourseId === s.courseOfferingId ? '#6366f1' : '#fff', borderWidth: 1, borderColor: selectedCourseId === s.courseOfferingId ? '#6366f1' : '#e2e8f0' }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: selectedCourseId === s.courseOfferingId ? '#fff' : '#475569' }}>
                        {s.courseOfferingId === 'ALL' ? 'Tất cả môn' : s.subjectCode}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, height: 42 }}>
              <Search size={17} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput style={{ flex: 1, fontSize: 13, color: '#0f172a' }} placeholder="Tìm bài thi hoặc môn học..." placeholderTextColor="#94a3b8" value={keyword} onChangeText={setKeyword} />
              {keyword ? <TouchableOpacity onPress={() => setKeyword('')}><X size={16} color="#94a3b8" /></TouchableOpacity> : null}
            </View>
          </View>
        )}

        {loading && <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2563eb" />}
        {!loading && error && (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={{ color: '#ef4444', marginBottom: 12 }}>{error}</Text>
            <TouchableOpacity onPress={() => void load()} style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#2563eb', borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}
        {!loading && !error && filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Trophy size={34} color="#94a3b8" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#94a3b8', fontSize: 13 }}>Chưa có điểm phù hợp.</Text>
          </View>
        )}
        {!loading && !error && filtered.length > 0 && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } }}>
            <View style={{ flexDirection: 'row', backgroundColor: '#f8fafc', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
              <Text style={{ flex: 1, fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Bài đánh giá</Text>
              <Text style={{ width: 56, fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>Loại</Text>
              <Text style={{ width: 52, fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', textAlign: 'right' }}>Điểm</Text>
            </View>
            {filtered.map((item, i) => (
              <TouchableOpacity
                key={`${item.courseOfferingId}-${item.examId}`}
                onPress={() => router.push(`/(app)/(student)/course/${item.courseOfferingId}/exam/${item.examId}/result?attemptId=${item.attemptId}` as never)}
                activeOpacity={0.75}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: i === filtered.length - 1 ? 0 : 1, borderBottomColor: '#f8fafc' }}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }} numberOfLines={1}>{item.title}</Text>
                  <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }} numberOfLines={1}>{item.courseCode} · {item.subjectName}</Text>
                </View>
                <View style={{ width: 56, paddingHorizontal: 4, paddingVertical: 3, borderRadius: 6, backgroundColor: '#f1f5f9', alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: '#475569' }}>{EXAM_TYPE_LABELS[item.type]}</Text>
                </View>
                <Text style={{ width: 52, fontSize: 18, fontWeight: '800', color: scoreColor(item.score), textAlign: 'right' }}>{fmtScore(item.score)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </BackToTopScrollView>
    </StudentLayout>
  )
}
