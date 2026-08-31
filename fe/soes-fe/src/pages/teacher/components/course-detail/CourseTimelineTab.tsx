import { Download, Edit3, Paperclip, Pin, PinOff, Send, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { CourseAnnouncement } from '../../types/teacher-course.types'
import DeleteCoursePostDialog from './DeleteCoursePostDialog'

interface Props {
  announcements: CourseAnnouncement[]
  onCreate: (payload: { title: string; content: string; attachments?: File[] }) => Promise<void>
  onUpdate: (id: string, payload: { title: string; content: string; attachments?: File[] }) => Promise<void>
  onPin: (id: string, pinned: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onDownload: (postId: string, attachmentId: string, fileName: string) => Promise<void>
}

export default function CourseTimelineTab({ announcements, onCreate, onUpdate, onPin, onDelete, onDownload }: Props) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<CourseAnnouncement | null>(null)
  const [saving, setSaving] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])

  const reset = () => { setTitle(''); setContent(''); setEditingId(null); setAttachments([]) }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    try {
      const payload = { title: title.trim(), content: content.trim(), attachments }
      if (editingId) await onUpdate(editingId, payload); else await onCreate(payload)
      toast.success(editingId ? 'Đã cập nhật bài đăng.' : 'Đã đăng thông báo.')
      reset()
    } catch { toast.error('Không thể lưu bài đăng.') }
    finally { setSaving(false) }
  }
  const edit = (post: CourseAnnouncement) => {
    setEditingId(post.id); setTitle(post.title); setContent(post.content)
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
      <form onSubmit={submit} className="h-fit rounded-xl border border-gray-100 bg-white p-5 shadow-sm xl:sticky xl:top-0">
        <div className="flex items-start justify-between gap-3">
          <div><h3 className="text-base font-semibold text-gray-900">{editingId ? 'Sửa bài đăng' : 'Đăng thông báo'}</h3>
            <p className="mt-1 text-[13px] leading-[19px] text-gray-500">Thông báo sẽ hiển thị cho sinh viên của lớp.</p></div>
          {editingId && <button type="button" onClick={reset} title="Hủy chỉnh sửa" className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-100"><X size={17} /></button>}
        </div>
        <div className="mt-5 space-y-4">
          <Field label="Tiêu đề"><input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Thông báo lịch thi giữa kỳ" className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500" /></Field>
          <Field label="Nội dung"><textarea rows={7} required value={content} onChange={(e) => setContent(e.target.value)} placeholder="Nội dung thông báo..." className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-gray-800 outline-none focus:border-blue-500" /></Field>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Tệp đính kèm</span>
            <span className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600">
              <Paperclip size={16} /> Chọn tối đa 5 tệp
              <input
                type="file" multiple className="sr-only"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
                onChange={(event) => setAttachments(Array.from(event.target.files ?? []).slice(0, 5))}
              />
            </span>
            {!!attachments.length && <span className="mt-2 block truncate text-xs text-gray-500">{attachments.map(({ name }) => name).join(', ')}</span>}
          </label>
        </div>
        <button disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
          {editingId ? <Edit3 size={17} /> : <Send size={17} />} {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Đăng thông báo'}
        </button>
      </form>

      <div className="space-y-4">
        {[...announcements].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))).map((post) => (
          <article key={post.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-sm font-medium text-gray-900">{post.teacherName}</p><p className="mt-0.5 text-xs text-gray-400">{post.createdAt}</p></div>
              <div className="flex shrink-0 items-center gap-1">
                {post.pinned && <span className="mr-1 inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700"><Pin size={12} /> Đã ghim</span>}
                <IconButton title="Sửa bài đăng" onClick={() => edit(post)}><Edit3 size={17} /></IconButton>
                <IconButton title={post.pinned ? 'Bỏ ghim' : 'Ghim bài đăng'} onClick={() => void onPin(post.id, !post.pinned).catch(() => toast.error('Không thể cập nhật ghim.'))}>{post.pinned ? <PinOff size={17} /> : <Pin size={17} />}</IconButton>
                <IconButton title="Xóa bài đăng" danger onClick={() => setDeleting(post)}><Trash2 size={17} /></IconButton>
              </div>
            </div>
            <h4 className="mt-4 text-[15px] font-semibold leading-6 text-gray-900">{post.title}</h4>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">{post.content}</p>
            {!!post.attachedFiles?.length && <div className="mt-4 flex flex-wrap gap-2">{post.attachedFiles.map((file) => (
              <button type="button" key={file.id} onClick={() => void onDownload(post.id, file.id, file.name)} className="inline-flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:border-blue-200 hover:text-blue-600"><Paperclip size={15} /><span>{file.name}</span><span className="text-gray-400">({file.size})</span><Download size={14} /></button>
            ))}</div>}
          </article>
        ))}
      </div>
      <DeleteCoursePostDialog post={deleting} onClose={() => setDeleting(null)} onConfirm={() => {
        if (!deleting) return
        void onDelete(deleting.id).then(() => { toast.success('Đã xóa bài đăng.'); setDeleting(null) }).catch(() => toast.error('Không thể xóa bài đăng.'))
      }} />
    </div>
  )
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>{children}</label>
const IconButton = ({ title, onClick, danger, children }: { title: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) => (
  <button type="button" title={title} aria-label={title} onClick={onClick} className={`rounded-lg p-2 text-gray-400 transition-colors ${danger ? 'hover:bg-rose-50 hover:text-rose-600' : 'hover:bg-blue-50 hover:text-blue-600'}`}>{children}</button>
)
