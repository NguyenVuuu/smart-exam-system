import { PrismaClient, Student } from '@prisma/client'
import { DEFAULT_PASSWORD, hashPassword, padCode } from './helpers'

const FIXED_STUDENTS = [
  { userId: 'seed-user-student-001', studentCode: 'SV000001', fullName: 'Nguyen Van An' },
  { userId: 'seed-user-combo-001',   studentCode: 'SV000002', fullName: 'Le Minh Cuong' }, // also a teacher
]

const STUDENT_NAMES = [
  'Tran Thi C', 'Pham Van D', 'Le Thi E', 'Nguyen Van F',
  'Hoang Thi G', 'Vu Van H', 'Dang Thi I', 'Bui Van J',
  'Do Thi K', 'Ngo Van L', 'Ly Thi M', 'Ha Van N',
  'Cao Thi O', 'Dinh Van P', 'Truong Thi Q', 'Vo Van R',
  'Duong Thi S', 'Luu Van T', 'Tran Van U', 'Nguyen Thi V',
  'Pham Thi W', 'Le Van X', 'Hoang Van Y', 'Vu Thi Z',
  'Dang Van AA', 'Bui Thi BB', 'Do Van CC',
]

const EXTRA_STUDENT_COUNT = 27 // SV000003 → SV000029

export async function seedStudents(prisma: PrismaClient): Promise<Student[]> {
  console.log('Seeding Students...')

  const hashed = await hashPassword(DEFAULT_PASSWORD)
  const students: Student[] = []

  for (const data of FIXED_STUDENTS) {
    // User may already exist (combo user was created in teachers seed)
    await prisma.user.upsert({
      where: { id: data.userId },
      update: {},
      create: { id: data.userId, fullName: data.fullName },
    })
    const student = await prisma.student.upsert({
      where: { studentCode: data.studentCode },
      update: {},
      create: { studentCode: data.studentCode, password: hashed, status: 'ACTIVE', userId: data.userId },
    })
    students.push(student)
  }

  for (let i = 3; i <= 2 + EXTRA_STUDENT_COUNT; i++) {
    const studentCode = `SV${padCode(i, 6)}`
    const userId = `seed-user-student-${padCode(i, 3)}`

    const existing = await prisma.student.findUnique({ where: { studentCode } })
    if (existing) { students.push(existing); continue }

    const name = STUDENT_NAMES[i - 3] ?? `Student ${i}`
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, fullName: name },
    })
    const student = await prisma.student.create({
      data: { studentCode, password: hashed, status: 'ACTIVE', userId },
    })
    students.push(student)
  }

  console.log(`✓ Students completed (${students.length})`)
  return students
}
