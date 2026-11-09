import { useEffect, useRef, useState } from 'react'
import type { ExpoAwsLivenessHandle, LivenessFailure } from '@blacktomang/expo-aws-liveness'
import { ArrowLeft, LogOut } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { FaceEnrollmentSession } from '../../../api/student-face.api'

type LivenessComponent = typeof import('@blacktomang/expo-aws-liveness').ExpoAwsLiveness

interface Props {
  component: LivenessComponent
  session: FaceEnrollmentSession
  identityPoolId: string
  onFinished: () => void
  onError: (error: LivenessFailure) => void
  onBack: () => void
  onLogout: () => void
  isLoggingOut: boolean
}

export function FaceLivenessCamera({ component: Detector, session, identityPoolId, onFinished, onError, onBack, onLogout, isLoggingOut }: Props) {
  const ref = useRef<ExpoAwsLivenessHandle>(null)
  const active = useRef(true)
  const [busy, setBusy] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    active.current = true
    return () => { active.current = false }
  }, [])

  const start = async () => {
    if (busy || completed || !ref.current) return
    setBusy(true)
    try {
      await ref.current.start()
      if (!active.current) return
      setCompleted(true)
      onFinished()
    } catch (error) {
      if (active.current) onError(error as LivenessFailure)
    } finally {
      if (active.current) setBusy(false)
    }
  }

  return <View style={styles.root}>
    <View style={styles.heading}>
      <Pressable style={[styles.headerAction, styles.backAction]} onPress={onBack} accessibilityRole="button" accessibilityLabel="Quay lại đăng ký khuôn mặt">
        <ArrowLeft size={22} color="#2563eb" />
      </Pressable>
      <Text style={styles.title}>Kiểm tra người thật</Text>
      <Pressable style={styles.headerAction} onPress={onLogout} disabled={isLoggingOut} accessibilityRole="button" accessibilityLabel="Đăng xuất">
        <LogOut size={21} color="#475569" />
      </Pressable>
    </View>
    <Text style={styles.hint}>Giữ điện thoại ngang tầm mắt, ở nơi đủ sáng và làm theo chỉ dẫn trên màn hình.</Text>
    <View style={styles.camera}>
      <Detector ref={ref} sessionId={session.providerSessionId} region={session.region} identityPoolId={identityPoolId} style={styles.detector} />
    </View>
    <Pressable style={[styles.button, (busy || completed) && styles.disabled]} onPress={() => void start()} disabled={busy || completed} accessibilityRole="button">
      <Text style={styles.buttonText}>{busy ? 'Đang quét...' : completed ? 'Đang xác nhận...' : 'Mở camera xác minh'}</Text>
    </Pressable>
  </View>
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: 14, padding: 20, backgroundColor: '#f8fafc' },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerAction: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backAction: { marginLeft: -11 },
  title: { flex: 1, fontSize: 20, fontWeight: '800', color: '#0f172a' },
  hint: { color: '#475569', fontSize: 14, lineHeight: 21 },
  camera: { flex: 1, minHeight: 260, borderRadius: 16, overflow: 'hidden', backgroundColor: '#e2e8f0' },
  detector: { flex: 1 },
  button: { minHeight: 52, borderRadius: 12, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.65 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
