import { randomUUID } from "crypto";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../../errors/AppError";
import { geminiConfig } from "../../../lib/gemini";
import { logger } from "../../../lib/logger";
import { supabaseBuckets } from "../../../lib/supabase";
import { downloadBufferFromBucket } from "../../../services/storage.service";
import * as repo from "../repositories/ai-question-generation.repository";
import type { SourceDocument } from "./document-reader.service";
import { toGeminiContent } from "./document-reader.service";
import { generateWithGemini } from "./gemini-question.service";
import { buildGenerationPrompt } from "../prompts/question-generation.prompt";
import type {
  GenerateQuestionsBody,
  SaveGeneratedQuestionsBody,
} from "../validators/ai-question-generation.validator";

const supportedExtensions = /\.(pdf|docx|txt|png|jpe?g|webp)$/i;
const maxInlineBytes = 45 * 1024 * 1024;

async function requireSubject(teacherId: string, subjectId: string) {
  const teacher = await repo.findTeacherContext(teacherId);
  if (!teacher?.departmentId)
    throw new ForbiddenError("Teacher department is required");
  const subject = await repo.findSubjectForTeacher(
    subjectId,
    teacher.departmentId,
  );
  if (!subject)
    throw new ForbiddenError("Subject is outside teacher department");
  return subject;
}

export async function listMaterials(teacherId: string, subjectId: string) {
  await requireSubject(teacherId, subjectId);
  const materials = (
    await repo.listAvailableMaterials(teacherId, subjectId)
  ).filter((material) => supportedExtensions.test(material.fileName));
  const checksumCounts = new Map<string, number>();
  materials.forEach((material) => {
    if (material.checksum) {
      checksumCounts.set(
        material.checksum,
        (checksumCounts.get(material.checksum) ?? 0) + 1,
      );
    }
  });
  return materials.map((material) => ({
    id: material.id,
    title: material.title,
    fileName: material.fileName,
    fileSize: material.fileSize,
    contentType: material.contentType,
    checksum: material.checksum,
    courseOfferingId: material.courseOffering.id,
    courseCode: material.courseOffering.code,
    duplicated: Boolean(
      material.checksum && (checksumCounts.get(material.checksum) ?? 0) > 1,
    ),
  }));
}

export async function listHistories(teacherId: string) {
  const histories = await repo.listHistories(teacherId);
  return histories.map((history) => {
    const uploadedNames = Array.isArray(history.sourceFiles)
      ? history.sourceFiles.flatMap((file) => {
          if (!file || typeof file !== "object" || Array.isArray(file))
            return [];
          const fileName = (file as Record<string, unknown>).fileName;
          return typeof fileName === "string" ? [fileName] : [];
        })
      : history.sourceFileName
        ? [history.sourceFileName]
        : [];
    const materialNames = history.materials.map(
      ({ material }) => material.title?.trim() || material.fileName,
    );
    return {
      id: history.id,
      subject: history.subject,
      courseOffering: history.courseOffering,
      prompt: history.prompt,
      aiModel: history.aiModel,
      mode: history.mode,
      sourceType: history.sourceType,
      sourceNames:
        history.sourceType === "COURSE_MATERIAL"
          ? materialNames
          : uploadedNames,
      questionCount: history.questionCount,
      approvedCount: history.questions.length,
      status: history.status,
      errorMessage: history.errorMessage,
      createdAt: history.createdAt,
      completedAt: history.completedAt,
    };
  });
}

async function courseMaterialDocuments(
  teacherId: string,
  input: GenerateQuestionsBody,
) {
  const requestedIds = [...new Set(input.materialIds)];
  const materials = await repo.findSelectedMaterials(
    teacherId,
    input.subjectId,
    requestedIds,
  );
  if (materials.length !== requestedIds.length) {
    throw new NotFoundError(
      "One or more selected course materials are unavailable",
    );
  }

  const uniqueMaterials = materials.filter(
    (material, index, all) =>
      all.findIndex((candidate) =>
        material.checksum
          ? candidate.checksum === material.checksum
          : candidate.storagePath === material.storagePath,
      ) === index,
  );
  const documents = await Promise.all(
    uniqueMaterials.map(
      async (material): Promise<SourceDocument> => ({
        fileName: material.fileName,
        contentType: material.contentType,
        buffer: await downloadBufferFromBucket(
          supabaseBuckets.courseMaterials,
          material.storagePath,
        ),
      }),
    ),
  );
  return {
    documents,
    materialIds: uniqueMaterials.map((material) => material.id),
    sourceNames: uniqueMaterials.map(
      (material) => material.title?.trim() || material.fileName,
    ),
  };
}

