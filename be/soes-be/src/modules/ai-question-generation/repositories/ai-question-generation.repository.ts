import type { Prisma } from "@prisma/client";
import prisma from "../../../lib/prisma";
import type { GeneratedQuestion } from "../schemas/generated-question.schema";
import type {
  GenerateQuestionsBody,
  SaveGeneratedQuestionsBody,
} from "../validators/ai-question-generation.validator";

export const findTeacherContext = (teacherId: string) =>
  prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true, departmentId: true },
  });

export const findSubjectForTeacher = (
  subjectId: string,
  departmentId: string,
) =>
  prisma.subject.findFirst({
    where: { id: subjectId, departmentId, status: "ACTIVE" },
    select: { id: true, name: true },
  });

export const listAvailableMaterials = (teacherId: string, subjectId: string) =>
  prisma.material.findMany({
    where: {
      aiEnabled: true,
      storageProvider: "SUPABASE",
      courseOffering: { teacherId, subjectId },
    },
    select: {
      id: true,
      title: true,
      fileName: true,
      fileSize: true,
      contentType: true,
      storagePath: true,
      checksum: true,
      courseOffering: { select: { id: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
  });

export const findSelectedMaterials = (
  teacherId: string,
  subjectId: string,
  materialIds: string[],
) =>
  prisma.material.findMany({
    where: {
      id: { in: materialIds },
      aiEnabled: true,
      storageProvider: "SUPABASE",
      courseOffering: { teacherId, subjectId },
    },
    select: {
      id: true,
      title: true,
      fileName: true,
      fileSize: true,
      contentType: true,
      storagePath: true,
      checksum: true,
    },
  });

export function createHistory(
  teacherId: string,
  input: GenerateQuestionsBody,
  model: string,
  materialIds: string[],
) {
  const firstFile = input.sourceFiles[0];
  return prisma.aIGenerationHistory.create({
    data: {
      teacherId,
      subjectId: input.subjectId,
      prompt: input.prompt,
      aiModel: model,
      mode: input.mode,
      sourceType: input.sourceType,
      sourceFileName: firstFile?.fileName,
      sourceFilePath: firstFile?.storagePath,
      sourceFileSize: firstFile?.fileSize,
      sourceMimeType: firstFile?.contentType,
      sourceFiles: input.sourceFiles as Prisma.InputJsonValue,
      questionCount: input.questionCount ?? 0,
      status: "PROCESSING",
      materials: {
        create: materialIds.map((materialId) => ({ materialId })),
      },
    },
    select: { id: true },
  });
}

export const completeHistory = (id: string, questionCount: number) =>
  prisma.aIGenerationHistory.update({
    where: { id },
    data: {
      status: "COMPLETED",
      questionCount,
      completedAt: new Date(),
      errorMessage: null,
    },
  });

export const failHistory = (id: string, errorMessage: string) =>
  prisma.aIGenerationHistory.update({
    where: { id },
    data: {
      status: "FAILED",
      completedAt: new Date(),
      errorMessage: errorMessage.slice(0, 2000),
    },
  });

export const findOwnedCompletedHistories = (teacherId: string, ids: string[]) =>
  prisma.aIGenerationHistory.findMany({
    where: { id: { in: ids }, teacherId, status: "COMPLETED" },
    select: { id: true, subjectId: true },
  });

export const listHistories = (teacherId: string) =>
  prisma.aIGenerationHistory.findMany({
    where: { teacherId },
    select: {
      id: true,
      prompt: true,
      aiModel: true,
      mode: true,
      sourceType: true,
      sourceFileName: true,
      sourceFiles: true,
      questionCount: true,
      status: true,
      errorMessage: true,
      createdAt: true,
      completedAt: true,
      subject: { select: { id: true, code: true, name: true } },
      courseOffering: { select: { id: true, code: true } },
      materials: {
        select: { material: { select: { title: true, fileName: true } } },
      },
      questions: {
        where: { aiReviewStatus: "APPROVED" },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

function questionCreateData(
  teacherId: string,
  generationId: string,
  subjectId: string,
  question: GeneratedQuestion,
): Prisma.QuestionCreateInput {
  const programming = question.type === "PROGRAMMING";
  return {
    owner: { connect: { id: teacherId } },
    subject: { connect: { id: subjectId } },
    aiGeneration: { connect: { id: generationId } },
    source: "AI_GENERATED",
    aiReviewStatus: "APPROVED",
    title: question.title,
    content: programming ? question.content : question.title,
    explanation: question.explanation || null,
    type: question.type,
    difficulty: question.difficulty,
    aiDifficultyReason: question.difficultyReason,
    language: programming ? question.language : null,
    options: {
      create: question.options.map((option, orderIndex) => ({
        ...option,
        orderIndex,
      })),
    },
    ...(programming && {
      programmingConfig: {
        create: {
          timeLimitMs: question.timeLimitMs,
          memoryLimitKb: question.memoryLimitMb * 1024,
          maxCodeSizeKb: question.maxCodeSizeKb,
        },
      },
      programmingTests: {
        create: question.testCases.map((test, index) => ({
          ...test,
          isSample: !test.isHidden,
          orderIndex: index + 1,
        })),
      },
    }),
  };
}

export function saveApprovedQuestions(
  teacherId: string,
  input: SaveGeneratedQuestionsBody,
) {
  return prisma.$transaction(
    input.questions.map(({ generationId, subjectId, question }) =>
      prisma.question.create({
        data: questionCreateData(teacherId, generationId, subjectId, question),
        select: { id: true },
      }),
    ),
  );
}
