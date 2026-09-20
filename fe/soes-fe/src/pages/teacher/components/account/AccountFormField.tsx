import type { ReactNode } from 'react'

interface AccountFormFieldProps {
  label: string
  icon?: ReactNode
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
}

export default function AccountFormField({
  label,
  icon,
  error,
  hint,
  required,
  children,
}: AccountFormFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        {icon && <span className="text-gray-400">{icon}</span>}
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {error ? (
        <span className="block text-xs font-medium text-rose-600 animate-in fade-in duration-150">
          {error}
        </span>
      ) : hint ? (
        <span className="block text-xs text-gray-400">{hint}</span>
      ) : null}
    </label>
  )
}
