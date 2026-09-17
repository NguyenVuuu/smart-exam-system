import { Eye, RefreshCw, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import { AdminStatusBadge } from './components/AdminBadges'
import AdminButton from './components/AdminButton'
import AdminLayout from './components/AdminLayout'
import AdminModal from './components/AdminModal'
import AdminPageHeader from './components/AdminPageHeader'
import AdminTablePanel from './components/AdminTablePanel'
import { useAdminProctoringOverview } from './hooks/useAdminMonitoring'
import type { AdminProctoringRowDto } from './api/admin-monitoring.api'
import EvidenceImageModal from '../teacher/components/proctoring/EvidenceImageModal'
import { tokenStorage } from '../../utils/token'

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/api\/?$/, '')

export default function AdminProctoringPage() {
  const { rows, loading, error, retry } = useAdminProctoringOverview()
  const [selected, setSelected] = useState<AdminProctoringRowDto | null>(null)

  const totals = rows.reduce((acc, item) => ({
    online: acc.online + item.online,
    inProgress: acc.inProgress + item.inProgress,
    submitted: acc.submitted + item.submitted,
    warnings: acc.warnings + item.warnings,
  }), { online: 0, inProgress: 0, submitted: 0, warnings: 0 })

  const columns: ColumnDef<AdminProctoringRowDto>[] = [
    {
      header: 'CA THI ĐANG DIỄN RA',
      render: (item) => (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-950">{item.scheduleName}</p>
          <p className="text-xs text-slate-400">{item.subjectName} · {item.courseCode || 'Chưa gán lớp'}</p>
        </div>
      ),
    },
    { header: 'THAM GIA', width: '110px', render: (item) => <span className="text-sm text-slate-700">{item.joined}/{item.participantCount}</span> },
    { header: 'ONLINE', width: '100px', render: (item) => <span className="text-sm font-semibold text-emerald-600">{item.online}</span> },
    { header: 'ĐANG LÀM', width: '110px', render: (item) => <span className="text-sm text-slate-700">{item.inProgress}</span> },
    { header: 'ĐÃ NỘP', width: '100px', render: (item) => <span className="text-sm text-slate-700">{item.submitted}</span> },
    { header: 'VẮNG', width: '90px', render: (item) => <span className="text-sm text-slate-700">{item.absent}</span> },
    { header: 'MẤT KẾT NỐI', width: '130px', render: (item) => <span className="text-sm text-slate-700">{item.disconnected}</span> },
    { header: 'CẢNH BÁO MỚI', width: '120px', render: (item) => <span className={item.warnings > 0 ? 'text-sm font-semibold text-rose-600' : 'text-sm text-slate-500'}>{item.warnings}</span> },
    { header: 'TRẠNG THÁI', width: '130px', render: (item) => <AdminStatusBadge status={item.status === 'OPEN' ? 'ACTIVE' : 'INACTIVE'} /> },
    {
      header: '',
      width: '60px',
      align: 'right',
      render: (item) => (
        <button
          type="button"
          className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
          onClick={(event) => {
            event.stopPropagation()
            setSelected(item)
          }}
          title="Xem cảnh báo và bằng chứng"
        >
          <Eye size={17} />
        </button>
      ),
    },
  ]

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<ShieldAlert size={20} />}
        title="Giám sát ca thi"
        description="Dùng trong lúc kỳ thi đang diễn ra: ưu tiên trạng thái trực tiếp, cảnh báo mới và bằng chứng vi phạm."
        action={<AdminButton icon={<RefreshCw size={17} />} onClick={retry}>Làm mới</AdminButton>}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Online" value={totals.online} />
        <Kpi label="Đang làm" value={totals.inProgress} />
        <Kpi label="Đã nộp" value={totals.submitted} />
        <Kpi label="Cảnh báo mới" value={totals.warnings} tone="rose" />
      </div>

      {error && <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <AdminTablePanel>
        <DataTable
          columns={columns}
          data={loading ? [] : rows}
          keyExtractor={(item) => item.id}
          emptyText={loading ? 'Đang tải dữ liệu giám sát...' : 'Không có ca thi đang diễn ra.'}
        />
      </AdminTablePanel>

      <SessionDetailModal session={selected} onClose={() => setSelected(null)} />
    </AdminLayout>
  )
}

function SessionDetailModal({ session, onClose }: { session: AdminProctoringRowDto | null; onClose: () => void }) {
  const recentViolations = session?.recentViolations ?? []
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null)

  return (
    <>
      <AdminModal
        open={Boolean(session)}
        title={session?.scheduleName ?? ''}
        description="Chi tiết trạng thái ca thi và các cảnh báo gần nhất. Admin chỉ mở bằng chứng khi cần rà soát, không tải camera hàng loạt."
        confirmText="Đóng"
        onClose={onClose}
        onConfirm={onClose}
        size="xl"
      >
        {session && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <MiniStat label="Tham gia" value={`${session.joined}/${session.participantCount}`} />
              <MiniStat label="Online" value={String(session.online)} />
              <MiniStat label="Mất kết nối" value={String(session.disconnected)} />
              <MiniStat label="Cảnh báo" value={String(session.warnings)} tone="rose" />
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-100">
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-slate-900">
                Cảnh báo và bằng chứng gần nhất
              </div>
              {recentViolations.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-500">Chưa có cảnh báo trong ca thi này.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentViolations.map((violation) => (
                    <div key={violation.id} className="grid gap-3 px-4 py-3 md:grid-cols-[1.2fr_1fr_1fr]">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{violation.studentName}</p>
                        <p className="text-xs text-slate-400">{violation.studentCode}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-700">{violation.type}</p>
                        <p className="text-xs text-slate-400">{new Date(violation.detectedAt).toLocaleString('vi-VN')}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${violation.severity === 'HIGH' ? 'bg-rose-50 text-rose-600' : violation.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                          {violation.severity}
                        </span>
                        {violation.evidenceUrls.length === 0 ? (
                          <span className="text-xs text-slate-400">Không có bằng chứng</span>
                        ) : violation.evidenceUrls.map((url, index) => (
                          <button
                            key={url}
                            type="button"
                            onClick={() => setEvidenceUrl(toEvidenceImageUrl(url))}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Bằng chứng {index + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AdminModal>
      <EvidenceImageModal imageUrl={evidenceUrl} onClose={() => setEvidenceUrl(null)} title="Ảnh bằng chứng vi phạm" />
    </>
  )
}

function toEvidenceImageUrl(path: string) {
  const url = path.startsWith('http') ? path : `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
  if (!url.includes('/api/local-evidence/')) return url
  const token = tokenStorage.getAccessToken()
  if (!token) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}token=${encodeURIComponent(token)}`
}

function Kpi({ label, value, tone = 'emerald' }: { label: string; value: number; tone?: 'emerald' | 'rose' }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone === 'rose' ? 'text-rose-600' : 'text-emerald-600'}`}>{value}</p>
    </div>
  )
}

function MiniStat({ label, value, tone = 'slate' }: { label: string; value: string; tone?: 'slate' | 'rose' }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone === 'rose' ? 'text-rose-600' : 'text-slate-900'}`}>{value}</p>
    </div>
  )
}
