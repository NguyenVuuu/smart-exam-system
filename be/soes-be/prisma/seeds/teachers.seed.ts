import { Department, PrismaClient, Teacher } from '@prisma/client'
import { DEFAULT_PASSWORD, hashPassword, padCode } from './helpers'

const FIXED_TEACHERS = [
  {
    userId: 'seed-user-teacher-001',
    teacherCode: 'US000004',
    fullName: 'Tran Thi Bich',
    email: 'gv001@soes.edu.vn',
    username: 'US000004',
    roles: ['DEPARTMENT_HEAD'] as const,
    position: 'DEPARTMENT_HEAD' as const,
    departmentCode: 'CNPM',
  },
  {
    userId: 'seed-user-combo-001',
    teacherCode: 'US000005',
    fullName: 'Le Minh Cuong',
    email: 'combo@soes.edu.vn',
    username: 'US000005',
    roles: ['TEACHER', 'STUDENT'] as const,
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
      update: {
        fullName: data.fullName,
        email: data.email,
        username: data.username,
        password: hashed,
        roles: [...data.roles],
        status: 'ACTIVE',
      },
      create: {
        id: data.userId,
        fullName: data.fullName,
        email: data.email,
        username: data.username,
        password: hashed,
        roles: [...data.roles],
        status: 'ACTIVE',
      },
    })
    const existingTeacher = await prisma.teacher.findFirst({ where: { userId: data.userId } })
    const teacher = existingTeacher
      ? await prisma.teacher.update({ where: { id: existingTeacher.id }, data: { teacherCode: data.teacherCode, position: data.position, departmentId: department?.id, status: 'ACTIVE' } })
      : await prisma.teacher.create({ data: { teacherCode: data.teacherCode, status: 'ACTIVE', userId: data.userId, position: data.position, departmentId: department?.id } })
    teachers.push(teacher)
  }

  const NAMES = ['Nguyen Van Hung', 'Pham Thi Lan', 'Hoang Duc Manh']
  const defaultDepartment = departments.find((item) => item.code === 'CNPM')
  for (let i = 3; i <= 2 + EXTRA_TEACHER_COUNT; i++) {
    const teacherCode = `US${padCode(i + 3, 6)}`
    const userId = `seed-user-teacher-${padCode(i, 3)}`

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        password: hashed,
        roles: ['TEACHER'],
        status: 'ACTIVE',
      },
      create: {
        id: userId,
        fullName: NAMES[i - 3] ?? `Teacher ${i}`,
        email: `gv${padCode(i, 3)}@soes.edu.vn`,
        username: teacherCode,
        password: hashed,
        roles: ['TEACHER'],
        status: 'ACTIVE',
      },
    })
    const existing = await prisma.teacher.findFirst({ where: { userId } })
    const teacher = existing
      ? await prisma.teacher.update({ where: { id: existing.id }, data: { teacherCode, status: 'ACTIVE', position: 'LECTURER', departmentId: defaultDepartment?.id } })
      : await prisma.teacher.create({ data: { teacherCode, status: 'ACTIVE', userId, position: 'LECTURER', departmentId: defaultDepartment?.id } })
    teachers.push(teacher)
  }

  console.log(`✓ Teachers completed (${teachers.length})`)
  return teachers
}

