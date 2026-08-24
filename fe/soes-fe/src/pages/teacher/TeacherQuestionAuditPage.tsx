import {
  AlertCircle,
  CheckSquare,
  Edit,
  Filter,
  RefreshCw,
} from 'lucide-react'
import { useState } from 'react'
import AppBadge from '../../components/common/AppBadge'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import QuestionEditorModal from './components/question-bank/QuestionEditorModal'
import { MOCK_QUESTION_BANK } from './mock/teacher-question-bank.mock'
import type { Question } from './types/teacher-question-bank.types'

interface AuditIssue {
  id: string
  questionId: string
  subjectName: string
  content: string
  issueType: 'MISSING_CORRECT_ANSWER' | 'MISSING_EXPLANATION' | 'MISSING_TESTCASE' | 'DUPLICATE_OPTIONS'
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  description: string
}

const MOCK_AUDIT_ISSUES: AuditIssue[] = [
  {
    id: 'audit-1',
    questionId: 'q-101',
    subjectName: 'Lập trình Java căn bản',
    content: 'Đâu là kiểu dữ liệu nguyên thủy (primitive type) trong Java?',
    issueType: 'MISSING_CORRECT_ANSWER',
    severity: 'HIGH',
    description: 'Chưa đánh dấu đáp án đúng cho câu hỏi trắc nghiệm này.',
  },
  {
    id: 'audit-2',
    questionId: 'q-104',
    subjectName: 'Cấu trúc dữ liệu & Giải thuật',
    content: 'Viết hàm đảo ngược danh sách liên kết đơn (Singly Linked List) bằng Java.',
    issueType: 'MISSING_TESTCASE',
    severity: 'HIGH',
    description: 'Bài thi Lập trình chưa định nghĩa Test Cases (Input/Expected Output) cho Judge0.',
  },
  {
    id: 'audit-3',
    questionId: 'q-108',
    subjectName: 'Lập trình C++',
    content: 'Sự khác biệt giữa con trỏ (pointer) và tham chiếu (reference) trong C++ là gì?',
    issueType: 'MISSING_EXPLANATION',
    severity: 'LOW',
    description: 'Thiếu phần Lời giải / Giải thích chi tiết cho sinh viên sau khi nộp bài.',
  },
  {
    id: 'audit-4',
    questionId: 'q-112',
    subjectName: 'Cơ sở dữ liệu',
    content: 'Câu lệnh SQL nào dùng để loại bỏ các hàng trùng lặp trong kết quả truy vấn SELECT?',
    issueType: 'DUPLICATE_OPTIONS',
    severity: 'MEDIUM',
    description: 'Phát hiện Option A và Option C có nội dung trùng lặp hoàn toàn.',
  },
]

const severityTone = {
  HIGH: 'rose',
  MEDIUM: 'amber',
  LOW: 'blue',
} as const

