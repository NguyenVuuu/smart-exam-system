import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useRequireAuth } from '../../../../../../src/hooks/useRequireAuth'
import { usePostDetail } from '../../../../../../src/hooks/useCourseDetail'
import StudentLayout from '../../../../../../src/components/student/StudentLayout'

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  const date = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  return `${time} - ${date}`
}

export default function PostDetailScreen() {
  const { isInitialized, isAuthenticated } = useRequireAuth()
  const { courseOfferingId, postId } = useLocalSearchParams<{ courseOfferingId: string; postId: string }>()
  const { data: post, isLoading, error } = usePostDetail(courseOfferingId ?? '', postId ?? '')

  if (!isInitialized || !isAuthenticated) return null

  return (
    <StudentLayout activeRoute="subjects">
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, color: '#64748b' }}>←</Text>
            <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '500' }}>Quay lại</Text>
          </TouchableOpacity>

          {isLoading && (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          )}

          {error && (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ color: '#ef4444', marginBottom: 12 }}>{error}</Text>
              <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#2563eb', borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Quay lại</Text>
              </TouchableOpacity>
            </View>
          )}

          {post && (
            <>
              {/* Header */}
              <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, borderWidth: 1, borderColor: '#f1f5f9' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#eff6ff' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#1d4ed8', textTransform: 'uppercase' }}>Bài đăng</Text>
                  </View>
                  {post.edited && (
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#f8fafc' }}>
                      <Text style={{ fontSize: 10, color: '#94a3b8' }}>Đã chỉnh sửa</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', lineHeight: 26, marginBottom: 10 }}>{post.title}</Text>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>🕐 Đăng lúc {fmtDateTime(post.publishedAt)}</Text>
              </View>

              {/* Content */}
              <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, borderWidth: 1, borderColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 14, color: '#334155', lineHeight: 24 }}>{post.content}</Text>
              </View>

              {/* Attachments */}
              {post.attachments.length > 0 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, borderWidth: 1, borderColor: '#f1f5f9' }}>
                  <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>
                      📎 Tệp đính kèm ({post.attachments.length})
                    </Text>
                  </View>
                  {post.attachments.map((att, i) => (
                    <View key={att.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: i === post.attachments.length - 1 ? 0 : 1, borderBottomColor: '#f8fafc' }}>
                      <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Text style={{ fontSize: 18 }}>📄</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a' }} numberOfLines={1}>{att.fileName}</Text>
                        <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{att.fileType} · {att.fileSize}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
    </StudentLayout>
  )
}
