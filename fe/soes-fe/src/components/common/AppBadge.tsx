import type { ReactNode } from 'react'

type AppBadgeTone = 'gray' | 'blue' | 'emerald' | 'amber' | 'rose'
type AppBadgeShape = 'pill' | 'rounded'

const toneClassName: Record<AppBadgeTone, string> = {
  gray: 'bg-gray-100 text-gray-700 border-gray-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
}

const shapeClassName: Record<AppBadgeShape, string> = {
  pill: 'rounded-full',
  rounded: 'rounded-lg',
}

interface AppBadgeProps {
  children: ReactNode
  tone?: AppBadgeTone
  shape?: AppBadgeShape
  className?: string
}

export default function AppBadge({
  children,
  tone = 'gray',
  shape = 'pill',
  className = '',
}: AppBadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1 whitespace-nowrap shrink-0 px-3 py-1 text-xs font-semibold border ${toneClassName[tone]} ${shapeClassName[shape]} ${className}`}
    >
      {children}
    </span>
  )
}
