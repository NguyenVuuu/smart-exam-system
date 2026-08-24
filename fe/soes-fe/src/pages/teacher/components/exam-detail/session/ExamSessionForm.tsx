import { Clock, Eye, Globe, Lock, ShieldCheck, Shuffle, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import AppNumberInput from '../../../../../components/common/AppNumberInput'
import AppSelect from '../../../../../components/common/AppSelect'
import { MOCK_TEACHER_COURSES } from '../../../mock/teacher-course.mock'
import type {
  ExamIpMode,
  ExamDistributionMode,
  ResultReleaseMode,
} from '../../../types/teacher-exam.types'

export interface ExamSessionDraft {
  courseOfferingId: string
  examDate: string
  startTime: string
  endTime: string
  durationMinutes: number
  maxAttempts: number
  password: string
  resultReleaseMode: ResultReleaseMode
  resultReleaseAt: string
  allowStudentReview: boolean
  requireFullscreen: boolean
  enableWebcam: boolean
  blockCopyPaste: boolean
  blockRightClick: boolean
  ipMode: ExamIpMode
  allowedIpRange: string
  distributionMode: ExamDistributionMode
}

export function ExamSessionForm({
  draft,
  subjectName,
  onChange,
  onAdd,
  submitLabel = 'Thêm ca',
  showSubmit = true,
}: {
  draft: ExamSessionDraft
  subjectName: string
  onChange: (draft: ExamSessionDraft) => void
  onAdd: () => void
  submitLabel?: string
  showSubmit?: boolean
}) {
  const update = <K extends keyof ExamSessionDraft>(key: K, value: ExamSessionDraft[K]) => {
    onChange({ ...draft, [key]: value })
  }

  return (
    <div className="space-y-4">
      <SectionTitle icon={<Users size={15} className="text-blue-600" />} title="Lớp và thời gian thi" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Field label="Lớp học phần" className="md:col-span-4">
          <AppSelect
            value={draft.courseOfferingId}
            onChange={(value) => update('courseOfferingId', value)}
            buttonClassName="bg-gray-50"
            menuClassName="z-50"
            options={MOCK_TEACHER_COURSES.filter((course) => course.subjectName === subjectName).map((course) => ({
              value: course.id,
              label: `${course.courseCode} - ${course.subjectName} (${course.totalStudents} SV)`,
            }))}
          />
        </Field>

        <Field label="Ngày thi">
          <input
            type="date"
            value={draft.examDate}
            onChange={(event) => update('examDate', event.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-xl p-2.5"
          />
        </Field>

        <Field label="Giờ mở bài">
          <input
            type="time"
            value={draft.startTime}
            onChange={(event) => update('startTime', event.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-xl p-2.5"
          />
        </Field>

        <Field label="Giờ đóng ca">
          <input
            type="time"
            value={draft.endTime}
            onChange={(event) => update('endTime', event.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-xl p-2.5"
          />
        </Field>

        <Field label="Thời lượng làm bài">
          <AppNumberInput
            value={draft.durationMinutes}
            onChange={(value) => update('durationMinutes', value)}
            suffix="phút"
          />
        </Field>

        <Field label="Số lần làm bài" className="md:col-start-4">
          <input
            type="number"
            min={1}
            value={draft.maxAttempts}
            onChange={(event) => update('maxAttempts', Number(event.target.value))}
            className="w-full bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-xl p-2.5"
          />
        </Field>
      </div>

      <SectionTitle icon={<Lock size={15} className="text-blue-600" />} title="Truy cập và điểm số" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Mật khẩu vào thi">
          <input
            value={draft.password}
            onChange={(event) => update('password', event.target.value)}
            placeholder="Không bắt buộc"
            className="w-full bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-xl p-2.5"
          />
        </Field>

        <Field label="Hiển thị điểm">
          <AppSelect
            value={draft.resultReleaseMode}
            onChange={(value) => update('resultReleaseMode', value)}
            buttonClassName="bg-gray-50"
            menuClassName="z-50"
            options={[
              { value: 'IMMEDIATE', label: 'Hiện điểm ngay sau khi nộp' },
              { value: 'MANUAL', label: 'Ẩn điểm, giảng viên công bố sau' },
              { value: 'SCHEDULED', label: 'Tự động công bố theo thời gian' },
            ]}
          />
        </Field>

        {draft.resultReleaseMode === 'SCHEDULED' && (
          <Field label="Thời gian công bố điểm">
            <input
              type="datetime-local"
              value={draft.resultReleaseAt}
              onChange={(event) => update('resultReleaseAt', event.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-xl p-2.5"
            />
          </Field>
        )}
      </div>

      <SectionTitle icon={<Eye size={15} className="text-blue-600" />} title="Xem lại bài làm" />
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
        <Toggle
          checked={draft.allowStudentReview}
          onChange={(value) => update('allowStudentReview', value)}
          label="Cho phép sinh viên xem lại bài làm sau khi điểm được công bố"
        />
      </div>

      <SectionTitle icon={<ShieldCheck size={15} className="text-blue-600" />} title="Quy định thi" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2">
          <Toggle checked={draft.requireFullscreen} onChange={(value) => update('requireFullscreen', value)} label="Bắt buộc toàn màn hình" />
          <Toggle checked={draft.enableWebcam} onChange={(value) => update('enableWebcam', value)} label="Giám sát webcam" />
          <Toggle checked={draft.blockCopyPaste} onChange={(value) => update('blockCopyPaste', value)} label="Chặn copy/paste" />
          <Toggle checked={draft.blockRightClick} onChange={(value) => update('blockRightClick', value)} label="Chặn chuột phải" />
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-700">
            <Globe size={14} className="text-blue-600" />
            <span>Kiểm soát IP</span>
          </div>
          <AppSelect
            value={draft.ipMode}
            onChange={(value) => update('ipMode', value)}
            buttonClassName="bg-white"
            menuClassName="z-50"
            options={[
              { value: 'HOME', label: 'Thi tại nhà / Online' },
              { value: 'CAMPUS', label: 'Giới hạn IP trường' },
            ]}
          />
          {draft.ipMode === 'CAMPUS' && (
            <input
              value={draft.allowedIpRange}
              onChange={(event) => update('allowedIpRange', event.target.value)}
              placeholder="Ví dụ: 192.168.1.1 - 192.168.1.254"
              className="w-full bg-white border border-gray-200 text-xs text-gray-800 rounded-xl p-2.5"
            />
          )}
        </div>
      </div>

      <SectionTitle icon={<Shuffle size={15} className="text-blue-600" />} title="Phân phối đề khi sinh viên vào thi" />
      <div className={`grid grid-cols-1 gap-3 ${showSubmit ? 'md:grid-cols-[1fr_auto]' : ''}`}>
        <AppSelect
          value={draft.distributionMode}
          onChange={(value) => update('distributionMode', value)}
          buttonClassName="bg-gray-50"
          menuClassName="z-50"
          options={[
              { value: 'FIXED_ORDER', label: 'Giữ nguyên thứ tự câu hỏi' },
              { value: 'SHUFFLE_ORDER', label: 'Xáo thứ tự câu hỏi' },
              { value: 'SHUFFLE_QUESTIONS_AND_OPTIONS', label: 'Xáo câu hỏi và phương án' },
              { value: 'RANDOM_SUBSET', label: 'Chọn tập câu hỏi ngẫu nhiên theo phần' },
          ]}
        />
        {showSubmit && (
          <button
            type="button"
            onClick={onAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-1.5"
          >
            <Clock size={15} /> {submitLabel}
          </button>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  className = '',
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="text-xs text-gray-600">{label}</span>
      {children}
    </label>
  )
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-900">
      {icon}
      <span>{title}</span>
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="rounded text-blue-600 focus:ring-blue-500"
      />
      <span>{label}</span>
    </label>
  )
}
