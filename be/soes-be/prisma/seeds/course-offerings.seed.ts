import { CourseOffering, PrismaClient, Subject, Teacher, Semester } from '@prisma/client'

interface CourseOfferingSeedInput {
  semesters: Semester[]
  subjects: Subject[]
  teachers: Teacher[]
}

const OFFERINGS = [
  { id: 'co-java-hk1',  code: 'JAVA101-HK1', subjectIdx: 0, teacherIdx: 0, semesterIdx: 0 },
  { id: 'co-sql-hk1',   code: 'SQL101-HK1',  subjectIdx: 1, teacherIdx: 1, semesterIdx: 0 },
  { id: 'co-react-hk1', code: 'REACT101-HK1',subjectIdx: 2, teacherIdx: 2, semesterIdx: 0 },
  { id: 'co-ai-hk1',    code: 'AI101-HK1',   subjectIdx: 3, teacherIdx: 3, semesterIdx: 0 },
  { id: 'co-cnpm-hk1',  code: 'CNPM101-HK1', subjectIdx: 4, teacherIdx: 4, semesterIdx: 0 },
]

export async function seedCourseOfferings(
  prisma: PrismaClient,
  { semesters, subjects, teachers }: CourseOfferingSeedInput,
): Promise<CourseOffering[]> {
  console.log('Seeding Course Offerings...')

  const offerings: CourseOffering[] = []

  for (const o of OFFERINGS) {
    const offering = await prisma.courseOffering.upsert({
      where: { code: o.code },
      update: {},
      create: {
        id: o.id,
        code: o.code,
        status: 'ACTIVE',
        maxCapacity: 50,
        semesterId: semesters[o.semesterIdx].id,
        subjectId: subjects[o.subjectIdx].id,
        teacherId: teachers[o.teacherIdx].id,
      },
    })
    offerings.push(offering)
  }

  console.log(`✓ Course Offerings completed (${offerings.length})`)
  return offerings
}
