import { Department, PrismaClient, Subject } from '@prisma/client'

const SUBJECTS = [
  { id: 'subj-java', code: 'JAVA101', name: 'Lập trình Java', credits: 3, description: 'Lập trình hướng đối tượng với Java', departmentCode: 'CNPM' },
  { id: 'subj-sql', code: 'SQL101', name: 'Cơ sở dữ liệu SQL', credits: 3, description: 'Thiết kế và truy vấn cơ sở dữ liệu', departmentCode: 'CNPM' },
  { id: 'subj-react', code: 'REACT101', name: 'Lập trình React', credits: 3, description: 'Phát triển giao diện với React', departmentCode: 'CNPM' },
  { id: 'subj-ai', code: 'AI101', name: 'Trí tuệ nhân tạo', credits: 3, description: 'Các thuật toán AI cơ bản', departmentCode: 'AI' },
  { id: 'subj-cnpm', code: 'CNPM101', name: 'Công nghệ phần mềm', credits: 3, description: 'Quy trình và phương pháp phát triển phần mềm', departmentCode: 'CNPM' },
  { id: 'subj-cpp', code: 'CPP101', name: 'Lập trình C++', credits: 3, description: 'Lập trình hướng đối tượng với C++', departmentCode: 'CNPM' },
]

export async function seedSubjects(
  prisma: PrismaClient,
  { departments }: { departments: Department[] },
): Promise<Subject[]> {
  console.log('Seeding Subjects...')

  const subjects: Subject[] = []
  for (const data of SUBJECTS) {
    const department = departments.find((item) => item.code === data.departmentCode)
    if (!department) {
      throw new Error(`Missing department ${data.departmentCode} for subject ${data.code}`)
    }
    const subject = await prisma.subject.upsert({
      where: { code: data.code },
      update: {
        name: data.name,
        description: data.description,
        credits: data.credits,
        departmentId: department.id,
      },
      create: {
        id: data.id,
        code: data.code,
        name: data.name,
        description: data.description,
        credits: data.credits,
        status: 'ACTIVE',
        departmentId: department.id,
      },
    })
    subjects.push(subject)
  }

  console.log(`✓ Subjects completed (${subjects.length})`)
  return subjects
}
