import type { ExamStudentVisibility } from '@prisma/client'
import { ConflictError } from '../../../errors/AppError'
import { toTeacherExamDto } from '../mappers/teacher-exam.mapper'
import * as lifecycleRepo from '../repositories/teacher-exam-lifecycle.repository'
import * as examRepo from '../repositories/teacher-exams.repository'

export async function lockDistribution(teacherId: string, userId: string, examId: string) {
  const result = await lifecycleRepo.setDistributionLock(examId, teacherId, userId, true)
  if (result.blocked) throw new ConflictError('Create at least one exam schedule before locking distribution')
  if (!result.changed) throw new ConflictError('Only a published regular exam can be locked')
  return toTeacherExamDto((await examRepo.findExam(examId))!, teacherId)
}

export async function unlockDistribution(teacherId: string, userId: string, examId: string) {
  const result = await lifecycleRepo.setDistributionLock(examId, teacherId, userId, false)
  if (result.blocked) {
    throw new ConflictError('Exam distribution cannot be reopened after a schedule starts or an attempt exists')
  }
  if (!result.changed) throw new ConflictError('Only a locked regular exam can be reopened')
  return toTeacherExamDto((await examRepo.findExam(examId))!, teacherId)
}

export async function updateStudentVisibility(
  teacherId: string,
  userId: string,
  examId: string,
  visibility: ExamStudentVisibility,
) {
  const changed = await lifecycleRepo.setStudentVisibility(examId, teacherId, userId, visibility)
  if (!changed) {
    throw new ConflictError('Only published or locked regular exams can change student visibility')
  }
  return toTeacherExamDto((await examRepo.findExam(examId))!, teacherId)
}
