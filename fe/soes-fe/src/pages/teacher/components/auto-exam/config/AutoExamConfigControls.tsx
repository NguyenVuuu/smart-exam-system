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
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <AppNumberInput value={value} onChange={onChange} suffix={suffix} className="bg-white p-2.5 text-sm rounded-xl" />
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
    <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm font-medium text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
      />
      {icon}
      {label}
    </label>
  )
}

export function AvailabilityCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-1">
      <span className="text-sm text-gray-500">{label}</span>
      <p className="text-base font-bold text-gray-900">{value} câu</p>
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
      className={`p-4 sm:p-5 rounded-xl border text-left space-y-1.5 transition-all ${
        active ? 'bg-blue-50/80 border-blue-400 text-blue-950 shadow-xs' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900">{title}</span>
        {active && <CheckCircle2 size={18} className="text-blue-600 shrink-0" />}
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </button>
  )
}
