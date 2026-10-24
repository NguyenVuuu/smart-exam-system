import type { Request, Response } from 'express'
import { z } from 'zod'
import { sendSuccess } from '../../../utils/httpResponse'
import * as service from '../services/backoffice-review-group.service'

const idParams = z.object({ id: z.string().uuid() })

export const list = async (_req: Request, res: Response) => sendSuccess(res, await service.list())
export const get = async (req: Request, res: Response) => sendSuccess(res, await service.get(idParams.parse(req.params).id))
