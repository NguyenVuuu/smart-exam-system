import { useState } from 'react'
import { Download, Eye, EyeOff, Paperclip, Pencil, Pin, PinOff, Plus, Trash2 } from 'lucide-react-native'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { ConfirmSheet } from '../../ui/ConfirmSheet'
import { SectionCard } from '../../ui/SectionCard'
import { formatDateTime } from '../../../utils/date'
import { displayFileName } from '../../../utils/courseFiles'
import { CoursePostComposer } from './CoursePostComposer'
import { deletePost, downloadPostAttachment, savePost, setPostPinned, setPostStatus } from '../../../api/teacher-courses.api'
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

  async function download(post: CoursePost, attachmentId: string, fileName: string) {
    try { await downloadPostAttachment(courseId, post.id, attachmentId, fileName) }
    catch { Alert.alert('Không thể tải tệp', 'Vui lòng kiểm tra kết nối rồi thử lại.') }
  }

  return <View>
    <Pressable accessibilityRole="button" style={styles.add} onPress={() => setEditor({ post: null })}>
      <Plus size={16} color="#fff" /><Text style={styles.addText}>Tạo bài viết</Text>
    </Pressable>
    {posts.length === 0 && <Text style={styles.empty}>Chưa có bài viết.</Text>}
    {posts.map((post) => <SectionCard key={post.id} title={post.title}>
      <Text style={styles.body}>{post.content}</Text>
      <Text style={styles.meta}>{post.isPinned ? 'Đã ghim · ' : ''}{post.status === 'PUBLISHED' ? 'Đã đăng' : 'Đã ẩn'} · {formatDateTime(post.createdAt)}</Text>
      {post.attachments?.map((file) => <Pressable key={file.id} accessibilityRole="button" accessibilityLabel={`Tải ${displayFileName(file.fileName)}`}
        onPress={() => { void download(post, file.id, file.fileName) }} style={styles.attachment}>
        <Paperclip size={15} color="#2563eb" /><Text numberOfLines={1} style={styles.attachmentName}>{displayFileName(file.fileName)}</Text><Download size={15} color="#2563eb" />
      </Pressable>)}
      <View style={styles.actions}>
        <IconAction label="Sửa bài viết" icon={<Pencil size={18} color="#2563eb" />} onPress={() => setEditor({ post })} />
        <IconAction label={post.isPinned ? 'Bỏ ghim' : 'Ghim'} icon={post.isPinned ? <PinOff size={18} color="#2563eb" /> : <Pin size={18} color="#2563eb" />} onPress={() => setAction({ kind: 'pin', post })} />
        <IconAction label={post.status === 'PUBLISHED' ? 'Ẩn bài viết' : 'Hiện bài viết'} icon={post.status === 'PUBLISHED' ? <EyeOff size={18} color="#2563eb" /> : <Eye size={18} color="#2563eb" />} onPress={() => setAction({ kind: 'status', post })} />
        <IconAction label="Xóa bài viết" icon={<Trash2 size={18} color="#e11d48" />} onPress={() => setAction({ kind: 'delete', post })} />
      </View>
    </SectionCard>)}
    {editor && <CoursePostComposer key={editor.post?.id ?? 'new'} visible busy={busy} post={editor.post} onClose={() => setEditor(null)}
      onSave={(title, content, files) => void run(() => savePost(courseId, editor.post?.id ?? null, title, content, files.attachments, files.removedAttachmentIds,
        editor.post?.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED'), () => setEditor(null))}
      onDownload={(attachmentId, fileName) => { if (editor.post) void download(editor.post, attachmentId, fileName) }} />}
    <ConfirmSheet visible={!!action} title="Xác nhận thay đổi" message={action ? `Bạn muốn ${action.kind === 'delete' ? 'xóa' : action.kind === 'pin' ? action.post.isPinned ? 'bỏ ghim' : 'ghim' : action.post.status === 'PUBLISHED' ? 'ẩn' : 'hiện'} bài viết “${action.post.title}”?` : ''}
      destructive={action?.kind === 'delete'} busy={busy} onCancel={() => setAction(null)} onConfirm={confirmAction} />
  </View>
}

function IconAction({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.button}>{icon}</Pressable>
}

const styles = StyleSheet.create({
  add: { minHeight: 40, alignSelf: 'flex-start', flexDirection: 'row', gap: 6, paddingHorizontal: 12, backgroundColor: '#2563eb', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  addText: { color: '#fff', fontSize: 13, fontWeight: '700' }, empty: { color: '#64748b', textAlign: 'center', padding: 20 },
  body: { color: '#334155', fontSize: 14, lineHeight: 21 }, meta: { color: '#94a3b8', fontSize: 12, marginTop: 8 },
  attachment: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 9, padding: 9, backgroundColor: '#eff6ff', borderRadius: 8 },
  attachmentName: { flex: 1, color: '#1d4ed8', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 6, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  button: { width: 42, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 8, backgroundColor: '#eff6ff' },
})
