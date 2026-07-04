import { PrismaClient, Subject } from '@prisma/client'

const SUBJECTS = [
  { id: 'subj-java', code: 'JAVA101', name: 'Lập trình Java', description: 'Lập trình hướng đối tượng với Java' },
  { id: 'subj-sql', code: 'SQL101', name: 'Cơ sở dữ liệu SQL', description: 'Thiết kế và truy vấn cơ sở dữ liệu' },
  { id: 'subj-react', code: 'REACT101', name: 'Lập trình React', description: 'Phát triển giao diện với React' },
  { id: 'subj-ai', code: 'AI101', name: 'Trí tuệ nhân tạo', description: 'Các thuật toán AI cơ bản' },
  { id: 'subj-cnpm', code: 'CNPM101', name: 'Công nghệ phần mềm', description: 'Quy trình và phương pháp phát triển phần mềm' },
  { id: 'subj-cpp', code: 'CPP101', name: 'Lập trình C++', description: 'Lập trình hướng đối tượng với C++' },
]

export async function seedSubjects(prisma: PrismaClient): Promise<Subject[]> {
  console.log('Seeding Subjects...')

  const subjects: Subject[] = []
  for (const data of SUBJECTS) {
    const subject = await prisma.subject.upsert({
      where: { code: data.code },
      update: {},
      create: { ...data, status: 'ACTIVE' },
    })
    subjects.push(subject)
  }

  console.log(`✓ Subjects completed (${subjects.length})`)
  return subjects
}
