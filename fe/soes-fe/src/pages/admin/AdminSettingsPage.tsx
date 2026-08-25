import { Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import AdminButton from './components/AdminButton'
import { AdminField, AdminInput } from './components/AdminFormFields'
import AdminLayout from './components/AdminLayout'
import AdminPageHeader from './components/AdminPageHeader'

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<Settings size={20} />}
        title="Cấu hình hệ thống"
        description="Quy tắc mã tài khoản, giới hạn upload, AI/Judge0 và ngưỡng chống gian lận."
        action={<AdminButton onClick={() => alert('Đã lưu cấu hình mẫu.')}>Lưu cấu hình</AdminButton>}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <SettingCard title="Tài khoản và bảo mật" description="Quy tắc sinh mã và phiên đăng nhập.">
          <AdminField label="Quy tắc mã sinh viên"><AdminInput defaultValue="SV{YYYY}{4}" /></AdminField>
          <AdminField label="Thời gian hết phiên Admin (phút)"><AdminInput type="number" defaultValue={30} /></AdminField>
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Mật khẩu luôn được băm an toàn. Không lưu mật khẩu dạng rõ trong frontend hoặc log.
          </div>
        </SettingCard>

        <SettingCard title="Upload và AI" description="Giới hạn tài liệu, OCR và dịch vụ sinh câu hỏi.">
          <AdminField label="Giới hạn upload tài liệu (MB)"><AdminInput type="number" defaultValue={20} /></AdminField>
          <AdminField label="Model AI mặc định"><AdminInput defaultValue="SOES-AI-MCQ" /></AdminField>
          <AdminField label="Hệ thống chấm code"><AdminInput defaultValue="Judge0 CE" /></AdminField>
        </SettingCard>

        <SettingCard title="Chống gian lận" description="Ngưỡng cảnh báo, không tự cho điểm 0.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AdminField label="Ngưỡng chuyển tab (lần)"><AdminInput type="number" defaultValue={3} /></AdminField>
            <AdminField label="Ngưỡng mất khuôn mặt (giây)"><AdminInput type="number" defaultValue={5} /></AdminField>
          </div>
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Vi phạm chỉ tạo bằng chứng và cảnh báo. Không cấu hình tự động trừ điểm hoặc tự hủy bài.
          </div>
        </SettingCard>

        <SettingCard title="Bằng chứng" description="Thời gian lưu trữ webcam và signed URL.">
          <AdminField label="Thời gian lưu bằng chứng (ngày)"><AdminInput type="number" defaultValue={90} /></AdminField>
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Bằng chứng được lưu bằng URL ký, chỉ người có quyền giám sát/xử lý mới xem được.
          </div>
        </SettingCard>
      </div>
    </AdminLayout>
  )
}

function SettingCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-[13px] text-slate-500">{description}</p>
      </div>
      <div className="space-y-4 p-6">
        {children}
      </div>
    </section>
  )
}
