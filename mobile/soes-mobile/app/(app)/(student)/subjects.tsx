import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  FlatList, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useRequireAuth } from '../../../src/hooks/useRequireAuth'
import { useStudentSubjects } from '../../../src/hooks/useStudentSubjects'
import StudentLayout from '../../../src/components/student/StudentLayout'
import type { SubjectCard } from '../../../src/types/subjects.types'

function SubjectCardItem({ subject }: { subject: SubjectCard }) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/(student)/course/${subject.courseOfferingId}` as never)}
      style={{
        flex: 1, minWidth: 200,
        backgroundColor: '#fff', borderRadius: 16, padding: 16,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 }, borderWidth: 1, borderColor: '#f1f5f9',
        margin: 5,
      }}
      activeOpacity={0.75}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 20 }}>📖</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {subject.subjectCode}
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginTop: 2, lineHeight: 18 }} numberOfLines={2}>
            {subject.subjectName}
          </Text>
        </View>
      </View>

      {/* Teacher */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Text style={{ fontSize: 12 }}>👨‍🏫</Text>
        <Text style={{ fontSize: 12, color: '#64748b' }} numberOfLines={1}>{subject.teacherName}</Text>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 11 }}>📝</Text>
          <Text style={{ fontSize: 11, color: '#64748b' }}>{subject.postCount} bài đăng</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 11 }}>📋</Text>
          <Text style={{ fontSize: 11, color: '#64748b' }}>{subject.examCount} bài thi</Text>
        </View>
      </View>

      {/* Button */}
      <View style={{ backgroundColor: '#eff6ff', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563eb' }}>Vào môn học →</Text>
      </View>
    </TouchableOpacity>
  )
}

function SkeletonCard() {
  return (
    <View style={{ flex: 1, minWidth: 200, backgroundColor: '#f1f5f9', borderRadius: 16, height: 180, margin: 5 }} />
  )
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    if (totalPages <= 5) return i + 1
    if (page <= 3) return i + 1
    if (page >= totalPages - 2) return totalPages - 4 + i
    return page - 2 + i
  })
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 16 }}>
      <TouchableOpacity
        onPress={() => onPageChange(page - 1)} disabled={page <= 1}
        style={{ width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', opacity: page <= 1 ? 0.4 : 1 }}
      >
        <Text style={{ color: '#64748b', fontSize: 16 }}>‹</Text>
      </TouchableOpacity>
      {pages.map(p => (
        <TouchableOpacity
          key={p} onPress={() => onPageChange(p)}
          style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: p === page ? '#2563eb' : '#fff', borderWidth: 1, borderColor: p === page ? '#2563eb' : '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: p === page ? '#fff' : '#475569' }}>{p}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        onPress={() => onPageChange(page + 1)} disabled={page >= totalPages}
        style={{ width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', opacity: page >= totalPages ? 0.4 : 1 }}
      >
        <Text style={{ color: '#64748b', fontSize: 16 }}>›</Text>
      </TouchableOpacity>
    </View>
  )
}

export default function SubjectsScreen() {
  const { isInitialized, isAuthenticated } = useRequireAuth()
  const {
    items, pagination, semesterOptions, currentSemesterId,
    isLoading, error, keyword, setKeyword, setPage, onSemesterChange, retry,
  } = useStudentSubjects()

  if (!isInitialized || !isAuthenticated) return null

  return (
    <StudentLayout activeRoute="subjects">
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {/* Page title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18 }}>📖</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>Môn Học Của Tôi</Text>
          </View>

          {/* Toolbar */}
          {!isLoading && !error && (
            <View style={{ gap: 8, marginBottom: 16 }}>
              {/* Search */}
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, height: 42 }}>
                <Text style={{ fontSize: 14, color: '#94a3b8', marginRight: 8 }}>🔍</Text>
                <TextInput
                  style={{ flex: 1, fontSize: 13, color: '#0f172a' }}
                  placeholder="Tìm kiếm môn học..."
                  placeholderTextColor="#94a3b8"
                  value={keyword}
                  onChangeText={setKeyword}
                />
                {keyword ? (
                  <TouchableOpacity onPress={() => setKeyword('')}>
                    <Text style={{ color: '#94a3b8', fontSize: 16 }}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Semester filter */}
              {semesterOptions.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {semesterOptions.map(s => (
                      <TouchableOpacity
                        key={s.id} onPress={() => onSemesterChange(s.id)}
                        style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: currentSemesterId === s.id ? '#2563eb' : '#fff', borderWidth: 1, borderColor: currentSemesterId === s.id ? '#2563eb' : '#e2e8f0' }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: currentSemesterId === s.id ? '#fff' : '#475569' }}>
                          {s.name}{s.isCurrent ? ' ✦' : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          )}

          {/* Loading */}
          {isLoading && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -5 }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </View>
          )}

          {/* Error */}
          {!isLoading && error && (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Text style={{ fontSize: 14, color: '#ef4444', marginBottom: 12 }}>{error}</Text>
              <TouchableOpacity onPress={retry} style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#2563eb', borderRadius: 10 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Empty */}
          {!isLoading && !error && items.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📚</Text>
              <Text style={{ fontSize: 14, color: '#94a3b8' }}>Không có môn học trong học kỳ này.</Text>
            </View>
          )}

          {/* Grid */}
          {!isLoading && !error && items.length > 0 && (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -5 }}>
                {items.map(s => <SubjectCardItem key={s.courseOfferingId} subject={s} />)}
              </View>
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
            </>
          )}
        </ScrollView>
    </StudentLayout>
  )
}