export default function TeacherQuestionAuditPage() {
  const [issues] = useState<AuditIssue[]>(MOCK_AUDIT_ISSUES)
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL')
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [resolvedIds, setResolvedIds] = useState<string[]>([])
  const [editingIssue, setEditingIssue] = useState<AuditIssue | null>(null)

  const handleRunAuditScan = () => {
    setIsScanning(true)
    setTimeout(() => {
      setIsScanning(false)
    }, 1000)
  }

  const handleQuickFix = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setResolvedIds((prev) => [...prev, id])
  }

  const getEditableQuestion = (issue: AuditIssue): Question => {
    const existingQuestion = MOCK_QUESTION_BANK.find(
      (question) => question.id === issue.questionId || question.content === issue.content,
    )

    if (existingQuestion) return existingQuestion

    const subjectIdMap: Record<string, string> = {
      'Lập trình Java căn bản': 'sub-01',
      'Cấu trúc dữ liệu & Giải thuật': 'sub-02',
      'Lập trình C++': 'sub-03',
      'Cơ sở dữ liệu': 'sub-04',
    }

    return {
      id: issue.questionId,
      subjectId: subjectIdMap[issue.subjectName] || 'sub-01',
      subjectName: issue.subjectName,
      teacherId: 'gv-01',
      teacherName: 'TS. Nguyễn Văn Giảng',
      bankScope: 'PERSONAL',
      reviewStatus: 'PRIVATE',
      type: issue.issueType === 'MISSING_TESTCASE' ? 'PROGRAMMING' : 'SINGLE_CHOICE',
      difficulty: issue.severity === 'HIGH' ? 'HARD' : issue.severity === 'MEDIUM' ? 'MEDIUM' : 'EASY',
      content: issue.content,
      explanation: issue.issueType === 'MISSING_EXPLANATION' ? '' : 'Cần cập nhật lại theo kết quả rà soát.',
      options:
        issue.issueType === 'MISSING_TESTCASE'
          ? undefined
          : [
              { id: 'opt-1', content: 'Phương án A', isCorrect: false },
              { id: 'opt-2', content: 'Phương án B', isCorrect: false },
              { id: 'opt-3', content: 'Phương án C', isCorrect: false },
              { id: 'opt-4', content: 'Phương án D', isCorrect: false },
            ],
      programmingLanguage: issue.issueType === 'MISSING_TESTCASE' ? 'JAVA' : undefined,
      timeLimitMs: issue.issueType === 'MISSING_TESTCASE' ? 2000 : undefined,
      memoryLimitMb: issue.issueType === 'MISSING_TESTCASE' ? 256 : undefined,
      testCases: issue.issueType === 'MISSING_TESTCASE' ? [] : undefined,
      createdAt: '2026-08-22 09:00',
    }
  }

  const handleSaveAuditedQuestion = () => {
    if (!editingIssue) return
    setResolvedIds((prev) => (prev.includes(editingIssue.id) ? prev : [...prev, editingIssue.id]))
    setEditingIssue(null)
  }

  const activeIssues = issues.filter(
    (i) =>
      !resolvedIds.includes(i.id) &&
      (selectedSeverity === 'ALL' || i.severity === selectedSeverity),
  )

  const highSeverityCount = issues.filter((i) => i.severity === 'HIGH' && !resolvedIds.includes(i.id)).length
  const healthScore = Math.max(0, 100 - activeIssues.length * 15)

  // Columns Definition
  const columns: ColumnDef<AuditIssue>[] = [
    {
      header: 'STT',
      width: '50px',
      align: 'center',
      render: (_, idx) => <span className="text-gray-400">{idx + 1}</span>,
    },
    {
      header: 'Nội dung câu hỏi vi phạm',
      render: (i) => (
        <div className="space-y-1 py-1">
          <p className="font-medium text-gray-900 text-xs">{i.content}</p>
          <p className="text-[11px] text-rose-700 font-medium flex items-center gap-1.5 bg-rose-50/70 p-1.5 rounded-lg border border-rose-100">
            <AlertCircle size={13} className="text-rose-500 shrink-0" />
            {i.description}
          </p>
        </div>
      ),
    },
    {
      header: 'Môn học',
      width: '200px',
      render: (i) => (
        <AppBadge tone="blue" shape="rounded" className="text-[11px] font-medium">
          {i.subjectName}
        </AppBadge>
      ),
    },
    {
      header: 'Mức độ lỗi',
      width: '130px',
      align: 'center',
      render: (i) => (
        <AppBadge tone={severityTone[i.severity]} className="text-[11px] font-medium uppercase">
          {i.severity} SEVERITY
        </AppBadge>
      ),
    },
    {
      header: 'Thao tác',
      width: '170px',
      align: 'right',
      render: (i) => (
        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
          <button
            onClick={(ev) => handleQuickFix(i.id, ev)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 shrink-0"
          >
            <CheckSquare size={14} /> Đã xử lý
          </button>
          <button
            onClick={(ev) => {
              ev.stopPropagation()
              setEditingIssue(i)
            }}
            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors shrink-0"
            title="Chỉnh sửa chi tiết"
          >
            <Edit size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <TeacherSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TeacherTopBar />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          <TeacherPageHeader
            title="Rà Soát & Kiểm Tra Đáp Án"
            description="Rà soát và tự động phát hiện các câu hỏi vi phạm tiêu chuẩn kỹ thuật"
            actions={
              <button
                onClick={handleRunAuditScan}
                disabled={isScanning}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <RefreshCw size={15} className={isScanning ? 'animate-spin' : ''} />
                {isScanning ? 'Đang Rà Soát...' : 'Rà Soát Ngay'}
              </button>
            }
          />

          {/* Stat Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-medium text-gray-500">Chỉ Số Sức Khỏe Kho</span>
              <p className="text-2xl font-bold text-gray-900">{healthScore}%</p>
              <p className="text-[11px] text-emerald-600 font-medium">Đạt tiêu chuẩn kỹ thuật</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-medium text-gray-500">Lỗi Cao (High)</span>
              <p className="text-2xl font-bold text-rose-600">{highSeverityCount}</p>
              <p className="text-[11px] text-gray-400">Cần sửa trước khi thi</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-medium text-gray-500">Lỗi Trung Bình</span>
              <p className="text-2xl font-bold text-amber-600">
                {issues.filter((i) => i.severity === 'MEDIUM' && !resolvedIds.includes(i.id)).length}
              </p>
              <p className="text-[11px] text-gray-400">Trùng đáp án/Lựa chọn</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-medium text-gray-500">Đã Sửa Phiên Này</span>
              <p className="text-2xl font-bold text-emerald-600">{resolvedIds.length}</p>
              <p className="text-[11px] text-gray-400">Đã cập nhật hệ thống</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Filter size={15} className="text-gray-400" />
              <span className="text-xs font-medium text-gray-700">Mức độ lỗi:</span>
              <div className="flex gap-2">
                {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSelectedSeverity(sev)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      selectedSeverity === sev
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    {sev === 'ALL'
                      ? 'Tất cả'
                      : sev === 'HIGH'
                      ? 'Cao (High)'
                      : sev === 'MEDIUM'
                      ? 'Trung bình'
                      : 'Thấp'}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-gray-400">
              Hiển thị {activeIssues.length} vi phạm
            </span>
          </div>

          {/* Reusable DataTable Component */}
          <DataTable
            columns={columns}
            data={activeIssues}
            keyExtractor={(i) => i.id}
            emptyText="Ngân hàng câu hỏi hiện tại đạt tiêu chuẩn chất lượng. Không có lỗi vi phạm!"
            pageSize={10}
          />
        </main>
      </div>

      {editingIssue && (
        <QuestionEditorModal
          key={editingIssue.id}
          isOpen
          onClose={() => setEditingIssue(null)}
          onSave={handleSaveAuditedQuestion}
          initialQuestion={getEditableQuestion(editingIssue)}
        />
      )}
    </div>
  )
}
