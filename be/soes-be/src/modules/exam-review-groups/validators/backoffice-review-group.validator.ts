import { z } from 'zod'

export const groupIdParams = z.object({ id: z.string().uuid() })
export const memberIdParams = groupIdParams.extend({ teacherId: z.string().uuid() })
const reason = z.string().trim().min(5).max(1000)
export const createGroupBody = z.object({ departmentId: z.string().trim().min(1).max(100), name: z.string().trim().min(3).max(120), reason }).strict()
export const renameGroupBody = z.object({ name: z.string().trim().min(3).max(120), reason }).strict()
export const setGroupStatusBody = z.object({ status: z.enum(['ACTIVE', 'INACTIVE']), reason }).strict()
export const supportReasonBody = z.object({ reason }).strict()
