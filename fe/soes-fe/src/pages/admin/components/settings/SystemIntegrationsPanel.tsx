import { CheckCircle2, CircleAlert, CircleX, Database, HardDrive, Cpu, Zap } from 'lucide-react'
import type { AdminSystemSettings, IntegrationState, IntegrationStatus } from '../../types/admin-system-settings.types'

const stateMeta: Record<IntegrationState, {
  label: string
  className: string
  icon: typeof CheckCircle2
}> = {
  CONNECTED: { label: 'Đang hoạt động', className: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', icon: CheckCircle2 },
  CONFIGURED: { label: 'Đã cấu hình', className: 'bg-blue-50 text-blue-700 border-blue-200/60', icon: CheckCircle2 },
  NOT_CONFIGURED: { label: 'Chưa cấu hình', className: 'bg-amber-50 text-amber-700 border-amber-200/60', icon: CircleAlert },
  UNAVAILABLE: { label: 'Không phản hồi', className: 'bg-rose-50 text-rose-700 border-rose-200/60', icon: CircleX },
}

export default function SystemIntegrationsPanel({ settings }: { settings: AdminSystemSettings }) {
  const { integrations, runtime, ai, uploads } = settings

  return (
    <div className="p-6 space-y-6" role="tabpanel">
      {/* Grid kết nối dịch vụ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>

      {/* Bảng thông số tài nguyên & Giới hạn */}
      <div className="pt-4 border-t border-gray-100 space-y-4">
        <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <HardDrive size={16} className="text-slate-600" />
          Giới hạn Tài nguyên & Phiên làm việc (System Quotas)
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ResourceBox label="Tài liệu môn học" value={`${uploads.courseMaterialsMb} MB`} />
          <ResourceBox label="Nguồn tài liệu AI" value={`${uploads.aiSourcesMb} MB`} />
          <ResourceBox label="Ảnh câu hỏi thi" value={`${uploads.questionImagesMb} MB`} />
          <ResourceBox label="Ảnh bằng chứng vi phạm" value={`${uploads.evidenceImagesMb} MB`} />
          <ResourceBox label="Thời hạn Access Token" value={`${runtime.accessTokenMinutes} phút`} />
          <ResourceBox label="Thời hạn Refresh Token" value={`${runtime.refreshTokenDays} ngày`} />
          <ResourceBox label="Judge0 Batch size" value={`${ai.judgeBatchSize} bài`} />
          <ResourceBox label="AI Questions / Run" value={`${ai.maxQuestionsPerRun} câu`} />
        </div>
      </div>
    </div>
  )
}

function IntegrationCard({ integration }: { integration: IntegrationStatus }) {
  const meta = stateMeta[integration.state]
  const Icon = meta.icon

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-200/80 bg-white p-4 shadow-2xs">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
          {integration.id === 'DATABASE' ? <Database size={18} className="text-blue-600" /> :
           integration.id === 'REDIS' ? <Zap size={18} className="text-rose-600" /> :
           integration.id === 'GEMINI' ? <Cpu size={18} className="text-indigo-600" /> :
           integration.id === 'JUDGE0' ? <Cpu size={18} className="text-emerald-600" /> :
           <HardDrive size={18} className="text-slate-600" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{integration.name}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{integration.detail}</p>
        </div>
      </div>

      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
        <Icon size={13} />
        {meta.label}
      </span>
    </div>
  )
}

function ResourceBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60">
      <p className="text-[11px] font-medium text-slate-500 truncate">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  )
}
