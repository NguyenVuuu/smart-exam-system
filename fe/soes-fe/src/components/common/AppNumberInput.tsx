interface AppNumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  step?: number
  suffix?: string
  className?: string
}

export default function AppNumberInput({
  value,
  onChange,
  min = 1,
  step,
  suffix,
  className = '',
}: AppNumberInputProps) {
  return (
    <div className="relative">
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`w-full bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-xl p-2.5 focus:outline-none focus:border-blue-400 ${
          suffix ? 'pr-12' : ''
        } ${className}`}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-500">
          {suffix}
        </span>
      )}
    </div>
  )
}
