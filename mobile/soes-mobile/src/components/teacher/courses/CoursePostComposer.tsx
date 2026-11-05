import * as DocumentPicker from 'expo-document-picker'
import { Download, Paperclip, X } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { FullScreenFormModal, useModalScroll } from '../../ui/FullScreenFormModal'
import type { CoursePost } from '../../../types/teacher-courses.types'
import { displayFileName, formatFileSize } from '../../../utils/courseFiles'

export interface PostFiles { attachments: DocumentPicker.DocumentPickerAsset[]; removedAttachmentIds: string[] }
interface Props {
  post: CoursePost | null; visible: boolean; busy: boolean; onClose: () => void
  onSave: (title: string, content: string, files: PostFiles) => void
  onDownload: (attachmentId: string, fileName: string) => void
}
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|txt)$/i

function CoursePostComposerContent({
  post,
  onSave,
  onDownload,
  busy,
  valid,
  title,
  setTitle,
  content,
  setContent,
  attachments,
  setAttachments,
  removedAttachmentIds,
  setRemovedAttachmentIds,
}: {
  post: CoursePost | null
  onSave: (title: string, content: string, files: PostFiles) => void
  onDownload: (attachmentId: string, fileName: string) => void
  busy: boolean
  valid: boolean
  title: string
  setTitle: (t: string) => void
  content: string
  setContent: (c: string) => void
  attachments: DocumentPicker.DocumentPickerAsset[]
  setAttachments: React.Dispatch<React.SetStateAction<DocumentPicker.DocumentPickerAsset[]>>
  removedAttachmentIds: string[]
  setRemovedAttachmentIds: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const { scrollToY } = useModalScroll()
  const titleY = useRef(0)
  const contentY = useRef(0)

  const existing = (post?.attachments ?? []).filter(({ id }) => !removedAttachmentIds.includes(id))
  const remaining = 5 - existing.length - attachments.length

  async function pickFiles() {
    if (remaining <= 0) return
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'image/jpeg',
          'image/png',
          'text/plain',
        ],
        multiple: true,
        copyToCacheDirectory: true,
      })
      if (result.canceled) return
      if (
        result.assets.length > remaining ||
        result.assets.some((file) => !ACCEPTED.test(displayFileName(file.name)) || (file.size ?? 0) > MAX_FILE_SIZE)
      ) {
        Alert.alert('Tệp không hợp lệ', `Chọn tối đa ${remaining} tệp nữa, mỗi tệp không quá 10 MB.`)
        return
      }
      setAttachments((curr) => [...curr, ...result.assets.map((file) => ({ ...file, name: displayFileName(file.name) }))])
    } catch {
      Alert.alert('Không thể chọn tệp', 'Vui lòng thử lại.')
    }
  }

  return (
    <View>
      <View onLayout={(e) => { titleY.current = e.nativeEvent.layout.y }}>
        <Text style={styles.label}>Tiêu đề</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          maxLength={200}
          placeholder="Nhập tiêu đề"
          style={styles.input}
          onFocus={() => scrollToY(titleY.current, 16)}
        />
      </View>
      <View onLayout={(e) => { contentY.current = e.nativeEvent.layout.y }}>
        <Text style={styles.label}>Nội dung</Text>
        <TextInput
          value={content}
          onChangeText={setContent}
          maxLength={10000}
          placeholder="Thông báo cho lớp..."
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.content]}
          onFocus={() => scrollToY(contentY.current, 16)}
        />
      </View>
      <Text style={styles.label}>Tệp đính kèm ({existing.length + attachments.length}/5)</Text>
      {existing.map((file) => (
        <View key={file.id} style={styles.fileRow}>
          <Paperclip size={16} color="#2563eb" />
          <Text numberOfLines={1} style={styles.fileName}>{displayFileName(file.fileName)}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Tải tệp" style={styles.fileAction} onPress={() => onDownload(file.id, file.fileName)}>
            <Download size={17} color="#2563eb" />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Gỡ tệp" style={styles.fileAction} onPress={() => setRemovedAttachmentIds((ids) => [...ids, file.id])}>
            <X size={18} color="#e11d48" />
          </Pressable>
        </View>
      ))}
      {attachments.map((file, index) => (
        <View key={`${file.uri}-${index}`} style={styles.fileRow}>
          <Paperclip size={16} color="#2563eb" />
          <Text numberOfLines={1} style={styles.fileName}>{displayFileName(file.name)} · {formatFileSize(file.size ?? 0)}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Bỏ tệp đã chọn" style={styles.fileAction} onPress={() => setAttachments((files) => files.filter((_, i) => i !== index))}>
            <X size={18} color="#e11d48" />
          </Pressable>
        </View>
      ))}
      {remaining > 0 && (
        <Pressable accessibilityRole="button" style={styles.attach} onPress={() => { void pickFiles() }}>
          <Paperclip size={17} color="#2563eb" />
          <Text style={styles.attachText}>Chọn tệp</Text>
        </Pressable>
      )}
      <Text style={styles.hint}>PDF, Office, ảnh hoặc TXT · tối đa 10 MB/tệp</Text>
    </View>
  )
}

export function CoursePostComposer({ post, visible, busy, onClose, onSave, onDownload }: Props) {
  const [title, setTitle] = useState(post?.title ?? '')
  const [content, setContent] = useState(post?.content ?? '')
  const [attachments, setAttachments] = useState<DocumentPicker.DocumentPickerAsset[]>([])
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([])
  const valid = title.trim().length > 0 && title.trim().length <= 200 && content.trim().length > 0 && content.trim().length <= 10000

  return (
    <FullScreenFormModal
      title={post ? 'Sửa bài viết' : 'Tạo bài viết'}
      visible={visible}
      onClose={onClose}
      closeDisabled={busy}
      footer={
        <Pressable
          disabled={!valid || busy}
          onPress={() => onSave(title, content, { attachments, removedAttachmentIds })}
          style={[styles.save, (!valid || busy) && styles.disabled]}
        >
          <Text style={styles.saveText}>{busy ? 'Đang lưu...' : post ? 'Lưu thay đổi' : 'Đăng bài viết'}</Text>
        </Pressable>
      }
    >
      <CoursePostComposerContent
        post={post}
        onSave={onSave}
        onDownload={onDownload}
        busy={busy}
        valid={valid}
        title={title}
        setTitle={setTitle}
        content={content}
        setContent={setContent}
        attachments={attachments}
        setAttachments={setAttachments}
        removedAttachmentIds={removedAttachmentIds}
        setRemovedAttachmentIds={setRemovedAttachmentIds}
      />
    </FullScreenFormModal>
  )
}

const styles = StyleSheet.create({
  label: { color: '#334155', fontWeight: '700', marginBottom: 7, marginTop: 12 },
  input: { minHeight: 46, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 11, padding: 12, color: '#0f172a' },
  content: { minHeight: 160 },
  fileRow: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  fileName: { flex: 1, color: '#334155', fontSize: 13 },
  fileAction: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center' },
  attach: { marginTop: 12, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 40, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#eff6ff' },
  attachText: { color: '#2563eb', fontSize: 13, fontWeight: '700' },
  hint: { color: '#64748b', fontSize: 11, marginTop: 7 },
  save: { minHeight: 46, backgroundColor: '#2563eb', borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  saveText: { color: '#fff', fontWeight: '700' },
})
