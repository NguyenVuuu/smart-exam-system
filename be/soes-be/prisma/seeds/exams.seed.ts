import { CourseOffering, Exam, PrismaClient, Question, Subject, Teacher } from '@prisma/client'

interface ExamSeedInput {
  courseOfferings: CourseOffering[]
  subjects: Subject[]
  teachers: Teacher[]
  questions: Question[]
}

type ExamTemplate = {
  titleSuffix: string
  durationMinutes: number
  startOffset: number  // days from now
  endOffset: number
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
}

const EXAM_TEMPLATES: ExamTemplate[] = [
  { titleSuffix: 'Thường kỳ',  durationMinutes: 45,  startOffset: -30, endOffset: -29, status: 'CLOSED'    },
  { titleSuffix: 'Giữa kỳ',   durationMinutes: 60,  startOffset: 16,  endOffset: 17,  status: 'PUBLISHED'  },
  { titleSuffix: 'Cuối kỳ',   durationMinutes: 90,  startOffset: 60,  endOffset: 61,  status: 'DRAFT'      },
]

function offsetDate(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

export async function seedExams(
  prisma: PrismaClient,
  { courseOfferings, subjects, teachers, questions }: ExamSeedInput,
): Promise<Exam[]> {
  console.log('Seeding Exams...')

  const allExams: Exam[] = []

  for (let i = 0; i < courseOfferings.length; i++) {
    const offering = courseOfferings[i]
    const teacher = teachers[i] ?? teachers[0]
    const subject = subjects[i] ?? subjects[0]

    // Questions belonging to this subject
    const subjectQuestions = questions.filter((q) => q.subjectId === subject.id)
    const examQuestions = subjectQuestions.slice(0, 5) // use first 5 per exam

    for (const tmpl of EXAM_TEMPLATES) {
      const title = `${subject.name} - ${tmpl.titleSuffix}`

      const existing = await prisma.exam.findFirst({
        where: { title, courseOfferingId: offering.id },
      })
      if (existing) { allExams.push(existing); continue }

      const startTime = offsetDate(tmpl.startOffset)
      const endTime = offsetDate(tmpl.endOffset)

      const exam = await prisma.exam.create({
        data: {
          title,
          description: `Bài thi ${tmpl.titleSuffix} môn ${subject.name}`,
          startTime,
          endTime,
          durationMinutes: tmpl.durationMinutes,
          maxAttempts: 1,
          shuffleQuestions: true,
          shuffleOptions: true,
          showResultImmediately: tmpl.status === 'CLOSED',
          status: tmpl.status,
          courseOfferingId: offering.id,
          createdById: teacher.id,
          examQuestions: {
            create: examQuestions.map((q) => ({
              questionId: q.id,
              points: '2.00',
            })),
          },
        },
      })
      allExams.push(exam)
    }
  }

  console.log(`✓ Exams completed (${allExams.length})`)
  return allExams
}
