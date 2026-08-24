import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Code,
  FileCheck,
  HelpCircle,
  X,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StudentSidebar from './components/StudentSidebar'
import StudentTopBar from './components/StudentTopBar'

interface ResultQuestionOption {
  id: string
  content: string
  isCorrect: boolean
  isStudentSelected: boolean
}

interface ResultTestCase {
  id: string
  input: string
  expectedOutput: string
  actualOutput: string
  status: 'PASSED' | 'FAILED'
  executionTimeMs: number
  memoryMb: number
}

interface ResultQuestionItem {
  id: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'CODING'
  content: string
  explanation?: string
  earnedPoints: number
  maxPoints: number
  isCorrect: boolean
  options?: ResultQuestionOption[]
  submittedCode?: string
  programmingLanguage?: string
  testCases?: ResultTestCase[]
}

export default function StudentExamResultPage() {
  const { courseOfferingId } = useParams<{
    courseOfferingId: string
  }>()
  const navigate = useNavigate()

  // Mock Result Data for Student
  const [resultData] = useState({
    examTitle: 'Bài Thi Giữa Kỳ Lập Trình Java Căn Bản',
    courseCode: 'JAVA101',
    subjectName: 'Lập trình Java căn bản',
    studentName: 'Nguyễn Văn A',
    studentCode: 'SV2026001',
    submittedAt: '18/08/2026 09:45:20',
    durationSpentMinutes: 48,
    maxDurationMinutes: 60,
    autoScore: 8.5,
    manualScoreOverride: 8.5,
    finalScore: 8.5,
    maxScore: 10.0,
    status: 'PASSED', // PASSED | FAILED
    resultPublished: true,
    questions: [
      {
        id: 'q-res-1',
        type: 'SINGLE_CHOICE',
        content: 'Từ khóa nào trong ngôn ngữ Java được sử dụng để định nghĩa một Giao diện (Interface)?',
        explanation: 'Từ khóa interface được dùng để khai báo Giao diện (Interface) trong Java.',
        earnedPoints: 2.5,
        maxPoints: 2.5,
        isCorrect: true,
        options: [
          { id: 'opt-1', content: 'class', isCorrect: false, isStudentSelected: false },
          { id: 'opt-2', content: 'interface', isCorrect: true, isStudentSelected: true },
          { id: 'opt-3', content: 'implements', isCorrect: false, isStudentSelected: false },
          { id: 'opt-4', content: 'extends', isCorrect: false, isStudentSelected: false },
        ],
      },
      {
        id: 'q-res-2',
        type: 'MULTIPLE_CHOICE',
        content: 'Những collection nào sau đây thuộc về Java Collections Framework trong thư viện java.util?',
        explanation: 'ArrayList, HashMap, và HashSet đều thuộc về Java Collections Framework.',
        earnedPoints: 2.5,
        maxPoints: 2.5,
        isCorrect: true,
        options: [
          { id: 'opt-1', content: 'ArrayList', isCorrect: true, isStudentSelected: true },
          { id: 'opt-2', content: 'HashMap', isCorrect: true, isStudentSelected: true },
          { id: 'opt-3', content: 'HashSet', isCorrect: true, isStudentSelected: true },
          { id: 'opt-4', content: 'PointerArray', isCorrect: false, isStudentSelected: false },
        ],
      },
      {
        id: 'q-res-3',
        type: 'CODING',
        content: 'Viết chương trình Console đọc vào một chuỗi String S và in ra chuỗi đảo ngược của S.',
        explanation: 'Sử dụng StringBuilder.reverse() hoặc duyệt mảng ký tự từ cuối về đầu.',
        earnedPoints: 3.5,
        maxPoints: 5.0,
        isCorrect: false,
        submittedCode: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLine()) {
            String s = sc.nextLine();
            StringBuilder sb = new StringBuilder(s);
            System.out.print(sb.reverse().toString());
        }
    }
}`,
        programmingLanguage: 'JAVA',
        testCases: [
          {
            id: 'tc-res-1',
            input: 'hello',
            expectedOutput: 'olleh',
            actualOutput: 'olleh',
            status: 'PASSED',
            executionTimeMs: 145,
            memoryMb: 18,
          },
          {
            id: 'tc-res-2',
            input: 'SOES 2026',
            expectedOutput: '6202 SEOS',
            actualOutput: '6202 SEOS',
            status: 'PASSED',
            executionTimeMs: 160,
            memoryMb: 19,
          },
          {
            id: 'tc-res-3',
            input: 'OpenAI Test Case',
            expectedOutput: 'esaC tseT IAnepO',
            actualOutput: 'esaC tseT IAnepO (Timeout)',
            status: 'FAILED',
            executionTimeMs: 2050,
            memoryMb: 256,
          },
        ],
      },
    ] as ResultQuestionItem[],
  })

  function handleBack() {
    if (courseOfferingId) {
      navigate(`/student/course-offerings/${courseOfferingId}`, {
        state: { activeTab: 'timeline' },
      })
    } else {
      navigate('/student')
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <StudentSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <StudentTopBar />

        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Quay lại chi tiết bài thi</span>
          </button>

          {/* Banner Header */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-md">
                  {resultData.courseCode}
                </span>
                <span className="text-xs text-gray-400">• {resultData.subjectName}</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight mt-1">
                Kết Quả {resultData.examTitle}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Sinh viên: <span className="font-semibold text-gray-800">{resultData.studentName} ({resultData.studentCode})</span> • Nộp bài lúc: {resultData.submittedAt}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full ${
                  resultData.status === 'PASSED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                {resultData.status === 'PASSED' ? 'KẾT QUẢ: ĐẠT' : 'KẾT QUẢ: KHÔNG ĐẠT'}
              </span>
            </div>
          </div>

          {/* SECTION 1: SCORE SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Score Card */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Điểm Tổng Kết</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900">{resultData.finalScore}</span>
                <span className="text-xs font-bold text-gray-400">/ {resultData.maxScore}đ</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 size={13} /> Đạt tiêu chuẩn hoàn thành
              </span>
            </div>

            {/* Multiple Choice Score */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Điểm Trắc Nghiệm</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">5.0</span>
                <span className="text-xs text-gray-400">/ 5.0đ</span>
              </div>
              <span className="text-[11px] text-gray-500">Đúng 2/2 câu trắc nghiệm</span>
            </div>

            {/* Coding Score */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Điểm Bài Tập Code</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">3.5</span>
                <span className="text-xs text-gray-400">/ 5.0đ</span>
              </div>
              <span className="text-[11px] text-gray-500">Vượt qua 2/3 Test cases</span>
            </div>

            {/* Duration Spent */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Thời Gian Làm Bài</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{resultData.durationSpentMinutes}</span>
                <span className="text-xs text-gray-400">/ {resultData.maxDurationMinutes} phút</span>
              </div>
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <Clock size={13} className="text-gray-400" /> Nộp bài trước 12 phút
              </span>
            </div>
          </div>

          {/* SECTION 2: DETAILED QUESTION REVIEW */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FileCheck size={16} className="text-blue-600" />
                Chi Tiết Đáp Án & Kết Quả Chấm Bài ({resultData.questions.length} câu)
              </h2>
            </div>

            <div className="space-y-4">
              {resultData.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className={`p-5 rounded-xl border space-y-4 transition-all ${
                    q.isCorrect ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">Câu #{idx + 1}</span>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-md">
                        {q.type === 'SINGLE_CHOICE'
                          ? 'Trắc nghiệm 1 đáp án'
                          : q.type === 'MULTIPLE_CHOICE'
                          ? 'Trắc nghiệm nhiều đáp án'
                          : 'Bài tập Lập trình Console'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-gray-900">{q.earnedPoints}</span>
                      <span className="text-gray-400">/ {q.maxPoints} điểm</span>
                      {q.isCorrect ? (
                        <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md flex items-center gap-1">
                          <Check size={12} /> Chính xác
                        </span>
                      ) : (
                        <span className="ml-2 px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md flex items-center gap-1">
                          <X size={12} /> Chưa tối đa điểm
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Content */}
                  <p className="text-xs text-gray-800 font-semibold leading-relaxed">{q.content}</p>

                  {/* MULTIPLE CHOICE REVIEW */}
                  {q.type !== 'CODING' && q.options && (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {q.options.map((opt, i) => {
                          const isCorrect = opt.isCorrect
                          const isSelected = opt.isStudentSelected

                          let borderStyle = 'bg-gray-50 border-gray-200 text-gray-700'
                          if (isCorrect && isSelected) {
                            borderStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                          } else if (isCorrect && !isSelected) {
                            borderStyle = 'bg-emerald-50/60 border-emerald-200 text-emerald-800 font-medium'
                          } else if (!isCorrect && isSelected) {
                            borderStyle = 'bg-rose-50 border-rose-300 text-rose-900 font-medium'
                          }

                          return (
                            <div
                              key={opt.id}
                              className={`p-3 rounded-xl border flex items-center justify-between ${borderStyle}`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{String.fromCharCode(65 + i)}. {opt.content}</span>
                                {isSelected && (
                                  <span className="px-2 py-0.5 text-[9px] font-bold bg-white/80 border rounded text-gray-700">
                                    Lựa chọn của bạn
                                  </span>
                                )}
                              </div>

                              {isCorrect && (
                                <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-0.5">
                                  <Check size={14} /> Đáp án đúng
                                </span>
                              )}
                              {!isCorrect && isSelected && (
                                <span className="text-rose-600 font-bold text-[11px] flex items-center gap-0.5">
                                  <X size={14} /> Chọn sai
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* CODING REVIEW */}
                  {q.type === 'CODING' && (
                    <div className="space-y-3 pt-2">
                      {/* Submitted Code Block */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                          <span className="flex items-center gap-1.5">
                            <Code size={14} className="text-purple-600" /> Mã nguồn đã nộp ({q.programmingLanguage})
                          </span>
                        </div>
                        <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                          <code>{q.submittedCode}</code>
                        </pre>
                      </div>

                      {/* Testcases Execution Results */}
                      {q.testCases && (
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-gray-900 block">
                            Kết Quả Chạy Bộ Kiểm Thử ({q.testCases.filter((t) => t.status === 'PASSED').length}/{q.testCases.length} Test cases Passed)
                          </span>

                          <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] border-b border-gray-100">
                                <tr>
                                  <th className="p-3">Test Case</th>
                                  <th className="p-3">Input (stdin)</th>
                                  <th className="p-3">Expected (stdout)</th>
                                  <th className="p-3">Actual Output</th>
                                  <th className="p-3">Thời gian / Bộ nhớ</th>
                                  <th className="p-3 text-right">Trạng thái</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {q.testCases.map((tc, index) => (
                                  <tr key={tc.id} className={tc.status === 'PASSED' ? 'hover:bg-gray-50' : 'bg-rose-50/30'}>
                                    <td className="p-3 font-bold text-gray-900">#{index + 1}</td>
                                    <td className="p-3 font-mono text-gray-700">{tc.input}</td>
                                    <td className="p-3 font-mono text-emerald-700">{tc.expectedOutput}</td>
                                    <td className="p-3 font-mono text-gray-900">{tc.actualOutput}</td>
                                    <td className="p-3 text-gray-500">{tc.executionTimeMs} ms • {tc.memoryMb} MB</td>
                                    <td className="p-3 text-right">
                                      {tc.status === 'PASSED' ? (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md inline-flex items-center gap-1">
                                          <CheckCircle2 size={12} /> PASSED
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md inline-flex items-center gap-1">
                                          <XCircle size={12} /> FAILED
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation Box */}
                  {q.explanation && (
                    <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs space-y-1">
                      <span className="font-bold text-blue-900 flex items-center gap-1.5">
                        <HelpCircle size={14} className="text-blue-600" />
                        Lời Giải & Hướng Dẫn Chi Tiết
                      </span>
                      <p className="text-blue-950 font-medium leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
