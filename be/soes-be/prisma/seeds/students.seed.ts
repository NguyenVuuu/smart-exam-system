import { PrismaClient, Student } from '@prisma/client'
import { DEFAULT_PASSWORD, hashPassword, padCode } from './helpers'

interface FixedStudentEntry {
  userId: string
  studentCode: string
  // Optional: omit for profile-only entries where User was already created in another seed
  fullName?: string
  email?: string
  username?: string
}

const FIXED_STUDENTS: FixedStudentEntry[] = [
  {
    userId: 'seed-user-student-001',
    studentCode: 'US000009',
    fullName: 'Nguyen Van An',
    email: 'student1@soes.edu.vn',
    username: 'US000009',
  },
  // seed-user-combo-001 owns BOTH Teacher profile GV000002 and Student profile SV000002.
  {
    userId: 'seed-user-combo-001',
    studentCode: 'US000005',
  },
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
    if ('fullName' in data && data.fullName) {
      // Full user entry: create/update both User and Student profile
      await prisma.user.upsert({
        where: { id: data.userId },
        update: {
          fullName: data.fullName,
          email: data.email,
          username: data.username,
          password: hashed,
          status: 'ACTIVE',
        },
        create: {
          id: data.userId,
          fullName: data.fullName,
          email: data.email,
          username: data.username,
          password: hashed,
          roles: ['STUDENT'],
          status: 'ACTIVE',
        },
      })
    }
    // Profile-only entry: User already exists (created in teachers.seed), just upsert the Student profile
    const existingStudent = await prisma.student.findFirst({ where: { userId: data.userId } })
    const student = existingStudent
      ? await prisma.student.update({ where: { id: existingStudent.id }, data: { studentCode: data.studentCode, status: 'ACTIVE' } })
      : await prisma.student.create({ data: { studentCode: data.studentCode, status: 'ACTIVE', userId: data.userId } })
    students.push(student)
  }

  for (let i = 3; i <= 2 + EXTRA_STUDENT_COUNT; i++) {
    const studentCode = `US${padCode(i + 7, 6)}`
    const userId = `seed-user-student-${padCode(i, 3)}`

    const name = STUDENT_NAMES[i - 3] ?? `Student ${i}`
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        password: hashed,
        roles: ['STUDENT'],
        status: 'ACTIVE',
      },
      create: {
        id: userId,
        fullName: name,
        email: `sv${padCode(i, 3)}@soes.edu.vn`,
        username: studentCode,
        password: hashed,
        roles: ['STUDENT'],
        status: 'ACTIVE',
      },
    })
    const existing = await prisma.student.findFirst({ where: { userId } })
    const student = existing
      ? await prisma.student.update({ where: { id: existing.id }, data: { studentCode, status: 'ACTIVE' } })
      : await prisma.student.create({ data: { studentCode, status: 'ACTIVE', userId: user.id } })
    students.push(student)
  }

  console.log(`✓ Students completed (${students.length})`)
  return students
}

