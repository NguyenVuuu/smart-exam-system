import type { ReactNode } from 'react'

interface AppCardProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article' | 'aside'
}

export default function AppCard({
  children,
  className = '',
  as: Component = 'div',
}: AppCardProps) {
  return (
    <Component className={`bg-white border border-gray-100 rounded-xl shadow-sm ${className}`}>
      {children}
    </Component>
  )
}
