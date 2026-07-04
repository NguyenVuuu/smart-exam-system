import { CourseOffering, PrismaClient, Teacher } from '@prisma/client'

interface MaterialSeedInput {
  courseOfferings: CourseOffering[]
  teachers: Teacher[]
}

function makeMaterials(subjectName: string) {
  return [
    { fileName: `${subjectName}_slide_chapter1.pdf`,  size: 1024000 },
    { fileName: `${subjectName}_slide_chapter2.pdf`,  size: 2048000 },
    { fileName: `${subjectName}_exercise_set1.docx`,  size: 512000  },
  ]
}

const SUBJECT_NAMES = ['Java', 'SQL', 'React', 'AI', 'CNPM']

export async function seedMaterials(
  prisma: PrismaClient,
  { courseOfferings, teachers }: MaterialSeedInput,
): Promise<void> {
  console.log('Seeding Materials...')

  let total = 0

  for (let i = 0; i < courseOfferings.length; i++) {
    const offering = courseOfferings[i]
    const teacher = teachers[i] ?? teachers[0]
    const subjectName = SUBJECT_NAMES[i] ?? `Subject${i}`
    const files = makeMaterials(subjectName)

    for (const file of files) {
      const existing = await prisma.material.findUnique({
        where: { courseOfferingId_fileName: { courseOfferingId: offering.id, fileName: file.fileName } },
      })
      if (existing) continue

      await prisma.material.create({
        data: {
          fileName: file.fileName,
          objectName: `materials/${offering.code}/${file.fileName}`,
          fileSize: file.size,
          contentType: file.fileName.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          storagePath: `soes-bucket/materials/${offering.code}/${file.fileName}`,
          aiEnabled: file.fileName.endsWith('.pdf'),
          courseOfferingId: offering.id,
          uploaderId: teacher.id,
        },
      })
      total++
    }
  }

  console.log(`✓ Materials completed (${total} created)`)
}
