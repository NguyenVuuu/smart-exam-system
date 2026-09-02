import type { Request, Response } from 'express'
import { z } from 'zod'
import { sendSuccess as send } from '../../../utils/httpResponse'
import * as service from '../services/teacher-questions.service'
import { approvalQuerySchema, questionBodySchema, questionsQuerySchema, rejectionSchema, removalSchema } from '../validators/teacher-questions.validator'

const idParam = z.object({ id: z.string().min(1) })
const uploadedFiles = (req: Request) => (req.files as Express.Multer.File[] | undefined) ?? []
const uploadedFile = (req: Request) => req.file as Express.Multer.File | undefined
const aiSourceBodySchema = z.object({ subjectId: z.string().min(1) })

export const uploadQuestionImage = async (req: Request, res: Response) => send(
  res,
  await service.uploadQuestionImage(req.user!.profileId, uploadedFile(req)),
  201,
)

export const uploadAiSourceFiles = async (req: Request, res: Response) => send(
  res,
  await service.uploadAiSourceFiles(req.user!.profileId, aiSourceBodySchema.parse(req.body).subjectId, uploadedFiles(req)),
  201,
)
export const listQuestions = async (req: Request, res: Response) => send(res, await service.list(req.user!.profileId, questionsQuerySchema.parse(req.query)))
export const listSubjects = async (req: Request, res: Response) => send(res, await service.listSubjects(req.user!.profileId))
export const createQuestion = async (req: Request, res: Response) => send(res, await service.create(req.user!.profileId, questionBodySchema.parse(req.body)), 201)
export const updateQuestion = async (req: Request, res: Response) => send(res, await service.update(req.user!.profileId, idParam.parse(req.params).id, questionBodySchema.parse(req.body)))
export const shareQuestion = async (req: Request, res: Response) => send(res, await service.share(req.user!.profileId, idParam.parse(req.params).id))
export const archiveQuestion = async (req: Request, res: Response) => send(res, await service.archive(req.user!.profileId, idParam.parse(req.params).id, true))
export const restoreQuestion = async (req: Request, res: Response) => send(res, await service.archive(req.user!.profileId, idParam.parse(req.params).id, false))
export const listApprovals = async (req: Request, res: Response) => send(res, await service.listApprovals(req.user!.profileId, approvalQuerySchema.parse(req.query)))
export const approve = async (req: Request, res: Response) => send(res, await service.approve(req.user!.profileId, idParam.parse(req.params).id))
export const reject = async (req: Request, res: Response) => send(res, await service.reject(req.user!.profileId, idParam.parse(req.params).id, rejectionSchema.parse(req.body).reason))
export const remove = async (req: Request, res: Response) => send(res, await service.remove(
  req.user!.profileId,
  idParam.parse(req.params).id,
  removalSchema.parse(req.body).reason,
))
