import type { Request, Response } from "express";
import { z } from "zod";
import { sendSuccess as send } from "../../../utils/httpResponse";
import * as service from "../services/exam-schedule.service";
import {
  cancellationSchema,
  scheduleBodySchema,
  schedulesQuerySchema,
} from "../validators/exam-schedule.validator";

const idParam = z.object({ id: z.string().min(1) });
export const list = async (req: Request, res: Response) =>
  send(res, await service.list(schedulesQuerySchema.parse(req.query)));
export const get = async (req: Request, res: Response) =>
  send(res, await service.get(idParam.parse(req.params).id));
export const listReadyExams = async (_req: Request, res: Response) =>
  send(res, await service.listReadyExams());
export const create = async (req: Request, res: Response) =>
  send(
    res,
    await service.create(req.user!.id, scheduleBodySchema.parse(req.body)),
    201,
  );
export const update = async (req: Request, res: Response) =>
  send(
    res,
    await service.update(
      idParam.parse(req.params).id,
      scheduleBodySchema.parse(req.body),
    ),
  );
export const cancel = async (req: Request, res: Response) =>
  send(
    res,
    await service.cancel(
      idParam.parse(req.params).id,
      cancellationSchema.parse(req.body).reason,
    ),
  );
