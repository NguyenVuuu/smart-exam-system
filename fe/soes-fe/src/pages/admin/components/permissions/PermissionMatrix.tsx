import { Check, RotateCcw } from 'lucide-react'
import { Fragment, useMemo } from 'react'
import type { UserPermission } from '../../../../types/auth.types'
import type { PermissionItem } from '../../api/admin-permissions.api'

interface PermissionMatrixProps {
  catalog: PermissionItem[]
  permissions: UserPermission[]
  overrides?: Array<{ permission: UserPermission; allowed: boolean }>
  onChange: (item: PermissionItem, allowed: boolean) => void
  onReset?: (item: PermissionItem) => void
}

export default function PermissionMatrix({ catalog, permissions, overrides, onChange, onReset }: PermissionMatrixProps) {
  const groups = useMemo(() => {
    const entries = new Map<string, Map<string, PermissionItem[]>>()
    for (const item of catalog) {
      if (!entries.has(item.group)) entries.set(item.group, new Map())
      const modules = entries.get(item.group)!
      modules.set(item.module, [...(modules.get(item.module) ?? []), item])
    }
    return [...entries].map(([group, modules]) => [group, [...modules]] as const)
  }, [catalog])

  const overridden = new Set(overrides?.map(({ permission }) => permission) ?? [])

  return (
    <div className="min-h-0 flex-1 overflow-auto [scrollbar-width:thin]">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50 text-slate-700">
          <tr className="border-b border-slate-200">
            <th scope="col" className="px-5 py-3 text-left font-semibold">Chức năng</th>
            <th scope="col" className="w-32 border-l border-slate-200 px-3 py-3 text-center font-semibold">Xem</th>
            <th scope="col" className="w-32 border-l border-slate-200 px-3 py-3 text-center font-semibold">Quản lý</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(([group, modules]) => (
            <Fragment key={group}>
              <tr className="border-b border-slate-200 bg-slate-50/70">
                <th colSpan={3} scope="rowgroup" className="px-5 py-2 text-left text-xs font-semibold uppercase text-slate-500">{group}</th>
              </tr>
              {modules.map(([module, items]) => (
                <tr key={module} className="border-b border-slate-100 hover:bg-slate-50/60">
                  <th scope="row" className="px-5 py-3 text-left font-medium text-slate-800">
                    <span className="block">{module}</span>
                    <span className="mt-0.5 block text-xs font-normal text-slate-500">
                      {items.find((item) => item.action === 'MANAGE')?.label ?? items[0]?.label}
                    </span>
                  </th>
                  {(['VIEW', 'MANAGE'] as const).map((action) => {
                    const item = items.find((permission) => permission.action === action)
                    const checked = item ? permissions.includes(item.key) : false
                    return (
                      <td key={action} className="border-l border-slate-100 px-3 py-3 text-center">
                        {item ? (
                          <div className="relative inline-flex items-center justify-center">
                            <label title={item.label} className="inline-flex cursor-pointer items-center justify-center">
                              <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={checked}
                                aria-label={`${module}: ${item.label}`}
                                onChange={() => onChange(item, !checked)}
                              />
                              <span className="flex h-5 w-5 items-center justify-center rounded border border-slate-300 bg-white text-white peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-600">
                                {checked && <Check size={14} strokeWidth={3} />}
                              </span>
                            </label>
                            {overridden.has(item.key) && onReset && (
                              <button
                                type="button"
                                onClick={() => onReset(item)}
                                className="absolute left-full top-1/2 ml-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-emerald-600 transition-colors"
                                title="Dùng quyền theo vai trò (đang điều chỉnh riêng)"
                                aria-label={`Dùng quyền theo vai trò: ${item.label}`}
                              >
                                <RotateCcw size={13} />
                              </button>
                            )}
                          </div>
                        ) : <span className="text-slate-300" aria-label="Không áp dụng">—</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
