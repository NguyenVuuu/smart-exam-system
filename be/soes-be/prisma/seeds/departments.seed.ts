import { Department, PrismaClient } from '@prisma/client'

const DEPARTMENTS = [
  {
    id: 'dept-software-engineering',
    code: 'CNPM',
    name: 'Bộ môn Công nghệ phần mềm',
    description: 'Phụ trách các học phần lập trình, công nghệ phần mềm và cơ sở dữ liệu.',
  },
  {
    id: 'dept-ai',
    code: 'AI',
    name: 'Bộ môn Trí tuệ nhân tạo',
    description: 'Phụ trách các học phần trí tuệ nhân tạo và khoa học dữ liệu.',
  },
]

export async function seedDepartments(prisma: PrismaClient): Promise<Department[]> {
  console.log('Seeding Departments...')

  const departments: Department[] = []
  for (const data of DEPARTMENTS) {
    const department = await prisma.department.upsert({
      where: { code: data.code },
      update: {
        name: data.name,
        description: data.description,
        status: 'ACTIVE',
      },
      create: {
        ...data,
        status: 'ACTIVE',
      },
    })
    departments.push(department)
  }

  console.log(`✓ Departments completed (${departments.length})`)
  return departments
}
