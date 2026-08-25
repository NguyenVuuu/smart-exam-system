import { CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'
import AppNumberInput from '../../../../../components/common/AppNumberInput'

export function NumberField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  suffix?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <AppNumberInput value={value} onChange={onChange} suffix={suffix} className="bg-white p-2" />
    </div>
  )
}

export function Checkbox({
  checked,
  onChange,
  label,
  icon,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  icon?: ReactNode
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded text-blue-600"
      />
      {icon}
      {label}
    </label>
  )
}

export function AvailabilityCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-2">
      <span className="text-gray-500">{label}</span>
      <p className="font-medium text-gray-900">{value} câu</p>
    </div>
  )
}

export function PickModeButton({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-xl border text-left space-y-1 transition-all ${
        active ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{title}</span>
        {active && <CheckCircle2 size={16} className="text-blue-600" />}
      </div>
      <p className="text-xs leading-relaxed">{description}</p>
    </button>
  )
}

export function DifficultyRange({
  label,
  value,
  max,
  onChange,
}: {
  label: string
  value: number
  max: number
  onChange: (value: number) => void
}) {
  const percent = max > 0 ? (value / max) * 100 : 0

  return (
    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
      <div className="flex justify-between items-center text-xs font-medium text-gray-800">
        <span>{label}</span>
        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-medium">
          {value} câu
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, #2563eb ${percent}%, #d1d5db ${percent}%)`,
        }}
        className="h-2 w-full cursor-pointer appearance-none rounded-full outline-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:shadow-sm [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-sm"
      />
    </div>
  )
}

