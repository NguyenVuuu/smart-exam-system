import type { Request, Response } from 'express'
import { sendSuccess as send } from '../../../utils/httpResponse'
import * as service from '../services/admin-content.service'
import { examTrackingQuerySchema, itemParamSchema, questionBankQuerySchema, removalSchema } from '../validators/admin-content.validator'

export const listQuestionBank = async (req: Request, res: Response) =>
  send(res, await service.listQuestionBank(questionBankQuerySchema.parse(req.query)))
export const getQuestionBankItem = async (req: Request, res: Response) =>
  send(res, await service.getQuestionBankItem(itemParamSchema.parse(req.params).id))
export const removeQuestion = async (req: Request, res: Response) =>
  send(res, await service.removeQuestion(req.user!.id, itemParamSchema.parse(req.params).id, removalSchema.parse(req.body).reason))
export const restoreQuestion = async (req: Request, res: Response) =>
  send(res, await service.restoreQuestion(req.user!.id, itemParamSchema.parse(req.params).id))
export const listExams = async (req: Request, res: Response) =>
  send(res, await service.listExams(examTrackingQuerySchema.parse(req.query)))
