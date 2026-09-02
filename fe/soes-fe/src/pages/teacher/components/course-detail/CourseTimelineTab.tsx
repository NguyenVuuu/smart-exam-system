import { Download, Edit3, Paperclip, Pin, PinOff, Send, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { CourseAnnouncement } from '../../types/teacher-course.types'
import FileSelectionList from '../FileSelectionList'
import DeleteCoursePostDialog from './DeleteCoursePostDialog'

interface Props {
  announcements: CourseAnnouncement[]
  onCreate: (payload: { title: string; content: string; attachments?: File[] }) => Promise<void>
  onUpdate: (id: string, payload: { title: string; content: string; attachments?: File[]; removedAttachmentIds?: string[] }) => Promise<void>
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
  const [existingAttachments, setExistingAttachments] = useState<Array<{ id: string; name: string; size: string }>>([])
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([])
  const [attachments, setAttachments] = useState<File[]>([])

  const reset = () => {
    setTitle('')
    setContent('')
    setEditingId(null)
    setExistingAttachments([])
    setRemovedAttachmentIds([])
    setAttachments([])
  }

  const removeExistingAttachment = (attachmentId: string) => {
    setRemovedAttachmentIds((prev) => [...prev, attachmentId])
    setExistingAttachments((prev) => prev.filter((item) => item.id !== attachmentId))
  }

  const removeAttachment = (index: number) => {
    setAttachments((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !content.trim()) return

    setSaving(true)
    try {
      if (editingId) {
        await onUpdate(editingId, {
          title: title.trim(),
          content: content.trim(),
          attachments,
          removedAttachmentIds,
        })
      } else {
        await onCreate({
          title: title.trim(),
          content: content.trim(),
          attachments,
        })
      }
      toast.success(editingId ? 'Đã cập nhật bài đăng.' : 'Đã đăng thông báo.')
      reset()
    } catch {
      toast.error('Không thể lưu bài đăng.')
    } finally {
      setSaving(false)
    }
  }

  const edit = (post: CourseAnnouncement) => {
    setEditingId(post.id)
    setTitle(post.title)
    setContent(post.content)
    setExistingAttachments(post.attachedFiles ?? [])
    setRemovedAttachmentIds([])
    setAttachments([])
  }

  const maxNewFiles = Math.max(0, 5 - existingAttachments.length)

  return (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
      <form onSubmit={submit} className="h-fit rounded-xl border border-gray-100 bg-white p-5 shadow-sm xl:sticky xl:top-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{editingId ? 'Sửa bài đăng' : 'Đăng thông báo'}</h3>
            <p className="mt-1 text-[13px] leading-[19px] text-gray-500">Thông báo sẽ hiển thị cho sinh viên của lớp.</p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              title="Hủy chỉnh sửa"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-100 cursor-pointer"
            >
              <X size={17} />
            </button>
          )}
        </div>

        <div className="mt-5 space-y-4">
          <Field label="Tiêu đề">
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="VD: Thông báo lịch thi giữa kỳ"
              className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500"
            />
          </Field>

          <Field label="Nội dung">
            <textarea
              rows={7}
              required
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Nội dung thông báo..."
              className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-gray-800 outline-none focus:border-blue-500"
            />
          </Field>

          {/* Tệp đính kèm hiện có khi sửa bài */}
          {editingId && existingAttachments.length > 0 && (
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Tệp đính kèm hiện có ({existingAttachments.length})
              </span>
              <div className="space-y-2">
                {existingAttachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-xs text-gray-700"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Paperclip size={14} className="shrink-0 text-blue-600" />
                      <span className="truncate font-medium text-gray-800">{file.name}</span>
                      <span className="shrink-0 text-gray-400">({file.size})</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void onDownload(editingId, file.id, file.name)}
                        className="rounded p-1 text-gray-400 transition-colors hover:bg-blue-100 hover:text-blue-700 cursor-pointer"
                        title="Tải xuống tệp"
                      >
                        <Download size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeExistingAttachment(file.id)}
                        className="rounded p-1 text-gray-400 transition-colors hover:bg-rose-100 hover:text-rose-600 cursor-pointer"
                        title="Gỡ tệp này khỏi bài viết"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tải thêm tệp mới */}
          {maxNewFiles > 0 ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">
                {editingId && existingAttachments.length > 0 ? 'Đính kèm thêm tệp' : 'Tệp đính kèm'}
              </span>
              <span className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600">
                <Paperclip size={16} /> Chọn tối đa {maxNewFiles} tệp nữa
                <input
                  type="file"
                  multiple
                  className="sr-only"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
                  onChange={(event) => {
                    setAttachments(Array.from(event.target.files ?? []).slice(0, maxNewFiles))
                    event.currentTarget.value = ''
                  }}
                />
              </span>
            </label>
          ) : (
            <p className="text-xs text-amber-600">Bài đăng đã có tối đa 5 tệp đính kèm. Hãy gỡ bớt tệp nếu muốn chọn tệp mới.</p>
          )}

          <FileSelectionList
            files={attachments}
            onRemove={removeAttachment}
            onClear={() => setAttachments([])}
          />
        </div>

        <button
          disabled={saving}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
        >
          {editingId ? <Edit3 size={17} /> : <Send size={17} />}
          {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Đăng thông báo'}
        </button>
      </form>

      <div className="space-y-4">
        {[...announcements].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))).map((post) => (
          <article key={post.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{post.teacherName}</p>
                <p className="mt-0.5 text-xs text-gray-400">{post.createdAt}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {post.pinned && (
                  <span className="mr-1 inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700">
                    <Pin size={12} /> Đã ghim
                  </span>
                )}
                <IconButton title="Sửa bài đăng" onClick={() => edit(post)}><Edit3 size={17} /></IconButton>
                <IconButton title={post.pinned ? 'Bỏ ghim' : 'Ghim bài đăng'} onClick={() => void onPin(post.id, !post.pinned).catch(() => toast.error('Không thể cập nhật ghim.'))}>
                  {post.pinned ? <PinOff size={17} /> : <Pin size={17} />}
                </IconButton>
                <IconButton title="Xóa bài đăng" danger onClick={() => setDeleting(post)}><Trash2 size={17} /></IconButton>
              </div>
            </div>

            <h4 className="mt-4 text-[15px] font-semibold leading-6 text-gray-900">{post.title}</h4>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">{post.content}</p>

            {!!post.attachedFiles?.length && (
              <div className="mt-4 flex flex-wrap gap-2">
                {post.attachedFiles.map((file) => (
                  <button
                    type="button"
                    key={file.id}
                    onClick={() => void onDownload(post.id, file.id, file.name)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:border-blue-200 hover:text-blue-600"
                  >
                    <Paperclip size={15} />
                    <span>{file.name}</span>
                    <span className="text-gray-400">({file.size})</span>
                    <Download size={14} />
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      <DeleteCoursePostDialog
        post={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          void onDelete(deleting.id)
            .then(() => {
              toast.success('Đã xóa bài đăng.')
              setDeleting(null)
            })
            .catch(() => toast.error('Không thể xóa bài đăng.'))
        }}
      />
    </div>
  )
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
    {children}
  </label>
)

const IconButton = ({ title, onClick, danger, children }: { title: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    className={`rounded-lg p-2 text-gray-400 transition-colors ${danger ? 'hover:bg-rose-50 hover:text-rose-600' : 'hover:bg-blue-50 hover:text-blue-600'}`}
  >
    {children}
  </button>
)
