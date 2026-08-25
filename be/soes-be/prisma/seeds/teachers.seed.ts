import { Department, PrismaClient, Teacher } from '@prisma/client'
import { DEFAULT_PASSWORD, hashPassword, padCode } from './helpers'

const FIXED_TEACHERS = [
  {
    userId: 'seed-user-teacher-001',
    teacherCode: 'GV000001',
    fullName: 'Tran Thi Bich',
    email: 'gv001@soes.edu.vn',
    position: 'DEPARTMENT_HEAD' as const,
    departmentCode: 'CNPM',
  },
  {
    userId: 'seed-user-combo-001',
    teacherCode: 'GV000002',
    fullName: 'Le Minh Cuong',
    email: 'combo@soes.edu.vn',
    position: 'LECTURER' as const,
    departmentCode: 'CNPM',
  },
]

const EXTRA_TEACHER_COUNT = 3 // GV000003 → GV000005

export async function seedTeachers(
  prisma: PrismaClient,
  { departments }: { departments: Department[] },
): Promise<Teacher[]> {
  console.log('Seeding Teachers...')

  const hashed = await hashPassword(DEFAULT_PASSWORD)
  const teachers: Teacher[] = []

  for (const data of FIXED_TEACHERS) {
    const department = departments.find((item) => item.code === data.departmentCode)
    await prisma.user.upsert({
      where: { id: data.userId },
      update: {},
      create: { id: data.userId, fullName: data.fullName, email: data.email },
    })
    const teacher = await prisma.teacher.upsert({
      where: { teacherCode: data.teacherCode },
      update: {
        position: data.position,
        departmentId: department?.id,
      },
      create: {
        teacherCode: data.teacherCode,
        password: hashed,
        status: 'ACTIVE',
        userId: data.userId,
        position: data.position,
        departmentId: department?.id,
      },
    })
    teachers.push(teacher)
  }

  const NAMES = ['Nguyen Van Hung', 'Pham Thi Lan', 'Hoang Duc Manh']
  const defaultDepartment = departments.find((item) => item.code === 'CNPM')
  for (let i = 3; i <= 2 + EXTRA_TEACHER_COUNT; i++) {
    const teacherCode = `GV${padCode(i, 6)}`
    const userId = `seed-user-teacher-${padCode(i, 3)}`

    const existing = await prisma.teacher.findUnique({ where: { teacherCode } })
    if (existing) {
      const teacher = await prisma.teacher.update({
        where: { id: existing.id },
        data: {
          position: 'LECTURER',
          departmentId: defaultDepartment?.id,
        },
      })
      teachers.push(teacher)
      continue
    }

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, fullName: NAMES[i - 3] ?? `Teacher ${i}`, email: `gv${padCode(i, 3)}@soes.edu.vn` },
    })
    const teacher = await prisma.teacher.create({
      data: {
        teacherCode,
        password: hashed,
        status: 'ACTIVE',
        userId,
        position: 'LECTURER',
        departmentId: defaultDepartment?.id,
      },
    })
    teachers.push(teacher)
  }

  console.log(`✓ Teachers completed (${teachers.length})`)
  return teachers
}
