import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { ConfirmSheet } from '../../ui/ConfirmSheet'
import { SectionCard } from '../../ui/SectionCard'
import { formatDateTime } from '../../../utils/date'
import { CoursePostComposer } from './CoursePostComposer'
import { deletePost, savePost, setPostPinned, setPostStatus } from '../../../api/teacher-courses.api'
import type { CoursePost } from '../../../types/teacher-courses.types'

type Action = { kind: 'delete' | 'pin' | 'status'; post: CoursePost }
interface Props { courseId: string; posts: CoursePost[]; onChanged: () => Promise<void> }

export function CoursePostsSection({ courseId, posts, onChanged }: Props) {
  const [editor, setEditor] = useState<{ post: CoursePost | null } | null>(null)
  const [action, setAction] = useState<Action | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(task: () => Promise<unknown>, done: () => void) {
    if (busy) return
    setBusy(true)
    try { await task(); await onChanged(); done() }
    catch { Alert.alert('Không thể thực hiện', 'Vui lòng thử lại.') }
    finally { setBusy(false) }
  }

  function confirmAction() {
    if (!action) return
    const { kind, post } = action
    const task = kind === 'delete' ? () => deletePost(courseId, post.id) : kind === 'pin' ? () => setPostPinned(courseId, post.id, !post.isPinned) : () => setPostStatus(courseId, post.id, post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')
    void run(task, () => setAction(null))
  }

  return <View>
    <Pressable style={styles.add} onPress={() => setEditor({ post: null })}><Text style={styles.addText}>Tạo bài viết</Text></Pressable>
    {posts.length === 0 && <Text style={styles.empty}>Chưa có bài viết.</Text>}
    {posts.map((post) => <SectionCard key={post.id} title={post.title}>
      <Text style={styles.body}>{post.content}</Text>
      <Text style={styles.meta}>{post.isPinned ? 'Đã ghim · ' : ''}{post.status === 'PUBLISHED' ? 'Đã đăng' : 'Đã ẩn'} · {formatDateTime(post.createdAt)}</Text>
      <View style={styles.actions}>
        <ActionButton label="Sửa" onPress={() => setEditor({ post })} />
        <ActionButton label={post.isPinned ? 'Bỏ ghim' : 'Ghim'} onPress={() => setAction({ kind: 'pin', post })} />
        <ActionButton label={post.status === 'PUBLISHED' ? 'Ẩn' : 'Hiện'} onPress={() => setAction({ kind: 'status', post })} />
        <ActionButton label="Xóa" onPress={() => setAction({ kind: 'delete', post })} />
      </View>
    </SectionCard>)}
    {editor && <CoursePostComposer key={editor.post?.id ?? 'new'} visible busy={busy} post={editor.post} onClose={() => setEditor(null)}
      onSave={(title, content) => void run(() => savePost(courseId, editor.post?.id ?? null, title, content), () => setEditor(null))} />}
    <ConfirmSheet visible={!!action} title="Xác nhận thay đổi" message={action ? `Bạn muốn ${action.kind === 'delete' ? 'xóa' : action.kind === 'pin' ? action.post.isPinned ? 'bỏ ghim' : 'ghim' : action.post.status === 'PUBLISHED' ? 'ẩn' : 'hiện'} bài viết “${action.post.title}”?` : ''}
      destructive={action?.kind === 'delete'} busy={busy} onCancel={() => setAction(null)} onConfirm={confirmAction} />
  </View>
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.button}><Text style={styles.buttonText}>{label}</Text></Pressable>
}

const styles = StyleSheet.create({
  add: { minHeight: 44, backgroundColor: '#2563eb', borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  addText: { color: '#fff', fontWeight: '700' }, empty: { color: '#64748b', textAlign: 'center', padding: 20 },
  body: { color: '#334155', fontSize: 14, lineHeight: 21 }, meta: { color: '#94a3b8', fontSize: 12, marginTop: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  button: { minHeight: 40, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 8, backgroundColor: '#eff6ff' },
  buttonText: { color: '#2563eb', fontSize: 12, fontWeight: '700' },
})
