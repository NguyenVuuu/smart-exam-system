import React from 'react'
import { HardDrive, Loader2, Sparkles, Upload, FileText } from 'lucide-react'
import AppSelect from '../../../../components/common/AppSelect'
import FileSelectionList from '../FileSelectionList'
import type { AiMaterialDto } from '../../types/teacher-question-api.types'
import type { DifficultyLevel } from '../../types/teacher-question-bank.types'

export type SourceMode = 'COURSE_MATERIAL' | 'UPLOAD_FILE'
export type AiMode = 'GENERATE_FROM_MATERIAL' | 'EXTRACT_EXISTING_EXAM'
export type DesiredDifficulty = DifficultyLevel | 'AUTO'
export type TargetQuestionType = 'ALL' | 'MULTIPLE_CHOICE' | 'PROGRAMMING'

export const questionTypeFilterOptions: Array<{ value: TargetQuestionType; label: string }> = [
  { value: 'ALL', label: 'Tất cả (Tự động)' },
  { value: 'MULTIPLE_CHOICE', label: 'Chỉ Trắc nghiệm' },
  { value: 'PROGRAMMING', label: 'Chỉ Lập trình' },
]

export const sourceOptions: Array<{ value: SourceMode; title: string; description: string }> = [
  {
    value: 'COURSE_MATERIAL',
    title: 'Tài liệu lớp học',
    description: 'File đã upload trong lớp.',
  },
  {
    value: 'UPLOAD_FILE',
    title: 'Tải file mới',
    description: 'File riêng cho lần sinh này.',
  },
]

export const modeOptions: Array<{ value: AiMode; title: string; description: string }> = [
  {
    value: 'GENERATE_FROM_MATERIAL',
    title: 'Sinh câu hỏi từ tài liệu',
    description: 'Tạo câu hỏi mới từ nội dung file.',
  },
  {
    value: 'EXTRACT_EXISTING_EXAM',
    title: 'Bóc tách đề có sẵn',
    description: 'Tách câu hỏi và đáp án từ đề.',
  },
]

