import { CourseOffering, PrismaClient, Student } from '@prisma/client'

interface EnrollmentSeedInput {
  courseOfferings: CourseOffering[]
  students: Student[]
}

export async function seedEnrollments(
  prisma: PrismaClient,
  { courseOfferings, students }: EnrollmentSeedInput,
): Promise<void> {
  console.log('Seeding Enrollments...')

  let total = 0

  for (const offering of courseOfferings) {
    // Assign 10–15 students per offering, cycling through the student pool
    const count = Math.min(15, students.length)
    const assigned = students.slice(0, count)

    for (const student of assigned) {
      const existing = await prisma.enrollment.findUnique({
        where: { courseOfferingId_studentId: { courseOfferingId: offering.id, studentId: student.id } },
      })
      if (existing) continue

      await prisma.enrollment.create({
        data: {
          courseOfferingId: offering.id,
          studentId: student.id,
          subjectId: offering.subjectId,
          semesterId: offering.semesterId,
        },
      })
      total++
    }
  }

  console.log(`✓ Enrollments completed (${total} created)`)
}
