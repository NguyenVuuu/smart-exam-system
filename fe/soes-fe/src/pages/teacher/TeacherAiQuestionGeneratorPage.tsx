import {
  ArrowLeft,
  Check,
  CheckCircle2,
  FileText,
  HardDrive,
  Loader2,
  Save,
  Sparkles,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import AppSelect from '../../components/common/AppSelect'
import FileSelectionList from './components/FileSelectionList'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import { uploadAiSourceFiles } from './api/teacher-questions.api'
import { useTeacherQuestions } from './hooks/useTeacherQuestions'
import { MOCK_COURSE_MATERIALS, MOCK_TEACHER_COURSES } from './mock/teacher-course.mock'
import { MOCK_AI_DRAFT_QUESTIONS } from './mock/teacher-question-bank.mock'
import type { AIDraftQuestion, DifficultyLevel } from './types/teacher-question-bank.types'

type SourceMode = 'COURSE_MATERIAL' | 'UPLOAD_FILE'
type AiMode = 'GENERATE_FROM_MATERIAL' | 'EXTRACT_EXISTING_EXAM'
type DesiredDifficulty = DifficultyLevel | 'AUTO'

const sourceOptions: Array<{ value: SourceMode; title: string; description: string }> = [
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

const modeOptions: Array<{ value: AiMode; title: string; description: string }> = [
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

const difficultyOptions: Array<{ value: DesiredDifficulty; label: string }> = [
  { value: 'AUTO', label: 'Tự phân bổ độ khó' },
  { value: 'EASY', label: 'Dễ' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HARD', label: 'Khó' },
]

const difficultyLabel: Record<DifficultyLevel, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
}

const statusLabel: Record<AIDraftQuestion['status'], string> = {
  PENDING_REVIEW: 'Chờ duyệt',
  APPROVED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
}

const displayMaterialName = (material: (typeof MOCK_COURSE_MATERIALS)[number]) =>
  material.title?.trim() || material.fileName

export default function TeacherAiQuestionGeneratorPage() {
  const navigate = useNavigate()
  const { subjects } = useTeacherQuestions()
  const fallbackSubjectOptions = Array.from(
    new Map(
      MOCK_TEACHER_COURSES.map((course) => [
        course.subjectId,
        { value: course.subjectId, label: `${course.subjectCode} - ${course.subjectName}` },
      ]),
    ).values(),
  )
  const subjectOptions =
    subjects.length > 0
      ? subjects.map((subject) => ({ value: subject.id, label: subject.name }))
      : fallbackSubjectOptions
  const [sourceMode, setSourceMode] = useState<SourceMode>('COURSE_MATERIAL')
  const [aiMode, setAiMode] = useState<AiMode>('GENERATE_FROM_MATERIAL')
  const [subjectId, setSubjectId] = useState(subjectOptions[0]?.value ?? '')
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([
    'mat-01',
    'mat-02',
  ])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [questionCount, setQuestionCount] = useState(5)
  const [desiredDifficulty, setDesiredDifficulty] = useState<DesiredDifficulty>('AUTO')
  const [promptInput, setPromptInput] = useState(
    'Sinh câu hỏi Java OOP tập trung vào tính đóng gói, kế thừa và đa hình.',
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [draftQuestions, setDraftQuestions] = useState<AIDraftQuestion[]>([])
  const courseById = useMemo(
    () => new Map(MOCK_TEACHER_COURSES.map((course) => [course.id, course])),
    [],
  )
  const materialDuplicateCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const material of MOCK_COURSE_MATERIALS) {
      if (material.checksum) counts.set(material.checksum, (counts.get(material.checksum) ?? 0) + 1)
    }
    return counts
  }, [])
  const filteredMaterials = useMemo(
    () =>
      MOCK_COURSE_MATERIALS.filter((material) => {
        const course = courseById.get(material.courseOfferingId)
        return (material.subjectId ?? course?.subjectId) === subjectId
      }),
    [courseById, subjectId],
  )
  const selectedCourseMaterials = filteredMaterials.filter((material) => selectedMaterials.includes(material.id))

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  const toggleMaterial = (materialId: string, checked: boolean) => {
    setSelectedMaterials((prev) =>
      checked ? [...prev, materialId] : prev.filter((item) => item !== materialId),
    )
  }

  const handleGenerate = async () => {
    if (!subjectId) {
      toast.error('Vui lòng chọn môn học để AI gán câu hỏi đúng ngân hàng.')
      return
    }
    if (sourceMode === 'COURSE_MATERIAL' && selectedCourseMaterials.length === 0) {
      toast.error('Vui lòng chọn ít nhất một tài liệu lớp học.')
      return
    }
    if (sourceMode === 'UPLOAD_FILE' && uploadedFiles.length === 0) {
      toast.error('Vui lòng chọn ít nhất một file để AI xử lý.')
      return
    }

    setIsGenerating(true)
    try {
      const uploadedSources = sourceMode === 'UPLOAD_FILE'
        ? await uploadAiSourceFiles(subjectId, uploadedFiles)
        : []
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const generatedAt = Date.now()
      const sourceMaterialName =
        sourceMode === 'COURSE_MATERIAL'
          ? selectedCourseMaterials.map(displayMaterialName).join(', ')
          : uploadedSources.map((file) => file.fileName).join(', ')
      const generatedQuestions = MOCK_AI_DRAFT_QUESTIONS.map((question, index) => ({
        ...question,
        id: `${question.id}-${generatedAt}-${index}`,
        difficulty:
          aiMode === 'GENERATE_FROM_MATERIAL' && desiredDifficulty !== 'AUTO'
            ? desiredDifficulty
            : question.difficulty,
        status: 'PENDING_REVIEW' as const,
        sourceMaterialName,
      }))

      setDraftQuestions((prev) => [...prev, ...generatedQuestions])
      toast.success(draftQuestions.length > 0 ? 'Đã thêm câu hỏi mới vào danh sách nháp.' : 'AI đã tạo danh sách câu hỏi nháp.')
    } catch {
      toast.error('Không thể tải file nguồn AI lên Supabase. Vui lòng kiểm tra cấu hình và thử lại.')
    } finally {
      setIsGenerating(false)
    }
  }

  const updateDraftStatus = (id: string, status: AIDraftQuestion['status']) => {
    setDraftQuestions((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
  }

  const updateDraftField = <K extends keyof AIDraftQuestion>(
    id: string,
    field: K,
    value: AIDraftQuestion[K],
  ) => {
    setDraftQuestions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    )
  }

  const updateDraftOptionContent = (questionId: string, optionId: string, content: string) => {
    setDraftQuestions((prev) =>
      prev.map((item) =>
        item.id === questionId
          ? {
              ...item,
              options: item.options?.map((option) =>
                option.id === optionId ? { ...option, content } : option,
              ),
            }
          : item,
      ),
    )
  }

  const updateDraftOptionCorrect = (questionId: string, optionId: string, checked: boolean) => {
    setDraftQuestions((prev) =>
      prev.map((item) => {
        if (item.id !== questionId) return item

        return {
          ...item,
          options: item.options?.map((option) => {
            if (item.type === 'SINGLE_CHOICE' || item.type === 'TRUE_FALSE') {
              return { ...option, isCorrect: option.id === optionId }
            }
            return option.id === optionId ? { ...option, isCorrect: checked } : option
          }),
        }
      }),
    )
  }

  const handleApproveAllAvailable = () => {
    const approvableCount = draftQuestions.filter((item) => item.status !== 'REJECTED').length
    if (!approvableCount) {
      toast.error('Không còn câu nháp nào có thể chấp nhận.')
      return
    }

    setDraftQuestions((prev) =>
      prev.map((item) => (item.status === 'REJECTED' ? item : { ...item, status: 'APPROVED' })),
    )
    toast.success(`Đã chấp nhận ${approvableCount} câu nháp, bỏ qua các câu đã từ chối.`)
  }

  const handleSaveApproved = () => {
    const approvedCount = draftQuestions.filter((item) => item.status === 'APPROVED').length
    if (!approvedCount) {
      toast.error('Vui lòng duyệt ít nhất một câu hỏi trước khi lưu.')
      return
    }
    toast.success(`Đã lưu ${approvedCount} câu hỏi AI vào ngân hàng cá nhân.`)
    navigate('/teacher/question-bank')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-7 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/teacher/question-bank')}
            className="mb-5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Quay lại ngân hàng câu hỏi
          </button>

          <TeacherPageHeader
            title="Tạo câu hỏi bằng AI"
            description="Sinh câu hỏi từ tài liệu học tập hoặc bóc tách đề có sẵn thành câu hỏi nháp để giảng viên duyệt."
            icon={<Sparkles size={21} />}
            actions={
              <button
                type="button"
                onClick={handleSaveApproved}
                disabled={draftQuestions.length === 0}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
              >
                <Save size={15} />
                Lưu câu đã duyệt
              </button>
            }
          />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[480px_minmax(0,1fr)]">
            <section className="space-y-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div>
                <h2 className="text-sm font-bold text-gray-950">Cấu hình AI</h2>
                <p className="mt-1 text-xs text-gray-500">
                  AI tạo câu hỏi nháp, giảng viên duyệt rồi mới lưu.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-900">Môn học</label>
                <AppSelect
                  value={subjectId}
                  onChange={(value) => {
                    setSubjectId(value)
                    setSelectedMaterials([])
                  }}
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
                      onClick={() => setSourceMode(option.value)}
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
                      {filteredMaterials.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-xs text-gray-500">
                          Chưa có tài liệu nào thuộc môn đã chọn.
                        </div>
                      ) : filteredMaterials.map((material) => {
                        const checked = selectedMaterials.includes(material.id)
                        const course = courseById.get(material.courseOfferingId)
                        const duplicated = Boolean(
                          material.checksum && (materialDuplicateCounts.get(material.checksum) ?? 0) > 1,
                        )
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
                              onChange={(event) => toggleMaterial(material.id, event.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <FileText size={16} className="text-blue-600" />
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-semibold text-gray-900">
                                {displayMaterialName(material)}
                              </span>
                              <span className="block truncate text-xs text-gray-400">
                                {course?.courseCode ?? material.courseCode} - {material.fileSize} - {material.fileType}
                              </span>
                              {duplicated && (
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
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        const files = Array.from(event.target.files ?? [])
                        if (files.length) setUploadedFiles(files)
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
                    onRemove={removeUploadedFile}
                    onClear={() => setUploadedFiles([])}
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
                      onClick={() => setAiMode(option.value)}
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
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">Số câu muốn sinh</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={questionCount}
                        onChange={(event) => setQuestionCount(Number(event.target.value))}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">Độ khó</label>
                      <AppSelect
                        value={desiredDifficulty}
                        onChange={(value) => setDesiredDifficulty(value as DesiredDifficulty)}
                        buttonClassName="bg-gray-50"
                        options={difficultyOptions}
                      />
                    </div>
                  </div>
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
                  onChange={(event) => setPromptInput(event.target.value)}
                  placeholder="Ví dụ: tạo đáp án nhiễu hợp lý, tránh câu hỏi mẹo, ưu tiên kiến thức chương kế thừa..."
                  className="min-h-40 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {isGenerating ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
                {isGenerating ? 'AI đang xử lý...' : 'Sinh câu hỏi'}
              </button>
            </section>

            <section className="min-h-[620px] rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-950">Câu hỏi nháp</h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Duyệt từng câu trước khi lưu vào ngân hàng cá nhân.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {draftQuestions.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={handleApproveAllAvailable}
                        className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                      >
                        <CheckCircle2 size={14} />
                        Chấp nhận tất cả
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraftQuestions([])}
                        className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 size={14} />
                        Xóa nháp
                      </button>
                    </>
                  )}
                  <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    {draftQuestions.filter((item) => item.status === 'APPROVED').length} / {draftQuestions.length} đã duyệt
                  </span>
                </div>
              </div>

              {draftQuestions.length === 0 ? (
                <div className="flex min-h-[460px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 text-center">
                  <Sparkles size={28} className="text-blue-500" />
                  <p className="mt-3 text-sm font-bold text-gray-950">Chưa có câu hỏi nháp</p>
                  <p className="mt-1 max-w-sm text-xs text-gray-500">
                    Chọn nguồn dữ liệu và chế độ xử lý, sau đó bấm sinh câu hỏi.
                  </p>
                </div>
              ) : (
                <div className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">
                  {draftQuestions.map((question, index) => (
                    <article key={question.id} className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-blue-700">
                            Câu nháp #{index + 1} - {question.type === 'SINGLE_CHOICE' ? 'Một đáp án' : 'Nhiều đáp án'}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                              {difficultyLabel[question.difficulty]}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${
                            question.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : question.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {statusLabel[question.status]}
                        </span>
                      </div>

                      {question.type === 'PROGRAMMING' ? (
                        <>
                          <div className="mt-3">
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Tiêu đề bài</label>
                            <input
                              value={question.title}
                              onChange={(event) => updateDraftField(question.id, 'title', event.target.value)}
                              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="mt-3">
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Mô tả bài toán</label>
                            <textarea
                              rows={4}
                              value={question.content}
                              onChange={(event) => updateDraftField(question.id, 'content', event.target.value)}
                              className="w-full resize-y rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm leading-6 text-gray-800 outline-none focus:border-blue-500"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="mt-3">
                          <label className="mb-1 block text-xs font-semibold text-gray-600">Câu hỏi</label>
                          <textarea
                            rows={2}
                            value={question.content || question.title}
                            onChange={(event) => updateDraftField(question.id, 'content', event.target.value)}
                            className="w-full resize-y rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-semibold leading-6 text-gray-950 outline-none focus:border-blue-500"
                          />
                        </div>
                      )}

                      {question.options && (
                        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                          {question.options.map((option, optionIndex) => (
                            <label
                              key={option.id}
                              className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${
                                option.isCorrect
                                  ? 'border-emerald-200 bg-emerald-50 font-semibold text-emerald-800'
                                  : 'border-gray-200 bg-gray-50 text-gray-700'
                              }`}
                            >
                              <input
                                type={question.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                                name={`correct-${question.id}`}
                                checked={option.isCorrect}
                                onChange={(event) =>
                                  updateDraftOptionCorrect(question.id, option.id, event.target.checked)
                                }
                                className="shrink-0 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="shrink-0 font-bold">{String.fromCharCode(65 + optionIndex)}.</span>
                              <input
                                value={option.content}
                                onChange={(event) =>
                                  updateDraftOptionContent(question.id, option.id, event.target.value)
                                }
                                className="min-w-0 flex-1 bg-transparent outline-none"
                              />
                              {option.isCorrect && <Check size={14} className="shrink-0 text-emerald-600" />}
                            </label>
                          ))}
                        </div>
                      )}

                      <div className="mt-3">
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Giải thích</label>
                        <textarea
                          rows={2}
                          value={question.explanation ?? ''}
                          onChange={(event) => updateDraftField(question.id, 'explanation', event.target.value)}
                          className="w-full resize-y rounded-lg border border-blue-100 bg-blue-50 p-2 text-xs leading-5 text-blue-800 outline-none focus:border-blue-400"
                          placeholder="Nhập hoặc chỉnh giải thích đáp án..."
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
                        <span className="text-xs text-gray-400">Nguồn: {question.sourceMaterialName}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateDraftStatus(question.id, 'REJECTED')}
                            className="flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                          >
                            <XCircle size={14} />
                            Từ chối
                          </button>
                          <button
                            type="button"
                            onClick={() => updateDraftStatus(question.id, 'APPROVED')}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                          >
                            <CheckCircle2 size={14} />
                            Chấp nhận
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