export const difficultyOptions: Array<{ value: DesiredDifficulty; label: string }> = [
  { value: 'AUTO', label: 'Tự phân bổ độ khó' },
  { value: 'EASY', label: 'Dễ' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HARD', label: 'Khó' },
]

const formatFileSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`

interface AiGeneratorConfigPanelProps {
  configSectionRef: React.RefObject<HTMLElement | null>
  selectedSubjectId: string
  subjectOptions: Array<{ value: string; label: string }>
  onSubjectChange: (value: string) => void
  sourceMode: SourceMode
  onSourceModeChange: (mode: SourceMode) => void
  materials: AiMaterialDto[]
  materialsLoading: boolean
  selectedMaterials: string[]
  onToggleMaterial: (materialId: string, checked: boolean) => void
  uploadedFiles: File[]
  onAddFiles: (files: File[]) => void
  onRemoveUploadedFile: (index: number) => void
  onClearUploadedFiles: () => void
  aiMode: AiMode
  onAiModeChange: (mode: AiMode) => void
  targetQuestionType: TargetQuestionType
  onTargetQuestionTypeChange: (type: TargetQuestionType) => void
  desiredDifficulty: DesiredDifficulty
  onDesiredDifficultyChange: (difficulty: DesiredDifficulty) => void
  questionCount: number
  onQuestionCountChange: (count: number) => void
  promptInput: string
  onPromptInputChange: (prompt: string) => void
  isGenerating: boolean
  onGenerate: () => void
}

export const AiGeneratorConfigPanel: React.FC<AiGeneratorConfigPanelProps> = ({
  configSectionRef,
  selectedSubjectId,
  subjectOptions,
  onSubjectChange,
  sourceMode,
  onSourceModeChange,
  materials,
  materialsLoading,
  selectedMaterials,
  onToggleMaterial,
  uploadedFiles,
  onAddFiles,
  onRemoveUploadedFile,
  onClearUploadedFiles,
  aiMode,
  onAiModeChange,
  targetQuestionType,
  onTargetQuestionTypeChange,
  desiredDifficulty,
  onDesiredDifficultyChange,
  questionCount,
  onQuestionCountChange,
  promptInput,
  onPromptInputChange,
  isGenerating,
  onGenerate,
}) => {
  return (
    <section ref={configSectionRef} className="space-y-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-sm font-bold text-gray-950">Cấu hình AI</h2>
        <p className="mt-1 text-xs text-gray-500">
          AI tạo câu hỏi nháp, giảng viên duyệt rồi mới lưu.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold text-gray-900">Môn học</label>
        <AppSelect
          value={selectedSubjectId}
          onChange={onSubjectChange}
          buttonClassName="bg-white"
          options={subjectOptions}
        />
        <p className="mt-2 text-xs text-gray-500">
          File tải mới hoặc tài liệu lớp học đều sẽ sinh câu hỏi cho môn này.
        </p>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-900">Nguồn dữ liệu</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {sourceOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSourceModeChange(option.value)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                sourceMode === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <p className="text-xs font-bold text-gray-950">{option.title}</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {sourceMode === 'COURSE_MATERIAL' ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-900">Tài liệu lớp học</label>
            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {materialsLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 p-5 text-xs text-gray-500">
                  <Loader2 size={15} className="animate-spin" />
                  Đang tải tài liệu...
                </div>
              ) : materials.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-xs text-gray-500">
                  Chưa có tài liệu nào thuộc môn đã chọn.
                </div>
              ) : materials.map((material) => {
                const checked = selectedMaterials.includes(material.id)
                return (
                  <label
                    key={material.id}
                    className={`relative flex min-h-[64px] cursor-pointer items-center gap-3 rounded-xl border p-3 pr-24 transition-colors ${
                      checked ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => onToggleMaterial(material.id, event.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <FileText size={16} className="text-blue-600" />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-gray-900">
                        {material.fileName}
                      </span>
                      <span className="block truncate text-xs text-gray-400">
                        {material.courseCode} - {formatFileSize(material.fileSize)} - {material.contentType}
                      </span>
                      {material.duplicated && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-amber-700">
                          Trùng nội dung
                        </span>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>
            <p className="text-xs text-gray-500">
              File trùng được nhận biết bằng checksum.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block cursor-pointer rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-6 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/60">
            <input
              type="file"
              accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
              multiple
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? [])
                if (files.length) onAddFiles(files)
                event.currentTarget.value = ''
              }}
            />
            <Upload size={22} className="mx-auto text-blue-600" />
            <p className="mt-2 text-xs font-bold text-gray-900">Chọn một hoặc nhiều file PDF, DOCX, TXT, PNG, JPG</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-400">
              <HardDrive size={13} />
              File sẽ lưu Supabase, checksum tính ở backend khi upload.
            </p>
          </label>
          <FileSelectionList
            files={uploadedFiles}
            onRemove={onRemoveUploadedFile}
            onClear={onClearUploadedFiles}
          />
        </div>
      )}

      <div>
        <label className="text-xs font-bold text-gray-900">Chế độ xử lý</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {modeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onAiModeChange(option.value)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                aiMode === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <p className="text-xs font-bold text-gray-950">{option.title}</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {aiMode === 'GENERATE_FROM_MATERIAL' ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Dạng câu hỏi</label>
                <AppSelect
                  value={targetQuestionType}
                  onChange={(value) => onTargetQuestionTypeChange(value as TargetQuestionType)}
                  buttonClassName="bg-white shadow-2xs"
                  options={questionTypeFilterOptions}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Độ khó</label>
                <AppSelect
                  value={desiredDifficulty}
                  onChange={(value) => onDesiredDifficultyChange(value as DesiredDifficulty)}
                  buttonClassName="bg-white shadow-2xs"
                  options={difficultyOptions}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Số câu muốn sinh</label>
              <input
                type="number"
                min={1}
                max={50}
                value={questionCount}
                onChange={(event) => onQuestionCountChange(Number(event.target.value))}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">Cách lấy số câu</label>
            <input
              disabled
              value="Tự nhận diện theo đề"
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-100 px-3 text-sm font-semibold text-gray-600"
            />
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-700">Yêu cầu thêm cho AI</label>
        <textarea
          rows={7}
          value={promptInput}
          onChange={(event) => onPromptInputChange(event.target.value)}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          placeholder="Ví dụ: tạo đáp án nhiễu hợp lý, tránh câu hỏi mẹo, ưu tiên kiến thức chương kế thừa..."
          className="min-h-40 w-full resize-y rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-blue-500 shadow-2xs"
        />
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700 disabled:opacity-60"
      >
        {isGenerating ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
        {isGenerating ? 'AI đang xử lý...' : 'Sinh câu hỏi'}
      </button>
    </section>
  )
}
