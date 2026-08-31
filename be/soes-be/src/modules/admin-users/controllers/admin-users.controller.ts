import type { Request, Response } from 'express'
import { z } from 'zod'
import { sendSuccess as send } from '../../../utils/httpResponse'
import * as service from '../services/admin-users.service'
import { accountStatusSchema, createUserSchema, enrollmentBodySchema, enrollmentQuerySchema, resetPasswordSchema, updateUserSchema, usersQuerySchema } from '../validators/admin-users.validator'

const profileParams = z.object({ role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']), profileId: z.string().min(1) })
const enrollmentParams = z.object({ courseOfferingId: z.string().min(1), studentId: z.string().min(1).optional() })
export const listUsers = async (req: Request, res: Response) => send(res, await service.list(usersQuerySchema.parse(req.query)))
export const createUser = async (req: Request, res: Response) => send(res, await service.create(createUserSchema.parse(req.body)), 201)
export const updateUser = async (req: Request, res: Response) => {
  const params = profileParams.parse(req.params)
  send(res, await service.update(params.role, params.profileId, updateUserSchema.parse(req.body)))
}
export const setStatus = async (req: Request, res: Response) => {
  const params = profileParams.parse(req.params)
  send(res, await service.setStatus(params.role, params.profileId, accountStatusSchema.parse(req.body).status))
}
export const resetPassword = async (req: Request, res: Response) => {
  const params = profileParams.parse(req.params)
  send(res, await service.resetPassword(params.role, params.profileId, resetPasswordSchema.parse(req.body).password))
}
export const enroll = async (req: Request, res: Response) => {
  const { courseOfferingId } = enrollmentParams.parse(req.params)
  send(res, await service.enroll(courseOfferingId, enrollmentBodySchema.parse(req.body).studentIds), 201)
}
export const listEnrollments = async (req: Request, res: Response) => {
  const { courseOfferingId } = enrollmentParams.parse(req.params)
  send(res, await service.listEnrollments(courseOfferingId, enrollmentQuerySchema.parse(req.query)))
}
export const withdraw = async (req: Request, res: Response) => {
  const { courseOfferingId, studentId } = enrollmentParams.parse(req.params)
  send(res, await service.withdraw(courseOfferingId, studentId!))
}
