import { Minus, Plus } from 'lucide-react'
import type { AutoExamConfigPanelProps } from '../../../types/auto-exam-config.types'

export default function AutoExamDifficultyCountConfig(props: AutoExamConfigPanelProps) {
  const easyAvailable = props.eligibleQuestions.filter((q) => q.difficulty === 'EASY').length
  const mediumAvailable = props.eligibleQuestions.filter((q) => q.difficulty === 'MEDIUM').length
  const hardAvailable = props.eligibleQuestions.filter((q) => q.difficulty === 'HARD').length

  const totalSelected = props.easyCount + props.mediumCount + props.hardCount

  return (
    <div className="space-y-3">
      {/* Outer Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
          Số Lượng Câu Hỏi Theo Độ Khó
        </h3>
        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
          Tổng cộng: {totalSelected} câu
        </span>
      </div>

      {props.fieldErrors?.matrix && (
        <p className="text-xs text-rose-600 font-medium">{props.fieldErrors.matrix}</p>
      )}

      {/* Rows Container */}
      <div className="space-y-3">
        <DifficultyRow
          title="1. Mức Độ Dễ"
          tag="Easy"
          badgeClass="bg-emerald-50 text-emerald-700 border-emerald-200"
          value={props.easyCount}
          max={easyAvailable || 40}
          onChange={(val) => {
            props.onFieldChange?.('matrix')
            props.setEasyCount(val)
          }}
        />

        <DifficultyRow
          title="2. Mức Độ Trung Bình"
          tag="Medium"
          badgeClass="bg-amber-50 text-amber-700 border-amber-200"
          value={props.mediumCount}
          max={mediumAvailable || 40}
          onChange={(val) => {
            props.onFieldChange?.('matrix')
            props.setMediumCount(val)
          }}
        />

        <DifficultyRow
          title="3. Mức Độ Khó"
          tag="Hard"
          badgeClass="bg-rose-50 text-rose-700 border-rose-200"
          value={props.hardCount}
          max={hardAvailable || 20}
          onChange={(val) => {
            props.onFieldChange?.('matrix')
            props.setHardCount(val)
          }}
        />
      </div>
    </div>
  )
}

function DifficultyRow({
  title,
  tag,
  badgeClass,
  value,
  max,
  onChange,
}: {
  title: string
  tag: string
  badgeClass: string
  value: number
  max: number
  onChange: (value: number) => void
}) {
  const actualMax = Math.max(max, 0)
  const percent = actualMax > 0 ? Math.min((value / actualMax) * 100, 100) : 0

  const handleDecrement = () => {
    if (value > 0) onChange(value - 1)
  }

  const handleIncrement = () => {
    if (value < actualMax) onChange(value + 1)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value
    if (rawVal === '') {
      onChange(0)
      return
    }
    const parsed = parseInt(rawVal, 10)
    if (!isNaN(parsed)) {
      onChange(Math.max(0, Math.min(parsed, actualMax)))
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50/70 border border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Title & Colored Badge */}
      <div className="flex items-center gap-2.5 shrink-0 sm:min-w-[240px]">
        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{title}</span>
        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${badgeClass}`}>
          {tag}
        </span>
      </div>

      {/* Blue Slider Track */}
      <div className="flex-1 px-2">
        <input
          type="range"
          min={0}
          max={actualMax || 1}
          disabled={actualMax === 0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            background: `linear-gradient(to right, #2563eb ${percent}%, #e2e8f0 ${percent}%)`,
          }}
          className="h-2 w-full cursor-pointer appearance-none rounded-full outline-none disabled:opacity-40 [&::-moz-range-thumb]:h-4.5 [&::-moz-range-thumb]:w-4.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:shadow-xs [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-xs"
        />
      </div>

      {/* Stepper Controls with Editable Input */}
      <div className="flex items-center justify-end gap-2 shrink-0">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= 0}
          className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs"
          title="Giảm 1 câu"
        >
          <Minus size={14} />
        </button>

        {/* Editable Input Box */}
        <div className="flex items-center rounded-xl bg-white border border-gray-200 px-2.5 py-1 shadow-2xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <input
            type="number"
            min={0}
            max={actualMax}
            value={value === 0 ? '0' : value}
            onChange={handleInputChange}
            className="w-10 text-center font-bold text-sm text-gray-900 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xs font-semibold text-gray-400 select-none pr-1">câu</span>
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= actualMax || actualMax === 0}
          className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs"
          title="Tăng 1 câu"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}
