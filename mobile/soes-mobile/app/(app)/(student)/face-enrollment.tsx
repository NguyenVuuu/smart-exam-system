import { useContext, useState } from 'react'
import { Fingerprint, LogOut, RefreshCw } from 'lucide-react-native'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { cancelFaceEnrollmentSession, completeFaceEnrollmentSession, createFaceEnrollmentSession, type FaceEnrollmentSession } from '../../../src/api/student-face.api'
import { FaceLivenessCamera } from '../../../src/components/student/face/FaceLivenessCamera'
import { StudentFaceEnrollmentContext } from '../../../src/hooks/useStudentFaceEnrollment'
import { useLogout } from '../../../src/hooks/useLogout'

type LivenessComponent = typeof import('@blacktomang/expo-aws-liveness').ExpoAwsLiveness
type Phase = 'intro' | 'creating' | 'scanning' | 'checking' | 'waiting'

const identityPoolId = process.env.EXPO_PUBLIC_AWS_FACE_IDENTITY_POOL_ID?.trim()
const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const feedbackGuidance: Record<string, string> = {
  FACE_NOT_VISIBLE: 'Giữ mặt trong khung quét đến khi hoàn tất.',
  FACE_OBSTRUCTION_DETECTED: 'Bỏ khẩu trang hoặc vật che mặt.',
  LOW_VIDEO_QUALITY_DETECTED: 'Lau camera và giữ điện thoại ổn định.',
  FACE_NOT_ALIGNED: 'Đặt mặt vào giữa khung.',
  LOW_LIGHTING_DETECTED: 'Chuyển đến nơi có ánh sáng đều hơn.',
  HIGH_LIGHTING_DETECTED: 'Tránh ánh sáng chiếu thẳng vào mặt.',
}

function describeFailure(failureCode?: string, feedbackCodes: string[] = []) {
  if (failureCode === 'LIVENESS_REFERENCE_IMAGE_MISSING') return 'Camera chưa chụp được khuôn mặt rõ. Vui lòng thử lại.'
  const guidance = [...new Set(feedbackCodes)].map((code) => feedbackGuidance[code]).filter(Boolean).join(' ')
  return `Lần quét này chưa đủ tin cậy để xác minh. ${guidance || 'Đặt mặt vừa khung, ở nơi sáng đều rồi thử lại.'}`
}

export default function StudentFaceEnrollmentPage() {
  const enrollment = useContext(StudentFaceEnrollmentContext)
  const { handleLogout, isLoading: isLoggingOut } = useLogout()
  const [phase, setPhase] = useState<Phase>('intro')
  const [session, setSession] = useState<FaceEnrollmentSession | null>(null)
  const [detector, setDetector] = useState<LivenessComponent | null>(null)
  const [error, setError] = useState('')

  const begin = async () => {
    if (phase !== 'intro') return
    if (!identityPoolId || identityPoolId.includes('YOUR_')) {
      setError('Ứng dụng chưa cấu hình Cognito Identity Pool để mở camera xác minh.')
      return
    }
    setPhase('creating')
    setError('')
    try {
      const native = await import('@blacktomang/expo-aws-liveness')
      const created = await createFaceEnrollmentSession()
      setDetector(() => native.ExpoAwsLiveness)
      setSession(created)
      setPhase('scanning')
    } catch {
      setError('Không thể mở camera. Kiểm tra kết nối và dùng bản ứng dụng Development Build thay cho Expo Go.')
      setPhase('intro')
    }
  }

  const checkResult = async (id: string) => {
    setPhase('checking')
    setError('')
    try {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const result = await completeFaceEnrollmentSession(id)
        if (result.status === 'PASSED') {
          await enrollment?.refresh()
          return
        }
        if (result.status === 'FAILED') {
          setSession(null)
          setPhase('intro')
          setError(describeFailure(result.failureCode, result.feedbackCodes))
          return
        }
        await pause(1500)
      }
      setPhase('waiting')
      setError('Kết quả đang được xử lý. Chọn kiểm tra lại sau ít phút.')
    } catch {
      setPhase('waiting')
      setError('Không thể lấy kết quả xác minh. Kiểm tra mạng rồi thử lại.')
    }
  }

  const goBack = () => {
    if (!session) return
    void cancelFaceEnrollmentSession(session.id).catch(() => undefined)
    setSession(null)
    setPhase('intro')
    setError('')
  }

  const signOut = () => {
    if (phase === 'scanning' && session) void cancelFaceEnrollmentSession(session.id).catch(() => undefined)
    void handleLogout()
  }

  if (phase === 'scanning' && session && detector && identityPoolId) {
    return <SafeAreaView style={styles.safe}>
      <FaceLivenessCamera
        component={detector}
        session={session}
        identityPoolId={identityPoolId}
        onBack={goBack}
        onLogout={signOut}
        isLoggingOut={isLoggingOut}
        onFinished={() => void checkResult(session.id)}
        onError={() => {
          void cancelFaceEnrollmentSession(session.id).catch(() => undefined)
          setSession(null)
          setPhase('intro')
          setError('Camera chưa hoàn tất phiên quét. Vui lòng thử lại.')
        }}
      />
      {error ? <Text style={styles.cameraError}>{error}</Text> : null}
    </SafeAreaView>
  }

  const busy = phase === 'creating' || phase === 'checking'
  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.icon}><Fingerprint size={30} color="#2563eb" /></View>
      <Text style={styles.title}>Đăng ký khuôn mặt</Text>
      <Text style={styles.description}>
        Đăng ký một lần bằng camera trên điện thoại. Sau khi xác minh thành công, bạn có thể sử dụng ứng dụng; lúc vào thi trên web sẽ xác minh lại khuôn mặt.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {busy ? <ActivityIndicator color="#2563eb" size="large" /> : null}
      {phase === 'intro' ? <Pressable style={styles.primary} onPress={() => void begin()} accessibilityRole="button">
        <Text style={styles.primaryText}>Bắt đầu đăng ký</Text>
      </Pressable> : null}
      {phase === 'waiting' && session ? <Pressable style={styles.primary} onPress={() => void checkResult(session.id)} accessibilityRole="button">
        <RefreshCw size={18} color="#fff" /><Text style={styles.primaryText}>Kiểm tra kết quả</Text>
      </Pressable> : null}
      <Pressable style={styles.secondary} onPress={() => void enrollment?.refresh()} accessibilityRole="button">
        <RefreshCw size={18} color="#2563eb" /><Text style={styles.secondaryText}>Kiểm tra trạng thái đăng ký</Text>
      </Pressable>
      <Pressable style={styles.logout} onPress={signOut} disabled={busy || isLoggingOut} accessibilityRole="button">
        <LogOut size={18} color="#475569" /><Text style={styles.logoutText}>Đăng xuất</Text>
      </Pressable>
    </ScrollView>
  </SafeAreaView>
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 18, maxWidth: 520, width: '100%', alignSelf: 'center' },
  icon: { width: 60, height: 60, borderRadius: 18, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  description: { fontSize: 15, lineHeight: 23, color: '#475569' },
  error: { color: '#b91c1c', fontSize: 14, lineHeight: 20 },
  cameraError: { color: '#b91c1c', paddingHorizontal: 20, paddingBottom: 12 },
  primary: { minHeight: 52, borderRadius: 12, backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  secondary: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  secondaryText: { fontSize: 14, fontWeight: '700', color: '#2563eb' },
  logout: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12 },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#475569' },
})
