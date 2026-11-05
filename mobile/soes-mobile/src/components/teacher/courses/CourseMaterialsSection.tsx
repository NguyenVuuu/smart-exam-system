import * as DocumentPicker from 'expo-document-picker'
import { Check, Download, FileText, Trash2, Upload } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { deleteCourseMaterial, downloadCourseMaterial, setCourseMaterialAi, uploadCourseMaterial } from '../../../api/teacher-courses.api'
import type { CourseMaterial } from '../../../types/teacher-courses.types'
import { displayFileName, formatFileSize } from '../../../utils/courseFiles'
import { formatDateTime } from '../../../utils/date'
import { ConfirmSheet } from '../../ui/ConfirmSheet'

interface Props { courseId: string; materials: CourseMaterial[]; onChanged: () => Promise<void> }
const MAX_SIZE = 25 * 1024 * 1024

export function CourseMaterialsSection({ courseId, materials, onChanged }: Props) {
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [removing, setRemoving] = useState<CourseMaterial | null>(null)

  async function pickAndUpload() {
    if (uploading) return
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true,
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'] })
      if (result.canceled || !result.assets[0]) return
      const asset = result.assets[0]
      const name = displayFileName(asset.name)
      if (!/\.(pdf|docx|pptx)$/i.test(name) || (asset.size ?? 0) > MAX_SIZE) {
        Alert.alert('Tệp không hợp lệ', 'Chỉ chọn PDF, DOCX hoặc PPTX tối đa 25 MB.')
        return
      }
      if (materials.some((item) => displayFileName(item.fileName).toLowerCase() === name.toLowerCase())) {
        Alert.alert('Tệp đã tồn tại', 'Lớp học phần đã có tài liệu cùng tên.')
        return
      }
      setUploading(true)
      await uploadCourseMaterial(courseId, { ...asset, name })
      await onChanged()
      Alert.alert('Thành công', 'Đã tải tài liệu lên lớp học phần.')
    } catch {
      Alert.alert('Không thể tải tài liệu', 'Vui lòng kiểm tra tệp, kết nối mạng rồi thử lại.')
    } finally { setUploading(false) }
  }

  async function run(item: CourseMaterial, task: () => Promise<unknown>, message: string) {
    if (busyId) return false
    setBusyId(item.id)
    try { await task(); await onChanged(); return true }
    catch { Alert.alert('Không thể thực hiện', message); return false }
    finally { setBusyId(null) }
  }

  async function download(item: CourseMaterial) {
    if (busyId) return
    setBusyId(item.id)
    try { await downloadCourseMaterial(courseId, item.id, item.fileName) }
    catch { Alert.alert('Không thể tải tệp', 'Vui lòng kiểm tra kết nối rồi thử lại.') }
    finally { setBusyId(null) }
  }

  return <View>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" disabled={uploading} onPress={() => { void pickAndUpload() }} style={[styles.upload, uploading && styles.disabled]}>
        <Upload size={16} color="#fff" /><Text style={styles.uploadText}>{uploading ? 'Đang tải...' : 'Tải tài liệu'}</Text>
      </Pressable>
      <Text style={styles.hint}>PDF · DOCX · PPTX, tối đa 25 MB</Text>
    </View>
    {materials.length ? materials.map((item) => <View key={item.id} style={styles.card}>
      <View style={styles.fileRow}>
        <View style={styles.fileIcon}><FileText size={19} color="#2563eb" /></View>
        <View style={styles.fileInfo}>
          <Text style={styles.name} numberOfLines={2}>{displayFileName(item.fileName)}</Text>
          <Text style={styles.meta}>{formatFileSize(item.fileSize)} · {formatDateTime(item.createdAt)}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: item.aiEnabled, disabled: !!busyId }}
          accessibilityLabel={`Dùng ${displayFileName(item.fileName)} cho AI`} disabled={!!busyId}
          onPress={() => { void run(item, () => setCourseMaterialAi(courseId, item.id, !item.aiEnabled), 'Không thể đổi lựa chọn cho AI.') }} style={styles.aiAction}>
          <View style={[styles.checkbox, item.aiEnabled && styles.checked]}>{item.aiEnabled && <Check size={13} color="#fff" />}</View>
          <Text style={styles.aiText}>Dùng cho AI</Text>
        </Pressable>
        <View style={styles.iconActions}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Tải ${displayFileName(item.fileName)}`} disabled={!!busyId}
            onPress={() => { void download(item) }} style={styles.iconButton}><Download size={18} color="#2563eb" /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Xóa ${displayFileName(item.fileName)}`} disabled={!!busyId}
            onPress={() => setRemoving(item)} style={styles.iconButton}><Trash2 size={18} color="#e11d48" /></Pressable>
        </View>
      </View>
    </View>) : <Text style={styles.empty}>Chưa có tài liệu.</Text>}
    <ConfirmSheet visible={!!removing} title="Xóa tài liệu" message={`Xóa “${displayFileName(removing?.fileName ?? '')}” khỏi lớp học phần?`}
      destructive busy={!!busyId} onCancel={() => setRemoving(null)} onConfirm={() => {
        if (!removing) return
        void run(removing, () => deleteCourseMaterial(courseId, removing.id), 'Không thể xóa tài liệu.').then((ok) => { if (ok) setRemoving(null) })
      }} />
  </View>
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 9, marginBottom: 12 },
  upload: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#2563eb', paddingHorizontal: 12, borderRadius: 10 },
  uploadText: { color: '#fff', fontSize: 13, fontWeight: '700' }, disabled: { opacity: 0.5 }, hint: { color: '#64748b', fontSize: 11 },
  card: { padding: 13, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', marginBottom: 10 },
  fileRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  fileIcon: { width: 36, height: 36, borderRadius: 9, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  fileInfo: { flex: 1, minWidth: 0 }, name: { color: '#0f172a', fontSize: 14, lineHeight: 20, fontWeight: '700' },
  meta: { color: '#64748b', fontSize: 11, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 7, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  aiAction: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 19, height: 19, borderWidth: 1, borderColor: '#94a3b8', borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: '#2563eb', borderColor: '#2563eb' }, aiText: { color: '#334155', fontSize: 12, fontWeight: '600' },
  iconActions: { flexDirection: 'row', gap: 3 }, iconButton: { width: 42, height: 40, alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#64748b', textAlign: 'center', padding: 20 },
})
