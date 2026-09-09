import { AlertTriangle, CircleCheck, RefreshCw, RotateCcw, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '../../api/errors'
import { resetDefaultSystemSettings } from './api/admin-system-settings.api'
import { useSystemSettingsStore } from '../../store/systemSettingsStore'
import AdminButton from './components/AdminButton'
import AdminLayout from './components/AdminLayout'
import AdminModal from './components/AdminModal'
import AdminPageHeader from './components/AdminPageHeader'
import AiSettingsPanel from './components/settings/AiSettingsPanel'
import CodeGenerationSettingsPanel from './components/settings/CodeGenerationSettingsPanel'
import ExamDefaultsSettingsPanel from './components/settings/ExamDefaultsSettingsPanel'
import GeneralSettingsPanel from './components/settings/GeneralSettingsPanel'
import SystemIntegrationsPanel from './components/settings/SystemIntegrationsPanel'
import SystemSettingsTabs from './components/settings/SystemSettingsTabs'
import { useAdminSystemSettings } from './hooks/useAdminSystemSettings'
import type { SystemSettingsTab } from './types/admin-system-settings.types'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SystemSettingsTab>('GENERAL')
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetting, setResetting] = useState(false)
  const { data, loading, error, refresh } = useAdminSystemSettings()

  useEffect(() => {
    if (data?.general) {
      useSystemSettingsStore.getState().setSettings(data.general)
    }
  }, [data])

  const handleConfirmReset = async () => {
    setResetting(true)
    try {
      await resetDefaultSystemSettings()
      await useSystemSettingsStore.getState().fetchPublicSettings()
      toast.success('Đã khôi phục toàn bộ cấu hình hệ thống về mặc định thành công')
      setShowResetModal(false)
      void refresh()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể khôi phục cài đặt. Vui lòng thử lại.'))
    } finally {
      setResetting(false)
    }
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<Settings size={20} />}
        title="Cấu hình hệ thống"
        description="Quản trị thông tin đơn vị, quy tắc thi cử mặc định, định dạng mã và chẩn đoán hạ tầng SOES."
        action={(
          <div className="flex items-center gap-2">
            <AdminButton
              tone="secondary"
              icon={<RotateCcw size={15} />}
              onClick={() => setShowResetModal(true)}
              disabled={resetting || loading}
            >
              Cài đặt gốc
            </AdminButton>
            <AdminButton
              tone="secondary"
              icon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
              onClick={() => void refresh()}
              disabled={loading}
            >
              Kiểm tra lại
            </AdminButton>
          </div>
        )}
      />

      <section className="overflow-hidden border-y border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 bg-slate-50/70 px-2 sm:px-4">
          <SystemSettingsTabs value={activeTab} onChange={setActiveTab} />
          {data && (
            <div className="flex items-center gap-3 py-2 sm:py-0 px-2">
              <span className="text-[11.5px] text-slate-400 hidden md:inline">
                Đồng bộ: {formatCheckedAt(data.checkedAt)}
              </span>
              <SystemHealth integrations={data.integrations} />
            </div>
          )}
        </div>

        {loading && !data ? (
          <SettingsMessage message="Đang tải cấu hình hệ thống..." />
        ) : error && !data ? (
          <SettingsMessage message={error} tone="error" action={() => void refresh()} />
        ) : data ? (
          <>
            {activeTab === 'GENERAL' && (
              <GeneralSettingsPanel
                key={`general-${data.checkedAt}`}
                settings={data.general}
                onUpdated={() => void refresh()}
              />
            )}
            {activeTab === 'EXAM_DEFAULTS' && (
              <ExamDefaultsSettingsPanel
                key={`exam-${data.checkedAt}`}
                settings={data.examDefaults}
                onUpdated={() => void refresh()}
              />
            )}
            {activeTab === 'CODE_GENERATION' && (
              <CodeGenerationSettingsPanel
                key={`code-${data.checkedAt}`}
                settings={data.codeGeneration}
                onUpdated={() => void refresh()}
              />
            )}
            {activeTab === 'AI' && (
              <AiSettingsPanel
                key={`ai-${data.checkedAt}`}
                settings={data.ai}
                onUpdated={() => void refresh()}
              />
            )}
            {activeTab === 'INTEGRATIONS' && (
              <SystemIntegrationsPanel settings={data} />
            )}
          </>
        ) : null}
      </section>

      <AdminModal
        open={showResetModal}
        size="md"
        title="Khôi phục Cài đặt gốc Hệ thống"
        description="Thao tác này sẽ thiết lập lại toàn bộ thông tin đơn vị, quy tắc thi mặc định và định dạng mã về giá trị chuẩn ban đầu."
        confirmText={resetting ? 'Đang khôi phục...' : 'Khôi phục cài đặt gốc'}
        confirmTone="danger"
        confirmDisabled={resetting}
        onClose={() => setShowResetModal(false)}
        onConfirm={() => void handleConfirmReset()}
      >
        <div className="flex items-start gap-3.5 rounded-lg border border-rose-200/60 bg-rose-50 p-4 text-xs text-rose-900">
          <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-950">Lưu ý quan trọng trước khi khôi phục:</p>
            <p className="text-rose-800 leading-relaxed">
              Tất cả các tùy chỉnh tên trường, logo, hotline hỗ trợ, quy tắc an ninh phòng thi và tiền tố mã tài khoản sẽ quay về trạng thái mặc định của nhà phát triển.
            </p>
          </div>
        </div>
      </AdminModal>
    </AdminLayout>
  )
}

function SystemHealth({ integrations }: { integrations: Array<{ state: string }> }) {
  const issueCount = integrations.filter(({ state }) => state === 'UNAVAILABLE' || state === 'NOT_CONFIGURED').length
  const hasIssues = issueCount > 0
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
      !hasIssues
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
        : 'bg-amber-50 text-amber-700 border-amber-200/60'
    }`}>
      {hasIssues ? <AlertTriangle size={13} /> : <CircleCheck size={13} />}
      {hasIssues ? `${issueCount} dịch vụ cần kiểm tra` : 'Tất cả dịch vụ sẵn sàng'}
    </span>
  )
}

function SettingsMessage({
  message,
  tone = 'default',
  action,
}: {
  message: string
  tone?: 'default' | 'error'
  action?: () => void
}) {
  return (
    <div className={`flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-12 text-sm ${
      tone === 'error' ? 'text-rose-600' : 'text-slate-500'
    }`}>
      <span>{message}</span>
      {action && <AdminButton tone="secondary" onClick={action}>Thử lại</AdminButton>}
    </div>
  )
}

const formatCheckedAt = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit', minute: '2-digit', second: '2-digit',
}).format(new Date(value))
