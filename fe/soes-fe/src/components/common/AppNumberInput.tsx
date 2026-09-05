interface AppNumberInputProps {
  value: number | ''
  onChange: (value: number) => void
  min?: number
  step?: number
  suffix?: string
  placeholder?: string
  className?: string
}

export default function AppNumberInput({
  value,
  onChange,
  min = 1,
  step,
  suffix,
  placeholder,
  className = '',
}: AppNumberInputProps) {
  return (
    <div className="relative">
      <input
        type="number"
        min={min}
        step={step}
        value={value === '' ? '' : value}
        placeholder={placeholder}
        onChange={(event) => {
          const val = event.target.value
          onChange(val === '' ? ('' as unknown as number) : Number(val))
        }}
        className={`h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-normal text-slate-800 focus:border-blue-400 focus:outline-none ${
          suffix ? 'pr-12' : ''
        } ${className}`}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
          {suffix}
        </span>
      )}
    </div>
  )
}
