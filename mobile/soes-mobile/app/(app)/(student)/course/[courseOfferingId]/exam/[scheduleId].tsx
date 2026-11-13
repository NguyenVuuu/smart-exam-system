import { BackToTopScrollView } from '../../../../../../src/components/ui/BackToTop'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Camera, CircleCheck, CircleDot, ClipboardList, Clock3, Globe, KeyRound, Maximize, Monitor, RefreshCw, Timer, TriangleAlert, type LucideIcon } from 'lucide-react-native'
import { useRequireAuth } from '../../../../../../src/hooks/useRequireAuth'
import { useExamDetail } from '../../../../../../src/hooks/useCourseDetail'
import StudentLayout from '../../../../../../src/components/student/StudentLayout'
import type {StudentExamStatus} from '../../../../../../src/types/course-detail.types'

const STATUS_CONFIG: Record<StudentExamStatus, { label: string; bg: string; color: string; icon: LucideIcon }> = {
  NOT_STARTED: { label: 'Chưa bắt đầu', bg: '#f1f5f9', color: '#64748b', icon: Clock3 },
  AVAILABLE:   { label: 'Đang diễn ra', bg: '#dcfce7', color: '#16a34a', icon: CircleDot },
  SUBMITTED:   { label: 'Đã nộp bài',   bg: '#eff6ff', color: '#2563eb', icon: CircleCheck },
  EXPIRED:     { label: 'Đã hết hạn',   bg: '#fef2f2', color: '#dc2626', icon: Timer },
}

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  const date = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  return `${time} - ${date}`
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' }}>
      <Icon size={16} color="#64748b" style={{ width: 28 }} />
      <Text style={{ fontSize: 13, color: '#64748b', flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a', textAlign: 'right', flex: 1 }}>{value}</Text>
    </View>
  )
}

export default function ExamDetailScreen() {
  const { isInitialized, isAuthenticated } = useRequireAuth()
  const { courseOfferingId, scheduleId } = useLocalSearchParams<{ courseOfferingId: string; scheduleId: string }>()
  const { data: exam, isLoading, error } = useExamDetail(courseOfferingId ?? '', scheduleId ?? '')

  if (!isInitialized || !isAuthenticated) return null

  const statusCfg = exam ? STATUS_CONFIG[exam.status] : null
  const StatusIcon = statusCfg?.icon

  return (
    <StudentLayout activeRoute="subjects">
        <BackToTopScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <ArrowLeft size={16} color="#64748b" />
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

          {exam && statusCfg && (
            <>
              {/* Header card */}
              <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, borderWidth: 1, borderColor: '#f1f5f9' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' }}>
                    <ClipboardList size={26} color="#d97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#fef3c7' }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#92400e', textTransform: 'uppercase' }}>
                          Bài thi
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', lineHeight: 22 }}>{exam.title}</Text>
                  </View>
                </View>

                {/* Status badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: statusCfg.bg }}>
                  {StatusIcon && <StatusIcon size={16} color={statusCfg.color} />}
                  <Text style={{ fontSize: 13, fontWeight: '700', color: statusCfg.color }}>{statusCfg.label}</Text>
                </View>
              </View>

              {/* Info card */}
              <View style={{ backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, borderWidth: 1, borderColor: '#f1f5f9' }}>
                <InfoRow icon={Clock3} label="Bắt đầu" value={fmtDateTime(exam.startTime)} />
                <InfoRow icon={CircleCheck} label="Kết thúc" value={fmtDateTime(exam.endTime)} />
                <InfoRow icon={Timer} label="Thời gian làm bài" value={`${exam.durationMinutes} phút`} />
                <InfoRow icon={RefreshCw} label="Số lần làm" value={`${exam.attemptUsed} / ${exam.maxAttempts === 0 ? '∞' : exam.maxAttempts}`} />
                {exam.description ? (
                  <View style={{ paddingVertical: 12 }}>
                    <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Mô tả</Text>
                    <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>{exam.description}</Text>
                  </View>
                ) : null}
              </View>

              {/* Requirements card */}
              {(exam.requiresPassword || exam.enableWebcam || exam.enableScreenMonitoring || exam.requireFullscreen) && (
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#fef3c7' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <TriangleAlert size={15} color="#92400e" />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400e' }}>Yêu cầu khi làm bài</Text>
                  </View>
                  <View style={{ gap: 6 }}>
                    {exam.requiresPassword && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><KeyRound size={12} color="#78350f" /><Text style={{ fontSize: 12, color: '#78350f' }}>Yêu cầu mật khẩu</Text></View>}
                    {exam.enableWebcam && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Camera size={12} color="#78350f" /><Text style={{ fontSize: 12, color: '#78350f' }}>Bật webcam</Text></View>}
                    {exam.enableScreenMonitoring && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Monitor size={12} color="#78350f" /><Text style={{ fontSize: 12, color: '#78350f' }}>Giám sát màn hình</Text></View>}
                    {exam.requireFullscreen && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Maximize size={12} color="#78350f" /><Text style={{ fontSize: 12, color: '#78350f' }}>Chế độ toàn màn hình</Text></View>}
                  </View>
                </View>
              )}

              {/* Mobile notice — luôn hiện thay cho nút làm bài */}
              <View style={{ backgroundColor: '#eff6ff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#bfdbfe', alignItems: 'center', gap: 10 }}>
                <Monitor size={28} color="#1d4ed8" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1d4ed8', textAlign: 'center' }}>
                  Làm bài thi trên máy tính
                </Text>
                <Text style={{ fontSize: 12, color: '#3b82f6', textAlign: 'center', lineHeight: 18 }}>
                  Để đảm bảo an toàn và toàn vẹn kết quả, vui lòng làm bài thi trên trình duyệt máy tính.
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#dbeafe', borderRadius: 10 }}>
                  <Globe size={12} color="#1d4ed8" />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#1d4ed8' }}>
                    Truy cập: soes.edu.vn
                  </Text>
                </View>
              </View>
            </>
          )}
        </BackToTopScrollView>
    </StudentLayout>
  )
}
