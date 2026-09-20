import type { Request, Response } from "express";
import { sendSuccess as send } from "../../../utils/httpResponse";
import * as service from "../services/ai-question-generation.service";
import { emitTeacherEvent } from '../../proctoring/proctoring-realtime.events';
import type { GenerationProgress } from '../services/generation-progress';
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

export const generate = async (req: Request, res: Response) => {
  const input = generateQuestionsSchema.parse(req.body);
  const startedAt = Date.now();
  const report = (progress: GenerationProgress) => {
    if (input.requestId) emitTeacherEvent(req.user!.profileId, 'ai:generation-progress', {
      ...progress, requestId: input.requestId, elapsedMs: Date.now() - startedAt,
    });
  };
  try {
    send(res, await service.generate(req.user!.profileId, input, report), 201);
  } catch (error) {
    report({ stage: 'FAILED' });
    throw error;
  }
};

export const saveApproved = async (req: Request, res: Response) =>
  send(
    res,
    await service.saveApproved(
      req.user!.profileId,
      saveGeneratedQuestionsSchema.parse(req.body),
    ),
    201,
  );
