import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

export function AdminField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  )
}

export function AdminInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-400 ${props.className ?? ''}`}
    />
  )
}

export function AdminTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-28 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-400 ${props.className ?? ''}`}
    />
  )
}
