import { ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface AppSelectOption<T extends string | number = string> {
  value: T
  label: ReactNode
  disabled?: boolean
}

export interface AppSelectProps<T extends string | number = string> {
  value: T
  options: AppSelectOption<T>[]
  onChange: (value: T) => void
  className?: string
  buttonClassName?: string
  menuClassName?: string
  disabled?: boolean
  placeholder?: string
  accent?: 'blue' | 'emerald'
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
  accent = 'blue',
}: AppSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  )
  const accentClassName = {
    blue: {
      button: 'hover:border-blue-300 focus:border-blue-400',
      selected: 'bg-blue-600 text-white',
      option: 'text-gray-700 hover:bg-blue-50 hover:text-blue-700',
    },
    emerald: {
      button: 'hover:border-emerald-300 focus:border-emerald-400',
      selected: 'bg-emerald-600 text-white',
      option: 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700',
    },
  }[accent]

  const updateMenuPosition = useCallback(() => {
    const rect = rootRef.current?.getBoundingClientRect()
    if (!rect) return
    const desiredMaxHeight = Math.min(240, options.length * 40 + 8)
    const viewportPadding = 8
    const gap = 4
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding
    const spaceAbove = rect.top - viewportPadding
    const openAbove = spaceBelow < Math.min(180, desiredMaxHeight) && spaceAbove > spaceBelow
    const maxHeight = Math.max(48, Math.min(desiredMaxHeight, openAbove ? spaceAbove : spaceBelow))

    setMenuStyle({
      left: rect.left,
      top: openAbove ? Math.max(viewportPadding, rect.top - maxHeight - gap) : rect.bottom + gap,
      width: Math.max(rect.width, 200),
      maxHeight,
    })
  }, [options.length])

  useLayoutEffect(() => {
    if (isOpen) updateMenuPosition()
  }, [isOpen, updateMenuPosition])

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
  }, [isOpen, updateMenuPosition])

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
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-normal text-slate-800 shadow-xs transition-colors focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 ${accentClassName.button} ${buttonClassName}`}
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
          className={`fixed rounded-xl border border-gray-100 bg-white shadow-lg p-1 z-50 flex flex-col max-h-60 overflow-y-auto ${menuClassName}`}
        >
          {options.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              disabled={option.disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (option.disabled) return
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full shrink-0 rounded-lg px-3 py-2 text-left text-sm font-normal transition-colors disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${
                option.value === value && !option.disabled
                  ? accentClassName.selected
                  : option.disabled
                    ? ''
                    : accentClassName.option
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
