import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput } from 'react-native'
import { FullScreenFormModal } from '../../ui/FullScreenFormModal'
import type { CoursePost } from '../../../types/teacher-courses.types'

interface Props { post: CoursePost | null; visible: boolean; busy: boolean; onClose: () => void; onSave: (title: string, content: string) => void }

export function CoursePostComposer({ post, visible, busy, onClose, onSave }: Props) {
  const [title, setTitle] = useState(post?.title ?? '')
  const [content, setContent] = useState(post?.content ?? '')
  const valid = title.trim().length > 0 && title.trim().length <= 200 && content.trim().length > 0 && content.trim().length <= 10000

  return <FullScreenFormModal title={post ? 'Sửa bài viết' : 'Tạo bài viết'} visible={visible} onClose={onClose} closeDisabled={busy}
    footer={<Pressable disabled={!valid || busy} onPress={() => onSave(title, content)} style={[styles.save, (!valid || busy) && styles.disabled]}><Text style={styles.saveText}>{busy ? 'Đang lưu...' : 'Đăng bài viết'}</Text></Pressable>}>
          <Text style={styles.label}>Tiêu đề</Text>
          <TextInput value={title} onChangeText={setTitle} maxLength={200} placeholder="Nhập tiêu đề" style={styles.input} />
          <Text style={styles.label}>Nội dung</Text>
          <TextInput value={content} onChangeText={setContent} maxLength={10000} placeholder="Thông báo cho lớp..." multiline textAlignVertical="top" style={[styles.input, styles.content]} />
  </FullScreenFormModal>
}

const styles = StyleSheet.create({
  label: { color: '#334155', fontWeight: '700', marginBottom: 7, marginTop: 12 },
  input: { minHeight: 46, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 11, padding: 12, color: '#0f172a' },
  content: { minHeight: 160 },
  save: { minHeight: 46, backgroundColor: '#2563eb', borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 }, saveText: { color: '#fff', fontWeight: '700' },
})
