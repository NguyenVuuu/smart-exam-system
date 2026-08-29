import { PrismaClient, Semester } from '@prisma/client'

const SEMESTERS = [
  {
    id: 'sem-hk1-2026',
    code: 'HK1_2025_2026',
    name: 'Học kỳ 1 - 2025/2026',
    academicYear: '2025-2026',
    term: 'TERM_1' as const,
    startDate: new Date('2026-01-06'),
    endDate: new Date('2026-05-31'),
    status: 'ACTIVE' as const,
  },
  {
    id: 'sem-hk2-2026',
    code: 'HK2_2025_2026',
    name: 'Học kỳ 2 - 2025/2026',
    academicYear: '2025-2026',
    term: 'TERM_2' as const,
    startDate: new Date('2026-06-15'),
    endDate: new Date('2026-10-31'),
    status: 'UPCOMING' as const,
  },
]

export async function seedSemesters(prisma: PrismaClient): Promise<Semester[]> {
  console.log('Seeding Semesters...')

  const semesters: Semester[] = []
  for (const data of SEMESTERS) {
    const semester = await prisma.semester.upsert({
      where: { id: data.id },
      update: {},
      create: data,
    })
    semesters.push(semester)
  }

  console.log(`✓ Semesters completed (${semesters.length})`)
  return semesters
}
