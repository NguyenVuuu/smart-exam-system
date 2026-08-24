import type { ReactNode } from 'react'

export function StepCard({
  title,
  desc,
  icon,
  action,
  children,
}: {
  title: string
  desc: string
  icon: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">{icon}</div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>
            <p className="text-xs text-gray-500 mt-1">{desc}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export function Panel({
  title,
  icon,
  children,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-3">
      <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
        {icon} {title}
      </h3>
      {children}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded text-blue-600 focus:ring-blue-500"
      />
      <span>{label}</span>
    </label>
  )
}

export function SummaryBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-center">
      <p className="text-[10px] uppercase font-bold text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  )
}

export function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-semibold text-gray-800">{value}</span>
    </div>
  )
}
