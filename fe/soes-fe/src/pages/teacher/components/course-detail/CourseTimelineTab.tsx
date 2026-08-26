import { Download, Paperclip, Pin, PinOff, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'

export interface CourseAnnouncement {
  id: string
  title: string
  content: string
  attachedFiles?: Array<{
    name: string
    size: string
  }>
  createdAt: string
  teacherName: string
  pinned?: boolean
}

let draftAnnSequence = 0

export default function CourseTimelineTab({
  teacherName,
  announcements,
  setAnnouncements,
}: {
  teacherName: string
  announcements: CourseAnnouncement[]
  setAnnouncements: React.Dispatch<React.SetStateAction<CourseAnnouncement[]>>
}) {
  const [annTitleInput, setAnnTitleInput] = useState('')
  const [annContentInput, setAnnContentInput] = useState('')
  const [annFileInput, setAnnFileInput] = useState('')

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault()
    if (!annTitleInput.trim() || !annContentInput.trim()) return

    const newAnn: CourseAnnouncement = {
      id: `ann-draft-${++draftAnnSequence}`,
      title: annTitleInput.trim(),
      content: annContentInput.trim(),
      attachedFiles: annFileInput.trim()
        ? annFileInput
            .split(',')
            .map((fileName) => fileName.trim())
            .filter(Boolean)
            .map((fileName) => ({ name: fileName, size: 'Tệp đính kèm' }))
        : undefined,
      createdAt: 'Vừa xong',
      teacherName,
    }

    setAnnouncements([newAnn, ...announcements])
    setAnnTitleInput('')
    setAnnContentInput('')
    setAnnFileInput('')
  }

  const toggleAnnouncementPin = (announcementId: string) => {
    setAnnouncements((prev) =>
      prev.map((announcement) =>
        announcement.id === announcementId
          ? { ...announcement, pinned: !announcement.pinned }
          : announcement,
      ),
    )
  }

  const removeAnnouncement = (announcementId: string) => {
    setAnnouncements((prev) => prev.filter((announcement) => announcement.id !== announcementId))
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <form
        onSubmit={handleCreateAnnouncement}
        className="h-fit rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-gray-900">Đăng thông báo</h3>
          <p className="text-sm text-gray-500">Thông báo sẽ hiển thị cho sinh viên của lớp.</p>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Tiêu đề</label>
            <input
              type="text"
              required
              placeholder="VD: Thông báo lịch thi giữa kỳ"
              value={annTitleInput}
              onChange={(e) => setAnnTitleInput(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Nội dung</label>
            <textarea
              rows={6}
              required
              placeholder="Nội dung thông báo..."
              value={annContentInput}
              onChange={(e) => setAnnContentInput(e.target.value)}
              className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm leading-6 text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Tệp đính kèm</label>
            <input
              type="text"
              placeholder="VD: BaiTap_Tuan4.pdf, HuongDan_NopBai.docx"
              value={annFileInput}
              onChange={(e) => setAnnFileInput(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700"
        >
          <Send size={18} /> Đăng thông báo
        </button>
      </form>

      <div className="space-y-4">
        {[...announcements]
          .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)))
          .map((ann) => (
            <article
              key={ann.id}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                    NV
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{ann.teacherName}</p>
                    <p className="text-sm text-gray-400">{ann.createdAt}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {ann.pinned && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      <Pin size={13} /> Đã ghim
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleAnnouncementPin(ann.id)}
                    title={ann.pinned ? 'Bỏ ghim thông báo' : 'Ghim thông báo'}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-blue-600"
                  >
                    {ann.pinned ? <PinOff size={17} /> : <Pin size={17} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAnnouncement(ann.id)}
                    title="Xóa thông báo"
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <h4 className="text-base font-semibold leading-6 text-gray-900">{ann.title}</h4>
                <p className="text-sm leading-7 text-gray-700 whitespace-pre-line">{ann.content}</p>
              </div>

              {ann.attachedFiles && ann.attachedFiles.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {ann.attachedFiles.map((file) => (
                    <button
                      key={file.name}
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Paperclip size={15} className="text-gray-400" />
                      <span>{file.name}</span>
                      <span className="text-gray-400">({file.size})</span>
                      <Download size={14} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
      </div>
    </div>
  )
}
