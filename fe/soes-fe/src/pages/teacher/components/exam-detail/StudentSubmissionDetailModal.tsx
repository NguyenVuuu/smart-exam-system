import {
  Check,
  CheckCircle2,
  Code,
  Edit3,
  FileCheck,
  HelpCircle,
  Terminal,
  User,
  X,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import type { Exam, ExamSubmission } from '../../types/teacher-exam.types'

interface StudentSubmissionDetailModalProps {
  submission: ExamSubmission | null
  exam: Exam | null
  isOpen: boolean
  onClose: () => void
  onOpenScoreOverride: (submission: ExamSubmission) => void
}

export default function StudentSubmissionDetailModal({
  submission,
  exam,
  isOpen,
  onClose,
  onOpenScoreOverride,
}: StudentSubmissionDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'objective' | 'coding'>('objective')

  if (!isOpen || !submission) return null

  // Mock answers detail
  const mockObjectiveAnswers = [
    {
      qIndex: 1,
      content: 'Trong Java, phương thức nào được gọi tự động khi một đối tượng được khởi tạo?',
      studentChoice: 'Constructor (Phương thức khởi tạo)',
      correctAnswer: 'Constructor (Phương thức khởi tạo)',
      isCorrect: true,
      points: 2.5,
      maxPoints: 2.5,
      explanation: 'Constructor là hàm tạo có cùng tên với lớp và được gọi khi dùng từ khóa new.',
    },
    {
      qIndex: 2,
      content: 'Từ khóa nào dùng để kế thừa một lớp trong Java?',
      studentChoice: 'implements',
      correctAnswer: 'extends',
      isCorrect: false,
      points: 0.0,
      maxPoints: 2.5,
      explanation: 'extends dùng để kế thừa lớp (class), implements dùng để cài đặt interface.',
    },
  ]

  const mockCodingSubmission = {
    language: 'JAVA',
    submittedCode: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            System.out.println(n * 2);
        }
    }
}`,
    compilerOutput: 'Compiled successfully (javac 17.0.2)',
    executionTimeMs: 120,
    memoryUsedKb: 24500,
    testCases: [
      {
        id: 'tc-1',
        name: 'Test Case 1 (Công khai)',
        input: '10',
        expectedOutput: '20',
        actualOutput: '20',
        passed: true,
        weight: 2.5,
      },
      {
        id: 'tc-2',
        name: 'Test Case 2 (Ẩn)',
        input: '-5',
        expectedOutput: '-10',
        actualOutput: '-10',
        passed: true,
        weight: 2.5,
      },
    ],
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-hidden font-sans animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-5xl w-full h-[88vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-gray-900">
                  Chi Tiết Bài Làm & Chấm Điểm Thí Sinh
                </h3>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 flex items-center gap-1">
                  <User size={12} /> {submission.studentName} ({submission.studentCode})
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Đề thi: <strong className="text-gray-800">{exam?.title || 'Kiểm tra lập trình'}</strong> • Nộp lúc: {submission.submittedAt}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Score Ribbon KPI */}
        <div className="px-6 py-3 bg-gradient-to-r from-gray-50 via-blue-50/40 to-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-8 text-xs">
            <div>
              <span className="text-gray-500 block font-medium">Chấm tự động:</span>
              <span className="text-lg font-bold text-gray-900">{submission.autoScore} / 10.0đ</span>
            </div>
            <div className="border-l border-gray-200 pl-8">
              <span className="text-gray-500 block font-medium">Điểm phúc khảo (Ghi đè):</span>
              <span className="text-lg font-bold text-blue-600">
                {submission.manualScoreOverride !== undefined ? `${submission.manualScoreOverride}đ` : 'Chưa ghi đè'}
              </span>
            </div>
            <div className="border-l border-gray-200 pl-8">
              <span className="text-gray-500 block font-medium">Điểm chốt cuối cùng:</span>
              <span className="text-lg font-black text-emerald-600">{submission.finalScore}đ</span>
            </div>
          </div>

          <button
            onClick={() => {
              onClose()
              onOpenScoreOverride(submission)
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Edit3 size={14} /> Chấm Lại / Ghi Đè Điểm
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-6 flex items-center gap-4 border-b border-gray-100 shrink-0 bg-white">
          <button
            onClick={() => setActiveTab('objective')}
            className={`flex items-center gap-2 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'objective'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <CheckCircle2 size={15} />
            <span>Phần Trắc Nghiệm ({mockObjectiveAnswers.length} câu)</span>
          </button>
          <button
            onClick={() => setActiveTab('coding')}
            className={`flex items-center gap-2 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'coding'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Code size={15} />
            <span>Phần Lập Trình (Console & Bộ Kiểm Thử)</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
          {activeTab === 'objective' && (
            <div className="space-y-4">
              {mockObjectiveAnswers.map((ans) => (
                <div
                  key={ans.qIndex}
                  className={`p-5 rounded-2xl border bg-white shadow-2xs transition-all ${
                    ans.isCorrect ? 'border-emerald-200' : 'border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Câu {ans.qIndex} ({ans.points} / {ans.maxPoints} điểm)
                      </span>
                      <p className="text-sm font-bold text-gray-900 leading-relaxed">{ans.content}</p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                        ans.isCorrect
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {ans.isCorrect ? <Check size={13} /> : <X size={13} />}
                      {ans.isCorrect ? 'Trả lời đúng' : 'Trả lời sai'}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-[11px] text-gray-500 block font-medium">Đáp án sinh viên chọn:</span>
                      <span className={`text-xs font-bold mt-0.5 block ${ans.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {ans.studentChoice}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100">
                      <span className="text-[11px] text-emerald-800 block font-medium">Đáp án chính xác của hệ thống:</span>
                      <span className="text-xs font-bold text-emerald-800 mt-0.5 block">{ans.correctAnswer}</span>
                    </div>
                  </div>

                  {ans.explanation && (
                    <div className="mt-3 p-3 bg-blue-50/60 rounded-xl text-xs text-blue-900 flex items-start gap-2 border border-blue-100">
                      <HelpCircle size={15} className="text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>Giải thích chi tiết:</strong> {ans.explanation}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'coding' && (
            <div className="space-y-4">
              {/* Code Viewer */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-gray-100">
                  <span className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Terminal size={15} className="text-blue-600" />
                    Mã Nguồn Sinh Viên Nộp ({mockCodingSubmission.language})
                  </span>
                  <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    {mockCodingSubmission.compilerOutput}
                  </span>
                </div>
                <pre className="p-4 bg-gray-900 text-gray-100 rounded-xl text-xs font-mono overflow-x-auto border border-gray-800 leading-relaxed">
                  <code>{mockCodingSubmission.submittedCode}</code>
                </pre>
              </div>

              {/* Test Cases Results */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  Chi Tiết Kết Quả Bộ Kiểm Thử (Judge0 Test Cases)
                </h4>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  {mockCodingSubmission.testCases.map((tc) => (
                    <div key={tc.id} className="p-4 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{tc.name}</span>
                          <span className="text-[11px] text-gray-400">({tc.weight} điểm)</span>
                        </div>
                        <div className="text-xs font-mono grid grid-cols-1 sm:grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                          <div><span className="text-gray-400 text-[10px] block">Input:</span> <strong className="text-gray-800">{tc.input}</strong></div>
                          <div><span className="text-gray-400 text-[10px] block">Expected:</span> <strong className="text-emerald-700">{tc.expectedOutput}</strong></div>
                          <div><span className="text-gray-400 text-[10px] block">Actual:</span> <strong className="text-gray-800">{tc.actualOutput}</strong></div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                          tc.passed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {tc.passed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {tc.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-gray-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-500">
            Xem lại bài làm thí sinh theo quy chế phúc khảo
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  )
}
