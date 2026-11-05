import { useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { CoursePost } from '../../../types/teacher-courses.types'

interface Props { post: CoursePost | null; visible: boolean; busy: boolean; onClose: () => void; onSave: (title: string, content: string) => void }

export function CoursePostComposer({ post, visible, busy, onClose, onSave }: Props) {
  const [title, setTitle] = useState(post?.title ?? '')
  const [content, setContent] = useState(post?.content ?? '')
  const valid = title.trim().length > 0 && title.trim().length <= 200 && content.trim().length > 0 && content.trim().length <= 10000

  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}><Text style={styles.heading}>{post ? 'Sửa bài viết' : 'Tạo bài viết'}</Text><Pressable onPress={onClose} disabled={busy}><Text style={styles.close}>Đóng</Text></Pressable></View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
          <Text style={styles.label}>Tiêu đề</Text>
          <TextInput value={title} onChangeText={setTitle} maxLength={200} placeholder="Nhập tiêu đề" style={styles.input} />
          <Text style={styles.label}>Nội dung</Text>
          <TextInput value={content} onChangeText={setContent} maxLength={10000} placeholder="Thông báo cho lớp..." multiline textAlignVertical="top" style={[styles.input, styles.content]} />
        </ScrollView>
        <View style={styles.footer}><Pressable disabled={!valid || busy} onPress={() => onSave(title, content)} style={[styles.save, (!valid || busy) && styles.disabled]}><Text style={styles.saveText}>{busy ? 'Đang lưu...' : 'Đăng bài viết'}</Text></Pressable></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' }, header: { minHeight: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  heading: { color: '#0f172a', fontSize: 18, fontWeight: '800' }, close: { color: '#2563eb', fontWeight: '700', padding: 8 },
  body: { padding: 16, paddingBottom: 30 }, label: { color: '#334155', fontWeight: '700', marginBottom: 7, marginTop: 12 },
  input: { minHeight: 46, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 11, padding: 12, color: '#0f172a' },
  content: { minHeight: 160 }, footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  save: { minHeight: 46, backgroundColor: '#2563eb', borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 }, saveText: { color: '#fff', fontWeight: '700' },
})
