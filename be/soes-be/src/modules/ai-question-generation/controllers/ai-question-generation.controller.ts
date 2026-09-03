import type { Request, Response } from "express";
import { sendSuccess as send } from "../../../utils/httpResponse";
import * as service from "../services/ai-question-generation.service";
import {
  aiMaterialsQuerySchema,
  generateQuestionsSchema,
  saveGeneratedQuestionsSchema,
} from "../validators/ai-question-generation.validator";

export const listMaterials = async (req: Request, res: Response) =>
  send(
    res,
    await service.listMaterials(
      req.user!.profileId,
      aiMaterialsQuerySchema.parse(req.query).subjectId,
    ),
  );

export const listHistories = async (req: Request, res: Response) =>
  send(res, await service.listHistories(req.user!.profileId));

export const generate = async (req: Request, res: Response) =>
  send(
    res,
    await service.generate(
      req.user!.profileId,
      generateQuestionsSchema.parse(req.body),
    ),
    201,
  );

export const saveApproved = async (req: Request, res: Response) =>
  send(
    res,
    await service.saveApproved(
      req.user!.profileId,
      saveGeneratedQuestionsSchema.parse(req.body),
    ),
    201,
  );
