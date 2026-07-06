import prisma from '../../../lib/prisma'

// Returns the active semester, falling back to the most recently started one
export async function findCurrentSemester() {
  const active = await prisma.semester.findFirst({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true },
    orderBy: { startDate: 'desc' },
  })
  if (active) return active

  return prisma.semester.findFirst({
    select: { id: true, name: true },
    orderBy: { startDate: 'desc' },
  })
}

export async function findSemesterById(semesterId: string) {
  return prisma.semester.findUnique({
    where: { id: semesterId },
    select: { id: true, name: true },
  })
}

// All semesters in which this student has at least one enrollment
export async function findSemesterOptionsForStudent(studentId: string) {
  const rows = await prisma.semester.findMany({
    where: {
      courseOfferings: {
        some: {
          enrollments: { some: { studentId } },
        },
      },
    },
    select: { id: true, name: true },
    orderBy: { startDate: 'desc' },
  })
  return rows
}

export interface SubjectQueryParams {
  studentId: string
  semesterId: string
  keyword?: string
  page: number
  pageSize: number
}

export async function findStudentSubjects(params: SubjectQueryParams) {
  const { studentId, semesterId, keyword, page, pageSize } = params
  const skip = (page - 1) * pageSize

  const where = {
    studentId,
    courseOffering: {
      semesterId,
      ...(keyword
        ? { subject: { name: { contains: keyword, mode: 'insensitive' as const } } }
        : {}),
    },
  }

  const [totalItems, enrollments] = await Promise.all([
    prisma.enrollment.count({ where }),
    prisma.enrollment.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { courseOffering: { subject: { name: 'asc' } } },
      select: {
        courseOffering: {
          select: {
            id: true,
            subject: { select: { id: true, code: true, name: true } },
            teacher: {
              select: { user: { select: { fullName: true } } },
            },
            _count: {
              select: { materials: true, exams: true },
            },
          },
        },
      },
    }),
  ])

  return { totalItems, enrollments }
}
