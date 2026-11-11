import type { Request, Response } from 'express'
import { z } from 'zod'
import { ForbiddenError } from '../../../errors/AppError'
import { sendSuccess as send } from '../../../utils/httpResponse'
import * as service from '../services/admin-users.service'
import { accountStatusSchema, addUserRoleParamsSchema, addUserRoleSchema, createUserSchema, enrollmentBodySchema, enrollmentQuerySchema, resetPasswordSchema, updateUserSchema, usersQuerySchema } from '../validators/admin-users.validator'
import * as faceService from '../services/admin-users.face.service'

const profileParams = z.object({ role: z.enum(['ADMIN', 'EDUCATION_OFFICER', 'TEACHER', 'STUDENT']), profileId: z.string().min(1) })
const enrollmentParams = z.object({ courseOfferingId: z.string().min(1), studentId: z.string().min(1).optional() })
function requireAdminForAdminAccount(req: Request, role: string) {
  if (role === 'ADMIN' && req.user?.role !== 'ADMIN') {
    throw new ForbiddenError('Only administrators can manage administrator accounts')
  }
}

export const getNextCode = async (_req: Request, res: Response) => {
  send(res, await service.getNextCode())
}
export const listUsers = async (req: Request, res: Response) => {
  send(res, await service.list(usersQuerySchema.parse(req.query)))
}
export const listReferences = async (req: Request, res: Response) => {
  const query = usersQuerySchema.parse(req.query)
  const canViewStudents = req.backofficePermissions?.includes('ACADEMIC_VIEW') ?? false
  if (query.status !== 'ACTIVE' || (query.role !== 'TEACHER' && !(canViewStudents && query.role === 'STUDENT'))) {
    throw new ForbiddenError('Only authorized active teacher/student references can be listed')
  }
  const page = await service.list(query)
  send(res, {
    ...page,
    items: page.items.map((item) => ({ ...item, email: null, phoneNumber: null, avatarUrl: null, faceEnrollment: null })),
  })
}
export const createUser = async (req: Request, res: Response) => {
  const body = createUserSchema.parse(req.body)
  if ((body.roles ?? [body.role]).includes('ADMIN')) requireAdminForAdminAccount(req, 'ADMIN')
  send(res, await service.create(body), 201)
}
export const addUserRole = async (req: Request, res: Response) => {
  const { userId } = addUserRoleParamsSchema.parse(req.params)
  const body = addUserRoleSchema.parse(req.body)
  send(res, await service.addRole(userId, body, req.user!.role), 201)
}
export const updateUser = async (req: Request, res: Response) => {
  const params = profileParams.parse(req.params)
  requireAdminForAdminAccount(req, params.role)
  send(res, await service.update(params.role, params.profileId, updateUserSchema.parse(req.body), req.user!.role))
}
export const setStatus = async (req: Request, res: Response) => {
  const params = profileParams.parse(req.params)
  requireAdminForAdminAccount(req, params.role)
  send(res, await service.setStatus(params.role, params.profileId, accountStatusSchema.parse(req.body).status, req.user!.role))
}
export const resetPassword = async (req: Request, res: Response) => {
  const params = profileParams.parse(req.params)
  requireAdminForAdminAccount(req, params.role)
  send(res, await service.resetPassword(params.role, params.profileId, resetPasswordSchema.parse(req.body).password, req.user!.role))
}
const studentFaceParams = z.object({ studentId: z.string().uuid() })
const revokeFaceSchema = z.object({ reason: z.string().trim().min(10).max(500) })
function requireFaceAdmin(req: Request) {
  if (req.user?.role !== 'ADMIN') throw new ForbiddenError('Only administrators can manage enrolled faces')
}
export const faceImage = async (req: Request, res: Response) => {
  requireFaceAdmin(req)
  const { studentId } = studentFaceParams.parse(req.params)
  const image = await faceService.getEnrollmentImage(studentId, req.user!.id)
  res.setHeader('Cache-Control', 'private, no-store, max-age=0')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.type(image.mimeType).send(image.bytes)
}
export const revokeFace = async (req: Request, res: Response) => {
  requireFaceAdmin(req)
  const { studentId } = studentFaceParams.parse(req.params)
  const { reason } = revokeFaceSchema.parse(req.body)
  send(res, await faceService.revokeEnrollment(studentId, req.user!.id, reason))
}
export const enroll = async (req: Request, res: Response) => {
  const { courseOfferingId } = enrollmentParams.parse(req.params)
  send(res, await service.enroll(courseOfferingId, enrollmentBodySchema.parse(req.body).studentIds), 201)
}
export const listEnrollments = async (req: Request, res: Response) => {
  const { courseOfferingId } = enrollmentParams.parse(req.params)
  send(res, await service.listEnrollments(courseOfferingId, enrollmentQuerySchema.parse(req.query)))
}
export const listEligibleStudents = async (req: Request, res: Response) => {
  const { courseOfferingId } = enrollmentParams.parse(req.params)
  send(res, await service.listEligibleStudents(courseOfferingId, enrollmentQuerySchema.parse(req.query)))
}
export const withdraw = async (req: Request, res: Response) => {
  const { courseOfferingId, studentId } = enrollmentParams.parse(req.params)
  send(res, await service.withdraw(courseOfferingId, studentId!))
}
