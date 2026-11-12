import type { Request, Response } from 'express'
import { sendSuccess as send } from '../../../utils/httpResponse'
import { askStudent, askTeacher } from '../services/ai-agent.service'
import { suggestExamMatrix } from '../services/exam-matrix.service'
import { askAgentSchema, createPracticeSchema, examMatrixRequestSchema, practiceParamSchema, scheduleParamSchema, submitPracticeSchema } from '../validators/ai-agent.validator'
import { getStudentMaterials } from '../services/student-material.service'
import { createStudentPractice, getStudentPractice, listStudentPractice, submitStudentPractice } from '../services/student-practice.service'

export const studentAsk = async (req: Request, res: Response) => {
  const { message, materialId } = askAgentSchema.parse(req.body)
  return send(res, await askStudent(req.user!.profileId, message, materialId))
}

export const studentMaterials = async (req: Request, res: Response) =>
  send(res, await getStudentMaterials(req.user!.profileId))

export const studentPracticeCreate = async (req: Request, res: Response) =>
  send(res, await createStudentPractice(req.user!.profileId, createPracticeSchema.parse(req.body)))

export const studentPracticeList = async (req: Request, res: Response) =>
  send(res, await listStudentPractice(req.user!.profileId))

export const studentPracticeGet = async (req: Request, res: Response) =>
  send(res, await getStudentPractice(req.user!.profileId, practiceParamSchema.parse(req.params).practiceSetId))

export const studentPracticeSubmit = async (req: Request, res: Response) =>
  send(res, await submitStudentPractice(req.user!.profileId,
    practiceParamSchema.parse(req.params).practiceSetId, submitPracticeSchema.parse(req.body)))

export const teacherAsk = async (req: Request, res: Response) => send(
  res, await askTeacher(
    req.user!.profileId,
    scheduleParamSchema.parse(req.params).scheduleId,
    askAgentSchema.parse(req.body).message,
  ),
)

export const teacherExamMatrix = async (req: Request, res: Response) => send(
  res, await suggestExamMatrix(req.user!.profileId, examMatrixRequestSchema.parse(req.body)),
)
