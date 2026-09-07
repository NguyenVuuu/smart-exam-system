import { useMemo, useState } from 'react'
import { useDebounce } from 'use-debounce'
import type { AuditLogFilters } from '../api/admin-audit-logs.api'
import { toDateRangeIso } from '../utils/audit-log.utils'

export interface AuditLogFilterValues {
  search: string
  action: string
  entityType: string
  role: string
  fromDate: string
  toDate: string
}

const initialValues: AuditLogFilterValues = {
  search: '',
  action: 'ALL',
  entityType: 'ALL',
  role: 'ALL',
  fromDate: '',
  toDate: '',
}

export const useAuditLogFilters = (pageSize: number) => {
  const [page, setPage] = useState(1)
  const [values, setValues] = useState(initialValues)
  const [debouncedSearch] = useDebounce(values.search.trim(), 350)

  const filters: AuditLogFilters = useMemo(() => ({
    page,
    pageSize,
    keyword: debouncedSearch || undefined,
    action: values.action === 'ALL' ? undefined : values.action,
    entityType: values.entityType === 'ALL' ? undefined : values.entityType,
    role: values.role === 'ALL' ? undefined : values.role as AuditLogFilters['role'],
    from: toDateRangeIso(values.fromDate),
    to: toDateRangeIso(values.toDate, true),
  }), [page, pageSize, debouncedSearch, values])

  const update = (field: keyof AuditLogFilterValues, selectedValue: string) => {
    setValues((current) => ({ ...current, [field]: selectedValue }))
    setPage(1)
  }

  const reset = () => {
    setValues(initialValues)
    setPage(1)
  }

  const exportFilters = {
    keyword: filters.keyword,
    action: filters.action,
    entityType: filters.entityType,
    role: filters.role,
    from: filters.from,
    to: filters.to,
  }

  return { page, setPage, values, filters, exportFilters, update, reset }
}
