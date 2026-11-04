import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useRequireAuth } from '../../../src/hooks/useRequireAuth'
import {
  getStudentNotifications, markNotificationRead, markAllNotificationsRead,
  type StudentNotification,
} from '../../../src/api/student-portal.api'
import StudentLayout from '../../../src/components/student/StudentLayout'

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '-'
  const date = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  return `${time} - ${date}`
}

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 24, fontWeight: '800', color }}>{value}</Text>
    </View>
  )
}

export default function NotificationsScreen() {
  const { isInitialized, isAuthenticated } = useRequireAuth()

  const [notifications, setNotifications] = useState<StudentNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true); setError(null)
    try {
      const data = await getStudentNotifications({ page: 1, pageSize: 50 })
      setNotifications(data.items)
    } catch {
      setError('Không thể tải thông báo.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications])

  const handleMarkRead = async (item: StudentNotification) => {
    if (item.isRead) return
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n))
    try {
      await markNotificationRead(item.id)
    } catch {
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: false } : n))
    }
  }

  const handleNotificationClick = async (item: StudentNotification) => {
    // Mark read
    void handleMarkRead(item)
    // Resolve route — mobile routes
    const target = resolveRoute(item)
    if (target) router.push(target as never)
  }

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return
    setMarkingAll(true)
    const prev = notifications
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    try {
      await markAllNotificationsRead()
    } catch {
      setNotifications(prev)
    } finally {
      setMarkingAll(false)
    }
  }

  if (!isInitialized || !isAuthenticated) return null

  function resolveRoute(item: StudentNotification): string | null {
    const link = item.link

    if (link) {
      // /student/course-offerings/{courseId}/exam-schedules/{scheduleId}/result?attemptId=...
      const resultMatch = link.match(/course-offerings\/([^/]+)\/exam-schedules\/([^/?]+).*[?&]attemptId=([^&]+)/)
      if (resultMatch) {
        return `/(app)/(student)/course/${resultMatch[1]}/exam/${resultMatch[2]}/result?attemptId=${resultMatch[3]}`
      }

      // /student/course-offerings/{courseId}/exam-schedules/{scheduleId}
      const examMatch = link.match(/course-offerings\/([^/]+)\/exam-schedules\/([^/?]+)/)
      if (examMatch) {
        return `/(app)/(student)/course/${examMatch[1]}/exam/${examMatch[2]}`
      }

      // /student/course-offerings/{courseId}/posts/{postId}
      const postMatch = link.match(/course-offerings\/([^/]+)\/posts\/([^/?]+)/)
      if (postMatch) {
        return `/(app)/(student)/course/${postMatch[1]}/post/${postMatch[2]}`
      }

      // /student/course-offerings/{courseId}
      const courseMatch = link.match(/course-offerings\/([^/?]+)/)
      if (courseMatch) {
        return `/(app)/(student)/course/${courseMatch[1]}`
      }

      // /student/scores
      if (link.includes('/scores')) return '/(app)/(student)/scores'

      // /student/exams → danh sách ca thi trong subjects
      if (link.includes('/exams')) return '/(app)/(student)/subjects'

      // /student/subjects
      if (link.includes('/subjects')) return '/(app)/(student)/subjects'

      // /student/notifications — đang ở trang này rồi
      if (link.includes('/notifications')) return null
    }

    // Fallback: đoán từ nội dung
    const text = `${item.title} ${item.content}`.toLowerCase()
    if (text.includes('điểm')) return '/(app)/(student)/scores'
    if (text.includes('bài thi') || text.includes('ca thi') || text.includes('lịch thi')) return '/(app)/(student)/subjects'
    return null
  }

  return (
    <StudentLayout activeRoute="notifications">
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {/* Title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#fef9c3', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18 }}>🔔</Text>
              </View>
              <View>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>Thông báo</Text>
                <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Cập nhật từ lớp học và hệ thống thi</Text>
              </View>
            </View>
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={handleMarkAllRead}
              disabled={isLoading || unreadCount === 0 || markingAll}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', opacity: (isLoading || unreadCount === 0) ? 0.5 : 1 }}
            >
              <Text style={{ fontSize: 14 }}>✓</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569' }}>Đánh dấu đã đọc</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => void load()}
              disabled={isLoading}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', opacity: isLoading ? 0.5 : 1 }}
            >
              <Text style={{ fontSize: 14 }}>↻</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569' }}>Làm mới</Text>
            </TouchableOpacity>
          </View>

          {/* Metrics */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <MetricCard label="Tổng thông báo" value={notifications.length} color="#2563eb" />
            <MetricCard label="Chưa đọc" value={unreadCount} color="#16a34a" />
          </View>

          {/* List */}
          {isLoading && <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2563eb" />}
          {!isLoading && error && (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ color: '#ef4444', marginBottom: 12 }}>{error}</Text>
              <TouchableOpacity onPress={() => void load()} style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#2563eb', borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          )}
          {!isLoading && !error && notifications.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🔔</Text>
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>Bạn chưa có thông báo nào.</Text>
            </View>
          )}
          {!isLoading && !error && notifications.length > 0 && (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } }}>
              <View style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>Danh sách thông báo</Text>
              </View>
              {notifications.map((item, i) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => void handleNotificationClick(item)}
                  activeOpacity={0.75}
                  style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: i === notifications.length - 1 ? 0 : 1, borderBottomColor: '#f8fafc', backgroundColor: item.isRead ? '#fff' : '#f8faff' }}
                >
                  {/* Dot */}
                  <View style={{ marginTop: 5, width: 8, height: 8, borderRadius: 4, backgroundColor: item.isRead ? '#cbd5e1' : '#2563eb', flexShrink: 0 }} />

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: item.isRead ? '500' : '700', color: '#0f172a', lineHeight: 18 }} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#64748b', marginTop: 3, lineHeight: 17 }} numberOfLines={3}>
                      {item.content}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>
                      {fmtDateTime(item.createdAt)}
                    </Text>
                  </View>

                  {item.isRead && (
                    <Text style={{ fontSize: 16, color: '#cbd5e1', marginTop: 2 }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
    </StudentLayout>
  )
}
