import { z } from "zod";
import { geminiConfig } from "../../../lib/gemini";
import { generatedQuestionSchema } from "../schemas/generated-question.schema";

const id = z.string().trim().min(1);

export const aiMaterialsQuerySchema = z.object({ subjectId: id });

const uploadedSourceSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  storagePath: z.string().trim().min(1).max(1000),
  fileSize: z.number().int().positive(),
  contentType: z.string().trim().min(1).max(255),
  checksum: z.string().trim().length(64),
});

export const generateQuestionsSchema = z
  .object({
    subjectId: id,
    sourceType: z.enum(["COURSE_MATERIAL", "UPLOAD_FILE"]),
    mode: z.enum(["GENERATE_FROM_MATERIAL", "EXTRACT_EXISTING_EXAM"]),
    materialIds: z.array(id).max(10).default([]),
    sourceFiles: z.array(uploadedSourceSchema).max(5).default([]),
    prompt: z.string().trim().max(3000).default(""),
    questionCount: z
      .number()
      .int()
      .min(1)
      .max(geminiConfig.maxQuestions)
      .optional(),
    difficulty: z.enum(["AUTO", "EASY", "MEDIUM", "HARD"]).default("AUTO"),
  })
  .superRefine((data, ctx) => {
    const selectedCount =
      data.sourceType === "COURSE_MATERIAL"
        ? data.materialIds.length
        : data.sourceFiles.length;
    if (!selectedCount) {
      ctx.addIssue({
        code: "custom",
        path: [
          data.sourceType === "COURSE_MATERIAL" ? "materialIds" : "sourceFiles",
        ],
        message: "At least one source document is required",
      });
    }
    if (
      data.mode === "GENERATE_FROM_MATERIAL" &&
      data.questionCount === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["questionCount"],
        message: "questionCount is required when generating questions",
      });
    }
  });

export const saveGeneratedQuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        generationId: id,
        subjectId: id,
        question: generatedQuestionSchema,
      }),
    )
    .min(1)
    .max(geminiConfig.maxQuestions),
});

export type GenerateQuestionsBody = z.infer<typeof generateQuestionsSchema>;
export type SaveGeneratedQuestionsBody = z.infer<
  typeof saveGeneratedQuestionsSchema
>;
