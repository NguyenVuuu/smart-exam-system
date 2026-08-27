import { AdminField, AdminInput } from '../AdminFormFields'
import AdminSelect from '../AdminSelect'
import ScheduleRulesPanel from './ScheduleRulesPanel'

interface SelectOption {
  value: string
  label: string
}

interface FinalExamScheduleFieldsProps {
  departmentId: string
  subjectCode: string
  examId: string
  examDate: string
  startTime: string
  endTime: string
  examMode: string
  ipRange: string
  password: string
  distributionMode: string
  releaseMode: string
  releaseAt: string
  allowStudentReview: boolean
  requireFullscreen: boolean
  enableWebcam: boolean
  blockCopyPaste: boolean
  blockRightClick: boolean
  departmentOptions: SelectOption[]
  subjectOptions: SelectOption[]
  examOptions: SelectOption[]
  examModeOptions: SelectOption[]
  distributionOptions: SelectOption[]
  releaseOptions: SelectOption[]
  onDepartmentChange: (value: string) => void
  onSubjectChange: (value: string) => void
  onExamChange: (value: string) => void
  onExamDateChange: (value: string) => void
  onStartTimeChange: (value: string) => void
  onEndTimeChange: (value: string) => void
  onExamModeChange: (value: string) => void
  onIpRangeChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onDistributionModeChange: (value: string) => void
  onReleaseModeChange: (value: string) => void
  onReleaseAtChange: (value: string) => void
  onAllowStudentReviewChange: (checked: boolean) => void
  onRequireFullscreenChange: (checked: boolean) => void
  onEnableWebcamChange: (checked: boolean) => void
  onBlockCopyPasteChange: (checked: boolean) => void
  onBlockRightClickChange: (checked: boolean) => void
}

export default function FinalExamScheduleFields({
  departmentId,
  subjectCode,
  examId,
  examDate,
  startTime,
  endTime,
  examMode,
  ipRange,
  password,
  distributionMode,
  releaseMode,
  releaseAt,
  allowStudentReview,
  requireFullscreen,
  enableWebcam,
  blockCopyPaste,
  blockRightClick,
  departmentOptions,
  subjectOptions,
  examOptions,
  examModeOptions,
  distributionOptions,
  releaseOptions,
  onDepartmentChange,
  onSubjectChange,
  onExamChange,
  onExamDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onExamModeChange,
  onIpRangeChange,
  onPasswordChange,
  onDistributionModeChange,
  onReleaseModeChange,
  onReleaseAtChange,
  onAllowStudentReviewChange,
  onRequireFullscreenChange,
  onEnableWebcamChange,
  onBlockCopyPasteChange,
  onBlockRightClickChange,
}: FinalExamScheduleFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <AdminField label="Bộ môn">
        <AdminSelect value={departmentId} onChange={onDepartmentChange} options={departmentOptions} />
      </AdminField>
      <AdminField label="Môn học">
        <AdminSelect
          value={subjectCode}
          disabled={!departmentId}
          onChange={onSubjectChange}
          options={subjectOptions}
        />
      </AdminField>
      <AdminField label="Đề cuối kỳ đã duyệt">
        <AdminSelect value={examId} disabled={!subjectCode} onChange={onExamChange} options={examOptions} />
      </AdminField>
      <AdminField label="Hình thức thi">
        <AdminSelect value={examMode} onChange={onExamModeChange} options={examModeOptions} />
      </AdminField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-2">
        <AdminField label="Ngày thi">
          <AdminInput type="date" value={examDate} onChange={(event) => onExamDateChange(event.target.value)} />
        </AdminField>
        <AdminField label="Giờ mở">
          <AdminInput type="time" value={startTime} onChange={(event) => onStartTimeChange(event.target.value)} />
        </AdminField>
        <AdminField label="Giờ kết thúc">
          <AdminInput type="time" value={endTime} onChange={(event) => onEndTimeChange(event.target.value)} />
        </AdminField>
      </div>

      {examMode === 'SCHOOL_IP' && (
        <AdminField label="Dải IP được phép">
          <AdminInput value={ipRange} onChange={(event) => onIpRangeChange(event.target.value)} placeholder="VD: 10.10.0.0/16" />
        </AdminField>
      )}
      <AdminField label="Mật khẩu vào thi (tùy chọn)">
        <AdminInput value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder="VD: JAVA0815" />
      </AdminField>
      <AdminField label="Cách phân phối đề">
        <AdminSelect value={distributionMode} onChange={onDistributionModeChange} options={distributionOptions} />
      </AdminField>
      <AdminField label="Công bố kết quả">
        <AdminSelect value={releaseMode} onChange={onReleaseModeChange} options={releaseOptions} />
      </AdminField>
      {releaseMode === 'SCHEDULED' && (
        <AdminField label="Thời gian công bố kết quả">
          <AdminInput type="datetime-local" value={releaseAt} onChange={(event) => onReleaseAtChange(event.target.value)} />
        </AdminField>
      )}

      <ScheduleRulesPanel
        allowStudentReview={allowStudentReview}
        requireFullscreen={requireFullscreen}
        enableWebcam={enableWebcam}
        blockCopyPaste={blockCopyPaste}
        blockRightClick={blockRightClick}
        onAllowStudentReviewChange={onAllowStudentReviewChange}
        onRequireFullscreenChange={onRequireFullscreenChange}
        onEnableWebcamChange={onEnableWebcamChange}
        onBlockCopyPasteChange={onBlockCopyPasteChange}
        onBlockRightClickChange={onBlockRightClickChange}
      />
    </div>
  )
}
