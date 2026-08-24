import { ChevronDown } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface AppSelectOption<T extends string | number = string> {
  value: T
  label: ReactNode
}

interface AppSelectProps<T extends string | number = string> {
  value: T
  options: AppSelectOption<T>[]
  onChange: (value: T) => void
  className?: string
  buttonClassName?: string
  menuClassName?: string
  disabled?: boolean
  placeholder?: string
}

export default function AppSelect<T extends string | number = string>({
  value,
  options,
  onChange,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  disabled = false,
  placeholder = 'Chọn',
}: AppSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  )

  const updateMenuPosition = () => {
    const rect = rootRef.current?.getBoundingClientRect()
    if (!rect) return

    setMenuStyle({
      left: rect.left,
      top: rect.bottom + 4,
      width: rect.width,
    })
  }

  useLayoutEffect(() => {
    if (isOpen) updateMenuPosition()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setIsOpen(false)
    }

    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [isOpen])

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      tabIndex={-1}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-white border border-gray-200 hover:border-blue-300 disabled:bg-gray-100 disabled:text-gray-400 text-xs text-gray-800 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 shadow-xs transition-colors focus:outline-none focus:border-blue-400 ${buttonClassName}`}
      >
        <span className="truncate">{selectedOption?.label ?? placeholder}</span>
        <ChevronDown
          size={15}
          className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && !disabled && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          className={`fixed max-h-64 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg p-1 z-50 ${menuClassName}`}
        >
          {options.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                option.value === value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}
