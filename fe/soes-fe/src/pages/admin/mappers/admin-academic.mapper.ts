import type { SemesterApiDto } from '../types/admin-api.types'
import type { AcademicYear } from '../types/admin.types'

const termNumber = { TERM_1: 1, TERM_2: 2, TERM_3: 3 } as const

export function toAcademicYear(dto: SemesterApiDto): AcademicYear {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    academicYear: dto.academicYear.replace('-', ' - '),
    term: termNumber[dto.term],
    startDate: formatDate(dto.startDate),
    endDate: formatDate(dto.endDate),
    status: dto.status,
    isCurrent: dto.status === 'ACTIVE',
  }
}

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN').format(new Date(value))
