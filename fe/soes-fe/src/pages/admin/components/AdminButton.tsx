import type { ButtonHTMLAttributes, ReactNode } from 'react'

type AdminButtonTone = 'primary' | 'secondary' | 'danger'

const toneClassName: Record<AdminButtonTone, string> = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600',
  secondary: 'bg-white text-slate-700 hover:bg-gray-50 border-gray-200',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 border-rose-600',
}

interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: AdminButtonTone
  icon?: ReactNode
}

export default function AdminButton({
  tone = 'primary',
  icon,
  children,
  className = '',
  ...props
}: AdminButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${toneClassName[tone]} ${className}`}
    >
      {icon}
      {children}
    </button>
  )
}
