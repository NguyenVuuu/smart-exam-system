import { PrismaClient } from '@prisma/client'
import { seedSettings } from './seeds/settings.seed'
import { seedSemesters } from './seeds/semesters.seed'
import { seedSubjects } from './seeds/subjects.seed'
import { seedAdmins } from './seeds/admins.seed'
import { seedTeachers } from './seeds/teachers.seed'
import { seedStudents } from './seeds/students.seed'
import { seedCourseOfferings } from './seeds/course-offerings.seed'
import { seedEnrollments } from './seeds/enrollments.seed'
import { seedMaterials } from './seeds/materials.seed'
import { seedQuestions } from './seeds/questions.seed'
import { seedExams } from './seeds/exams.seed'
import { seedExamAttempts } from './seeds/exam-attempts.seed'
import { seedExamAttemptQuestions } from './seeds/exam-attempt-questions.seed'
import { seedStudentAnswers } from './seeds/student-answers.seed'
import { seedNotifications } from './seeds/notifications.seed'
import { seedPosts } from './seeds/posts.seed'
import { seedViolations } from './seeds/violations.seed'
import { seedAuditLogs } from './seeds/audit-logs.seed'
import { seedExamSessions } from './seeds/exam-sessions.seed'
import { seedAIGenerationHistories } from './seeds/ai-generations.seed'
import { seedAIGenerationMaterials } from './seeds/ai-generation-materials.seed'
import { seedProgrammingTestCases } from './seeds/programming-test-cases.seed'
import { seedProgrammingQuestionConfigs } from './seeds/programming-question-configs.seed'
import { seedProgrammingSubmissions } from './seeds/programming-submissions.seed'

const prisma = new PrismaClient()

async function main() {
  console.log('\n🌱 Starting SOES seed...\n')

  await seedSettings(prisma)

  const semesters = await seedSemesters(prisma)
  const subjects  = await seedSubjects(prisma)

  await seedAdmins(prisma)
  const teachers  = await seedTeachers(prisma)
  const students  = await seedStudents(prisma)

  const courseOfferings = await seedCourseOfferings(prisma, { semesters, subjects, teachers })

  await seedEnrollments(prisma, { courseOfferings, students })
  await seedMaterials(prisma, { courseOfferings, teachers })
  await seedPosts(prisma, { courseOfferings, teachers })

  const questions = await seedQuestions(prisma, { subjects, teachers })

  await seedExams(prisma, { courseOfferings, subjects, teachers, questions })

  // Transaction data — must run after exams
  await seedExamAttempts(prisma)
  await seedExamAttemptQuestions(prisma)
  await seedStudentAnswers(prisma)
  await seedExamSessions(prisma)
  await seedViolations(prisma)

  await seedNotifications(prisma)

  // Get all users for audit logs
  const allUsers = await prisma.user.findMany()
  await seedAuditLogs(prisma, { users: allUsers })

  // New seed data for AIGeneration and Programming
  const aiHistories = await seedAIGenerationHistories(prisma, { courseOfferings, teachers })
  const allMaterials = await prisma.material.findMany()
  await seedAIGenerationMaterials(prisma, { histories: aiHistories, materials: allMaterials })
  
  const allExamQuestions = await prisma.examQuestion.findMany()
  await seedProgrammingTestCases(prisma, { examQuestions: allExamQuestions })
  await seedProgrammingQuestionConfigs(prisma, { examQuestions: allExamQuestions })
  await seedProgrammingSubmissions(prisma, { attempts: await prisma.examAttempt.findMany(), examQuestions: allExamQuestions })

  console.log('\n✅ SOES seed completed successfully!\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
