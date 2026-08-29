import { AlertTriangle } from 'lucide-react'
import type { CourseAnnouncement } from '../../types/teacher-course.types'

export default function DeleteCoursePostDialog({ post, onClose, onConfirm }: {
  post: CourseAnnouncement | null; onClose: () => void; onConfirm: () => void
}) {
  if (!post) return null
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-900">Xóa bài đăng</h2>
        </div>
        <div className="flex gap-4 px-6 py-5 text-sm text-slate-600">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-500"><AlertTriangle size={20} /></span>
          <p>Bạn có chắc muốn xóa bài đăng <span className="font-medium text-slate-900">{post.title}</span>? Thao tác này không thể hoàn tác.</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm">Hủy</button>
          <button onClick={onConfirm} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white">Xóa bài đăng</button>
        </div>
      </div>
    </div>
  )
}
