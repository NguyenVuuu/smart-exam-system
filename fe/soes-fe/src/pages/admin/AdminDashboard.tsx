import { BarChart3, CalendarClock, Database, FileCheck, GraduationCap, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBadge from '../../components/common/AppBadge'
import AdminButton from './components/AdminButton'
import AdminLayout from './components/AdminLayout'
import AdminPageHeader from './components/AdminPageHeader'

export default function AdminDashboard() {
  const navigate = useNavigate()

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<BarChart3 size={20} />}
        title="Dashboard"
        description="Tổng quan vận hành học vụ, đề thi, lịch thi, giám sát và báo cáo toàn hệ thống."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Lớp đang mở" value="4 lớp" subtitle="HK1_2026" icon={<GraduationCap size={20} />} />
        <KpiCard title="Tài khoản hoạt động" value="6" subtitle="Admin, giảng viên, sinh viên" icon={<Users size={20} />} />
        <KpiCard title="Đề chờ chuyên môn" value="1 đề" subtitle="Cuối kỳ cần Trưởng bộ môn duyệt" icon={<FileCheck size={20} />} tone="amber" />
        <KpiCard title="Ca thi đang mở" value="1 ca" subtitle="Có 5 cảnh báo realtime" icon={<CalendarClock size={20} />} tone="rose" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Công việc cần xử lý</h2>
              <p className="mt-1 text-[13px] text-slate-500">Các hàng đợi vận hành quan trọng trong ngày.</p>
            </div>
            <AdminButton tone="secondary" onClick={() => navigate('/admin/exams')}>Xem đề thi</AdminButton>
          </div>
          <div className="divide-y divide-gray-100">
            <QueueItem
              badge={<AppBadge tone="amber">Chờ Trưởng bộ môn</AppBadge>}
              title="Bài thi Cuối kỳ Lập trình Java"
              description="Giảng viên Nguyễn Văn An gửi đề, chưa đủ điều kiện tạo lịch thi tập trung."
              actionLabel="Theo dõi"
              onAction={() => navigate('/admin/exams')}
            />
            <QueueItem
              badge={<AppBadge tone="emerald">Sẵn sàng</AppBadge>}
              title="Bài thi Giữa kỳ Lập trình Java"
              description="Có thể tạo ca thi cho JAVA_01_HK1_2026 và JAVA_02_HK1_2026."
              actionLabel="Tạo lịch"
              onAction={() => navigate('/admin/exam-schedules')}
            />
            <QueueItem
              badge={<AppBadge tone="rose">Cảnh báo</AppBadge>}
              title="Ca thi Giữa kỳ Lập trình Java 08:00"
              description="5 cảnh báo gian lận, 1 sinh viên mất kết nối cần theo dõi."
              actionLabel="Giám sát"
              onAction={() => navigate('/admin/proctoring')}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Truy cập nhanh</h2>
          <p className="mt-1 text-[13px] text-slate-500">Các luồng Admin dùng thường xuyên.</p>
          <div className="mt-5 grid grid-cols-1 gap-3">
            <QuickAction icon={<GraduationCap size={18} />} label="Quản lý lớp học phần" onClick={() => navigate('/admin/class-sections')} />
            <QuickAction icon={<Database size={18} />} label="Ngân hàng câu hỏi chung" onClick={() => navigate('/admin/shared-question-bank')} />
            <QuickAction icon={<CalendarClock size={18} />} label="Lịch thi và phân công" onClick={() => navigate('/admin/exam-schedules')} />
            <QuickAction icon={<BarChart3 size={18} />} label="Báo cáo toàn trường" onClick={() => navigate('/admin/reports')} />
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  tone = 'emerald',
}: {
  title: string
  value: string
  subtitle: string
  icon: ReactNode
  tone?: 'emerald' | 'amber' | 'rose'
}) {
  const toneClassName = {
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  }[tone]

  return (
    <section className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClassName}`}>
        {icon}
      </div>
    </section>
  )
}

function QueueItem({
  badge,
  title,
  description,
  actionLabel,
  onAction,
}: {
  badge: ReactNode
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {badge}
          <p className="text-sm font-semibold text-slate-950">{title}</p>
        </div>
        <p className="text-[13px] text-slate-500">{description}</p>
      </div>
      <AdminButton tone="secondary" onClick={onAction}>{actionLabel}</AdminButton>
    </div>
  )
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
    >
      {icon}
      {label}
    </button>
  )
}
