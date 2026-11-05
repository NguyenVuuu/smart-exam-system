import * as DocumentPicker from 'expo-document-picker'
import { Upload } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { uploadCourseMaterial } from '../../../api/teacher-courses.api'
import type { CourseMaterial } from '../../../types/teacher-courses.types'
import { formatDateTime } from '../../../utils/date'
import { SectionCard } from '../../ui/SectionCard'

interface Props { courseId: string; materials: CourseMaterial[]; onChanged: () => Promise<void> }
const MAX_SIZE = 25 * 1024 * 1024

export function CourseMaterialsSection({ courseId, materials, onChanged }: Props) {
  const [uploading, setUploading] = useState(false)

  async function pickAndUpload() {
    if (uploading) return
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true,
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'] })
      if (result.canceled || !result.assets[0]) return
      const asset = result.assets[0]
      if (!/\.(pdf|docx|pptx)$/i.test(asset.name) || (asset.size ?? 0) > MAX_SIZE) {
        Alert.alert('Tệp không hợp lệ', 'Chỉ chọn PDF, DOCX hoặc PPTX tối đa 25 MB.')
        return
      }
      if (materials.some((item) => item.fileName.toLowerCase() === asset.name.toLowerCase())) {
        Alert.alert('Tệp đã tồn tại', 'Lớp học phần đã có tài liệu cùng tên.')
        return
      }
      setUploading(true)
      await uploadCourseMaterial(courseId, asset)
      await onChanged()
      Alert.alert('Thành công', 'Đã tải tài liệu lên lớp học phần.')
    } catch {
      Alert.alert('Không thể tải tài liệu', 'Vui lòng kiểm tra tệp, kết nối mạng rồi thử lại.')
    } finally { setUploading(false) }
  }

  return <View>
    <Pressable accessibilityRole="button" disabled={uploading} onPress={() => { void pickAndUpload() }}
      style={[styles.upload, uploading && styles.disabled]}>
      <Upload size={18} color="#fff" /><Text style={styles.uploadText}>{uploading ? 'Đang tải lên...' : 'Tải tài liệu lên'}</Text>
    </Pressable>
    <Text style={styles.hint}>PDF, DOCX, PPTX · Tối đa 25 MB</Text>
    {materials.length ? materials.map((item) => <SectionCard key={item.id} title={item.title ?? item.fileName}>
      <Text style={styles.meta}>{item.fileName} · {formatDateTime(item.createdAt)}</Text>
    </SectionCard>) : <Text style={styles.empty}>Chưa có tài liệu.</Text>}
  </View>
}

const styles = StyleSheet.create({
  upload: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2563eb', paddingHorizontal: 14, borderRadius: 10 },
  uploadText: { color: '#fff', fontWeight: '700' }, disabled: { opacity: 0.5 },
  hint: { color: '#64748b', fontSize: 12, marginTop: 7, marginBottom: 14 },
  meta: { color: '#475569', fontSize: 13 }, empty: { color: '#64748b', textAlign: 'center', padding: 20 },
})
