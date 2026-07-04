import { PrismaClient, Teacher } from '@prisma/client'
import { DEFAULT_PASSWORD, hashPassword, padCode } from './helpers'

const FIXED_TEACHERS = [
  { userId: 'seed-user-teacher-001', teacherCode: 'GV000001', fullName: 'Tran Thi Bich', email: 'gv001@soes.edu.vn' },
  { userId: 'seed-user-combo-001',   teacherCode: 'GV000002', fullName: 'Le Minh Cuong',  email: 'combo@soes.edu.vn' },
]

const EXTRA_TEACHER_COUNT = 3 // GV000003 → GV000005

export async function seedTeachers(prisma: PrismaClient): Promise<Teacher[]> {
  console.log('Seeding Teachers...')

  const hashed = await hashPassword(DEFAULT_PASSWORD)
  const teachers: Teacher[] = []

  for (const data of FIXED_TEACHERS) {
    await prisma.user.upsert({
      where: { id: data.userId },
      update: {},
      create: { id: data.userId, fullName: data.fullName, email: data.email },
    })
    const teacher = await prisma.teacher.upsert({
      where: { teacherCode: data.teacherCode },
      update: {},
      create: { teacherCode: data.teacherCode, password: hashed, status: 'ACTIVE', userId: data.userId },
    })
    teachers.push(teacher)
  }

  const NAMES = ['Nguyen Van Hung', 'Pham Thi Lan', 'Hoang Duc Manh']
  for (let i = 3; i <= 2 + EXTRA_TEACHER_COUNT; i++) {
    const teacherCode = `GV${padCode(i, 6)}`
    const userId = `seed-user-teacher-${padCode(i, 3)}`

    const existing = await prisma.teacher.findUnique({ where: { teacherCode } })
    if (existing) { teachers.push(existing); continue }

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, fullName: NAMES[i - 3] ?? `Teacher ${i}`, email: `gv${padCode(i, 3)}@soes.edu.vn` },
    })
    const teacher = await prisma.teacher.create({
      data: { teacherCode, password: hashed, status: 'ACTIVE', userId },
    })
    teachers.push(teacher)
  }

  console.log(`✓ Teachers completed (${teachers.length})`)
  return teachers
}
