import { Building2, Calendar, Globe, GraduationCap, Headphones, Mail, Phone, Save, Sparkles, Tag, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '../../../../api/errors'
import { removeSystemLogo, updateGeneralSettings, uploadSystemLogo } from '../../api/admin-system-settings.api'
import type { GeneralSettings } from '../../types/admin-system-settings.types'
import { updateClientSystemDateTimeSettings } from '../../../../utils/date.utils'
import { useSystemSettingsStore } from '../../../../store/systemSettingsStore'
import AdminButton from '../AdminButton'
import AdminSelect from '../AdminSelect'
import SystemLogoField from './SystemLogoField'

export default function GeneralSettingsPanel({
  settings,
  onUpdated,
}: {
  settings: GeneralSettings
  onUpdated: () => void
}) {
  const [form, setForm] = useState<GeneralSettings>({
    ...settings,
    shortName: settings.shortName || 'SOES',
    dateFormat: settings.dateFormat || 'DD/MM/YYYY',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [isLogoRemoved, setIsLogoRemoved] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.organizationName.trim()) {
      toast.error('Tên trường / đơn vị không được để trống')
      return
    }

    setSaving(true)
    try {
      let finalLogoUrl = form.logoUrl

      // 1. Tải logo mới lên Supabase nếu có chọn file
      if (logoFile) {
        const logoRes = await uploadSystemLogo(logoFile)
        finalLogoUrl = logoRes.logoUrl
      } else if (isLogoRemoved && form.logoUrl) {
        // 2. Xóa logo nếu có đánh dấu xóa
        const removeRes = await removeSystemLogo()
        finalLogoUrl = removeRes.logoUrl || ''
      }

      // 3. Cập nhật thông tin cấu hình văn bản
      const updatedSettings = await updateGeneralSettings({
        organizationName: form.organizationName,
        shortName: form.shortName,
        slogan: form.slogan,
        supportEmail: form.supportEmail,
        supportHotline: form.supportHotline,
        copyright: form.copyright,
        timezone: form.timezone,
        dateFormat: form.dateFormat,
        defaultLanguage: form.defaultLanguage,
      })

      const finalSettings: GeneralSettings = {
        ...updatedSettings,
        logoUrl: finalLogoUrl,
      }

      setForm(finalSettings)
      setLogoFile(null)
      setIsLogoRemoved(false)
      useSystemSettingsStore.getState().setSettings(finalSettings)
      updateClientSystemDateTimeSettings(finalSettings.timezone, finalSettings.dateFormat)
      toast.success('Đã lưu thông tin đơn vị & logo hệ thống thành công')
      onUpdated()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể lưu thông tin. Vui lòng kiểm tra lại.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Khối 1: Nhận diện & Cơ sở giáo dục */}
      <section className="space-y-5 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <Building2 size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Nhận diện & Tên cơ sở giáo dục</h3>
            <p className="text-xs text-slate-500">Thông tin hiển thị nhận diện thương hiệu trên cổng thi, thanh điều hướng và trang đăng nhập.</p>
          </div>
        </div>

        {/* Logo hệ thống */}
        <SystemLogoField
          savedLogoUrl={form.logoUrl}
          selectedFile={logoFile}
          isRemoved={isLogoRemoved}
          disabled={saving}
          onFileSelect={(file) => {
            setLogoFile(file)
            setIsLogoRemoved(false)
          }}
          onRemoveLogo={() => {
            setLogoFile(null)
            setIsLogoRemoved(true)
          }}
          onRevertLogo={() => {
            setLogoFile(null)
            setIsLogoRemoved(false)
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Tên trường (chiếm 2/3) */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <GraduationCap size={14} className="text-emerald-600" />
              Tên Trường học / Học viện / Đơn vị tổ chức thi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.organizationName}
              onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
              placeholder="Ví dụ: Trường Đại học Công nghệ & Khảo thí SOES"
              className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-slate-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Tên viết tắt hệ thống (chiếm 1/3) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Tag size={14} className="text-purple-600" />
              Tên viết tắt hệ thống
            </label>
            <input
              type="text"
              value={form.shortName}
              onChange={(e) => setForm({ ...form, shortName: e.target.value })}
              placeholder="Ví dụ: SOES, HCMUT, HUST"
              className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-slate-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <p className="text-[11px] text-slate-400">Hiển thị trên Sidebar, Header & Tab title.</p>
          </div>

          {/* Khẩu hiệu / Slogan */}
          <div className="space-y-1.5 md:col-span-3">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              Khẩu hiệu / Slogan cổng thi
            </label>
            <input
              type="text"
              value={form.slogan}
              onChange={(e) => setForm({ ...form, slogan: e.target.value })}
              placeholder="Ví dụ: Hệ thống thi và đánh giá trực tuyến thông minh"
              className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-slate-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>
      </section>

      {/* Khối 2: Liên hệ & Hỗ trợ kỹ thuật */}
      <section className="space-y-4 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <Headphones size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Kênh liên hệ & Hỗ trợ</h3>
            <p className="text-xs text-slate-500">Thông tin giải đáp thắc mắc cho thí sinh & thông tin pháp lý dưới chân trang.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hotline hỗ trợ */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Phone size={14} className="text-emerald-600" />
              Hotline hỗ trợ kỹ thuật
            </label>
            <input
              type="text"
              value={form.supportHotline}
              onChange={(e) => setForm({ ...form, supportHotline: e.target.value })}
              placeholder="Ví dụ: 1900 6868 hoặc 028 3896 8641"
              className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-slate-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <p className="text-[11px] text-slate-400">Đường dây nóng tiếp nhận sự cố trong ca thi.</p>
          </div>

          {/* Email hỗ trợ */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Mail size={14} className="text-blue-600" />
              Email liên hệ ban khảo thí
            </label>
            <input
              type="email"
              value={form.supportEmail}
              onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
              placeholder="Ví dụ: hotro.khaothi@soes.edu.vn"
              className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-slate-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <p className="text-[11px] text-slate-400">Hòm thư tiếp nhận yêu cầu phúc khảo & cấp lại tài khoản.</p>
          </div>

          {/* Bản quyền Footer */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-slate-600" />
              Thông tin bản quyền Footer
            </label>
            <input
              type="text"
              value={form.copyright}
              onChange={(e) => setForm({ ...form, copyright: e.target.value })}
              placeholder="© 2026 SOES - Smart Online Exam System. All rights reserved."
              className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-slate-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>
      </section>

      {/* Khối 3: Bản địa hóa & Thời gian */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <Globe size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Bản địa hóa & Thời gian hệ thống</h3>
            <p className="text-xs text-slate-500">Thiết lập múi giờ chuẩn và định dạng ngày tháng hiển thị trên lịch thi và biên bản.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Múi giờ */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Globe size={14} className="text-indigo-600" />
              Múi giờ chuẩn hệ thống
            </label>
            <AdminSelect
              value={form.timezone}
              onChange={(val) => setForm((prev) => ({ ...prev, timezone: val }))}
              options={[
                { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh (GMT+07:00)' },
                { value: 'Asia/Bangkok', label: 'Asia/Bangkok (GMT+07:00)' },
                { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+09:00)' },
                { value: 'UTC', label: 'UTC (GMT+00:00)' },
              ]}
            />
            <p className="text-[11px] text-slate-400">Đồng bộ tuyệt đối giờ mở đề và đếm ngược làm bài.</p>
          </div>

          {/* Định dạng ngày tháng */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar size={14} className="text-emerald-600" />
              Định dạng ngày tháng
            </label>
            <AdminSelect
              value={form.dateFormat}
              onChange={(val) => setForm((prev) => ({ ...prev, dateFormat: val }))}
              options={[
                { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (Chuẩn Việt Nam)' },
                { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (Chuẩn Quốc tế ISO)' },
                { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (Gạch ngang)' },
              ]}
            />
            <p className="text-[11px] text-slate-400">Áp dụng hiển thị trên lịch thi, danh sách ca và biên bản khảo thí.</p>
          </div>
        </div>
      </section>

      {/* Nút lưu */}
      <div className="pt-2 flex items-center justify-end gap-3">
        <AdminButton
          type="submit"
          icon={<Save size={16} />}
          disabled={saving}
        >
          {saving ? 'Đang lưu...' : 'Lưu thông tin đơn vị'}
        </AdminButton>
      </div>
    </form>
  )
}
