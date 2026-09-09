import { KeyRound, Save, UserCheck, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '../../../../api/errors'
import { updateCodeGenerationSettings } from '../../api/admin-system-settings.api'
import type { CodeGenerationSettings } from '../../types/admin-system-settings.types'
import AdminButton from '../AdminButton'

export default function CodeGenerationSettingsPanel({
  settings,
  onUpdated,
}: {
  settings: CodeGenerationSettings
  onUpdated: () => void
}) {
  const [form, setForm] = useState<CodeGenerationSettings>(settings)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.studentPrefix.trim() || !form.teacherPrefix.trim() || !form.adminPrefix.trim()) {
      toast.error('Tiền tố mã không được để trống')
      return
    }

    setSaving(true)
    try {
      await updateCodeGenerationSettings(form)
      toast.success('Đã lưu quy tắc sinh mã tài khoản tự động thành công')
      onUpdated()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể lưu quy tắc sinh mã. Vui lòng kiểm tra lại.'))
    } finally {
      setSaving(false)
    }
  }

  const renderSample = (prefix: string, digits: number) => {
    const num = '1'.padStart(digits, '0')
    return `${prefix.toUpperCase()}${num}`
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Mã Sinh viên */}
        <div className="space-y-4 rounded-lg border border-gray-200/80 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={17} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Mã Sinh viên</p>
              <p className="text-[11px] text-slate-400">Tài khoản sinh viên</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Tiền tố (Prefix)</label>
              <input
                type="text"
                value={form.studentPrefix}
                onChange={(e) => setForm({ ...form, studentPrefix: e.target.value.toUpperCase() })}
                maxLength={10}
                className="mt-1 w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-slate-800 uppercase outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Số chữ số (Digits)</label>
              <input
                type="number"
                min={4}
                max={12}
                value={form.studentDigits}
                onChange={(e) => setForm({ ...form, studentDigits: Math.max(4, Math.min(12, Number(e.target.value) || 6)) })}
                className="mt-1 w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
              <span className="text-xs text-slate-500">Mã mẫu:</span>
              <span className="font-mono text-xs font-bold text-blue-600">
                {renderSample(form.studentPrefix || 'SV', form.studentDigits)}
              </span>
            </div>
          </div>
        </div>

        {/* Mã Giảng viên */}
        <div className="space-y-4 rounded-lg border border-gray-200/80 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck size={17} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Mã Giảng viên</p>
              <p className="text-[11px] text-slate-400">Tài khoản cán bộ / giảng viên</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Tiền tố (Prefix)</label>
              <input
                type="text"
                value={form.teacherPrefix}
                onChange={(e) => setForm({ ...form, teacherPrefix: e.target.value.toUpperCase() })}
                maxLength={10}
                className="mt-1 w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-slate-800 uppercase outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Số chữ số (Digits)</label>
              <input
                type="number"
                min={4}
                max={12}
                value={form.teacherDigits}
                onChange={(e) => setForm({ ...form, teacherDigits: Math.max(4, Math.min(12, Number(e.target.value) || 6)) })}
                className="mt-1 w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
              <span className="text-xs text-slate-500">Mã mẫu:</span>
              <span className="font-mono text-xs font-bold text-emerald-600">
                {renderSample(form.teacherPrefix || 'GV', form.teacherDigits)}
              </span>
            </div>
          </div>
        </div>

        {/* Mã Quản trị viên */}
        <div className="space-y-4 rounded-lg border border-gray-200/80 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <KeyRound size={17} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Mã Quản trị viên</p>
              <p className="text-[11px] text-slate-400">Tài khoản admin hệ thống</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Tiền tố (Prefix)</label>
              <input
                type="text"
                value={form.adminPrefix}
                onChange={(e) => setForm({ ...form, adminPrefix: e.target.value.toUpperCase() })}
                maxLength={10}
                className="mt-1 w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-slate-800 uppercase outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Số chữ số (Digits)</label>
              <input
                type="number"
                min={4}
                max={12}
                value={form.adminDigits}
                onChange={(e) => setForm({ ...form, adminDigits: Math.max(4, Math.min(12, Number(e.target.value) || 6)) })}
                className="mt-1 w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
              <span className="text-xs text-slate-500">Mã mẫu:</span>
              <span className="font-mono text-xs font-bold text-purple-600">
                {renderSample(form.adminPrefix || 'AD', form.adminDigits)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
        <AdminButton
          type="submit"
          icon={<Save size={16} />}
          disabled={saving}
        >
          {saving ? 'Đang lưu...' : 'Lưu quy tắc sinh mã'}
        </AdminButton>
      </div>
    </form>
  )
}
