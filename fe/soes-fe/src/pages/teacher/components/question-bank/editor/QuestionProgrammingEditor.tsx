import { ChevronDown, ChevronUp, Code, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import AppSelect from '../../../../../components/common/AppSelect'
import type { TestCase } from '../../../types/teacher-question-bank.types'

export function QuestionProgrammingEditor({
  programmingLanguage,
  onLanguageChange,
  timeLimitMs,
  onTimeLimitChange,
  memoryLimitMb,
  onMemoryLimitChange,
  testCases,
  onTestCasesChange,
  expandedTcIds,
  onToggleExpandTc,
}: {
  programmingLanguage: 'JAVA' | 'C' | 'CPP'
  onLanguageChange: (lang: 'JAVA' | 'C' | 'CPP') => void
  timeLimitMs: number
  onTimeLimitChange: (ms: number) => void
  memoryLimitMb: number
  onMemoryLimitChange: (mb: number) => void
  testCases: TestCase[]
  onTestCasesChange: (cases: TestCase[]) => void
  expandedTcIds: string[]
  onToggleExpandTc: (id: string) => void
}) {
  const handleAddTestCase = () => {
    const newId = `tc-${Date.now()}`
    onTestCasesChange([
      ...testCases,
      { id: newId, input: '', expectedOutput: '', weight: 10, isHidden: false },
    ])
    onToggleExpandTc(newId)
  }

  const handleRemoveTestCase = (id: string) => {
    if (testCases.length <= 1) {
      alert('Bài lập trình cần ít nhất 1 test case.')
      return
    }
    onTestCasesChange(testCases.filter((tc) => tc.id !== id))
  }

  const handleUpdateTestCase = (id: string, updates: Partial<TestCase>) => {
    onTestCasesChange(testCases.map((tc) => (tc.id === id ? { ...tc, ...updates } : tc)))
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl space-y-4">
        <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5 uppercase tracking-wider">
          <Code size={16} className="text-purple-600" /> Cấu hình môi trường chấm bài
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Ngôn ngữ lập trình</label>
            <AppSelect
              value={programmingLanguage}
              onChange={onLanguageChange}
              options={[
                { value: 'JAVA', label: 'Java (OpenJDK 17)' },
                { value: 'CPP', label: 'C++ (GCC 11)' },
                { value: 'C', label: 'C (GCC 11)' },
              ]}
              buttonClassName="bg-white text-xs py-2 rounded-lg border border-purple-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Giới hạn thời gian (ms)</label>
            <input
              type="number"
              value={timeLimitMs}
              onChange={(e) => onTimeLimitChange(Number(e.target.value))}
              className="w-full bg-white border border-purple-200 text-xs rounded-lg p-2 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Giới hạn bộ nhớ (MB)</label>
            <input
              type="number"
              value={memoryLimitMb}
              onChange={(e) => onMemoryLimitChange(Number(e.target.value))}
              className="w-full bg-white border border-purple-200 text-xs rounded-lg p-2 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            Test cases kiểm thử tự động ({testCases.length})
          </label>
          <button
            type="button"
            onClick={handleAddTestCase}
            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-lg flex items-center gap-1 transition-colors border border-purple-200"
          >
            <Plus size={13} /> Thêm Test Case
          </button>
        </div>

        <div className="space-y-2.5">
          {testCases.map((tc, idx) => {
            const isExpanded = expandedTcIds.includes(tc.id)
            return (
              <div key={tc.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div
                  onClick={() => onToggleExpandTc(tc.id)}
                  className="p-3 bg-gray-50/80 hover:bg-gray-100/80 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-700">TC #{idx + 1}</span>
                    <span className="text-xs text-gray-500 font-medium">Trọng số: {tc.weight}%</span>
                    {tc.isHidden ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                        <EyeOff size={11} /> Ẩn khỏi SV
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Eye size={11} /> Công khai
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {testCases.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveTestCase(tc.id)
                        }}
                        className="p-1 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors mr-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-3.5 space-y-3 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase">
                          Dữ liệu đầu vào (STDIN)
                        </label>
                        <textarea
                          rows={3}
                          value={tc.input}
                          onChange={(e) => handleUpdateTestCase(tc.id, { input: e.target.value })}
                          placeholder="Ví dụ: 5\n1 2 3 4 5"
                          className="w-full font-mono bg-gray-50 border border-gray-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-purple-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase">
                          Kết quả kỳ vọng (STDOUT) *
                        </label>
                        <textarea
                          rows={3}
                          value={tc.expectedOutput}
                          onChange={(e) => handleUpdateTestCase(tc.id, { expectedOutput: e.target.value })}
                          placeholder="Ví dụ: 15"
                          className="w-full font-mono bg-gray-50 border border-gray-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-purple-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-gray-700">Trọng số (% điểm):</label>
                        <input
                          type="number"
                          value={tc.weight}
                          onChange={(e) => handleUpdateTestCase(tc.id, { weight: Number(e.target.value) })}
                          className="w-16 bg-gray-50 border border-gray-200 text-xs rounded-lg p-1.5 text-center focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-gray-700">
                        <input
                          type="checkbox"
                          checked={tc.isHidden}
                          onChange={(e) => handleUpdateTestCase(tc.id, { isHidden: e.target.checked })}
                          className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                        />
                        <span>Ẩn test case này (chống hardcode)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