async function uploadedDocuments(
  teacherId: string,
  input: GenerateQuestionsBody,
) {
  const expectedPrefix = `teachers/${teacherId}/subjects/${input.subjectId}/ai-source-files/`;
  if (
    input.sourceFiles.some(
      (file) => !file.storagePath.startsWith(expectedPrefix),
    )
  ) {
    throw new ForbiddenError(
      "AI source file path is not owned by the current teacher",
    );
  }
  const documents = await Promise.all(
    input.sourceFiles.map(
      async (file): Promise<SourceDocument> => ({
        fileName: file.fileName,
        contentType: file.contentType,
        buffer: await downloadBufferFromBucket(
          supabaseBuckets.aiSourceFiles,
          file.storagePath,
        ),
      }),
    ),
  );
  return {
    documents,
    materialIds: [] as string[],
    sourceNames: input.sourceFiles.map((file) => file.fileName),
  };
}

export async function generate(
  teacherId: string,
  input: GenerateQuestionsBody,
) {
  const subject = await requireSubject(teacherId, input.subjectId);
  const sources =
    input.sourceType === "COURSE_MATERIAL"
      ? await courseMaterialDocuments(teacherId, input)
      : await uploadedDocuments(teacherId, input);
  const totalBytes = sources.documents.reduce(
    (sum, document) => sum + document.buffer.length,
    0,
  );
  if (totalBytes > maxInlineBytes) {
    throw new ValidationError(
      "Total AI source size must not exceed 45 MB per request",
    );
  }
  const history = await repo.createHistory(
    teacherId,
    input,
    geminiConfig.model,
    sources.materialIds,
  );

  try {
    const contents = await Promise.all(sources.documents.map(toGeminiContent));
    const prompt = buildGenerationPrompt(
      input,
      subject.name,
      sources.sourceNames,
    );
    const questions = await generateWithGemini(
      contents,
      prompt,
      input.mode === "EXTRACT_EXISTING_EXAM",
      input.questionCount ?? geminiConfig.maxQuestions,
    );
    if (
      input.mode === "GENERATE_FROM_MATERIAL" &&
      questions.length !== input.questionCount
    ) {
      throw new ValidationError(
        `Gemini returned ${questions.length} questions instead of the requested ${input.questionCount}`,
      );
    }
    await repo.completeHistory(history.id, questions.length);
    const sourceMaterialName = sources.sourceNames.join(", ");
    return {
      historyId: history.id,
      questions: questions.map((question) => ({
        ...question,
        id: randomUUID(),
        status: "PENDING_REVIEW" as const,
        subjectId: input.subjectId,
        subjectName: subject.name,
        sourceMaterialName,
      })),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown AI generation error";
    await repo.failHistory(history.id, message);
    logger.error("AI question generation failed", {
      historyId: history.id,
      error: message,
    });
    throw error;
  }
}

export async function saveApproved(
  teacherId: string,
  input: SaveGeneratedQuestionsBody,
) {
  const generationIds = [
    ...new Set(input.questions.map((item) => item.generationId)),
  ];
  const histories = await repo.findOwnedCompletedHistories(
    teacherId,
    generationIds,
  );
  if (histories.length !== generationIds.length) {
    throw new NotFoundError(
      "One or more AI generation histories are unavailable",
    );
  }
  const subjectsByHistory = new Map(
    histories.map((history) => [history.id, history.subjectId]),
  );
  if (
    input.questions.some(
      (item) => subjectsByHistory.get(item.generationId) !== item.subjectId,
    )
  ) {
    throw new ValidationError(
      "Generated question subject does not match its AI history",
    );
  }
  const saved = await repo.saveApprovedQuestions(teacherId, input);
  return {
    count: saved.length,
    questionIds: saved.map((question) => question.id),
  };
}
