import { z } from "zod";

const optionSchema = z.object({
  content: z.string().trim().min(1).max(1000),
  isCorrect: z.boolean(),
});

const testCaseSchema = z.object({
  input: z.string().max(20000),
  expectedOutput: z.string().max(20000),
  isHidden: z.boolean(),
});

export const generatedQuestionSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    content: z.string().trim().min(3).max(10000),
    explanation: z.string().trim().max(5000),
    type: z.enum([
      "SINGLE_CHOICE",
      "MULTIPLE_CHOICE",
      "TRUE_FALSE",
      "PROGRAMMING",
    ]),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
    difficultyReason: z.string().trim().min(3).max(1000),
    language: z.enum(["JAVA", "C", "CPP"]).nullable(),
    options: z.array(optionSchema).max(20),
    timeLimitMs: z.number().int().min(100).max(60000),
    memoryLimitMb: z.number().int().min(16).max(2048),
    maxCodeSizeKb: z.number().int().min(1).max(1024),
    testCases: z.array(testCaseSchema).max(100),
  })
  .superRefine((question, ctx) => {
    if (question.type === "PROGRAMMING") {
      if (!question.language) {
        ctx.addIssue({
          code: "custom",
          path: ["language"],
          message: "Programming language is required",
        });
      }
      if (!question.testCases.length) {
        ctx.addIssue({
          code: "custom",
          path: ["testCases"],
          message: "Programming test cases are required",
        });
      }
      if (!question.testCases.some((testCase) => !testCase.isHidden)) {
        ctx.addIssue({
          code: "custom",
          path: ["testCases"],
          message: "At least one public test case is required",
        });
      }
      if (question.options.length) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "Programming questions cannot have options",
        });
      }
      return;
    }

    if (question.testCases.length) {
      ctx.addIssue({
        code: "custom",
        path: ["testCases"],
        message: "Objective questions cannot have test cases",
      });
    }
    if (question.options.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "At least two options are required",
      });
    }
    const correctCount = question.options.filter(
      (option) => option.isCorrect,
    ).length;
    const validCorrectCount =
      question.type === "MULTIPLE_CHOICE"
        ? correctCount > 0
        : correctCount === 1;
    if (!validCorrectCount) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Invalid number of correct options",
      });
    }
    if (question.type === "TRUE_FALSE" && question.options.length !== 2) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "True/false requires exactly two options",
      });
    }
  });

export const generatedQuestionsSchema = z.object({
  questions: z.array(generatedQuestionSchema).min(1),
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;

export const generatedQuestionsJsonSchema = {
  type: "object",
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        required: [
          "title",
          "content",
          "explanation",
          "type",
          "difficulty",
          "difficultyReason",
          "language",
          "options",
          "timeLimitMs",
          "memoryLimitMb",
          "maxCodeSizeKb",
          "testCases",
        ],
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          explanation: { type: "string" },
          type: {
            type: "string",
            enum: [
              "SINGLE_CHOICE",
              "MULTIPLE_CHOICE",
              "TRUE_FALSE",
              "PROGRAMMING",
            ],
          },
          difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] },
          difficultyReason: { type: "string" },
          language: {
            anyOf: [
              { type: "string", enum: ["JAVA", "C", "CPP"] },
              { type: "null" },
            ],
          },
          options: {
            type: "array",
            items: {
              type: "object",
              required: ["content", "isCorrect"],
              properties: {
                content: { type: "string" },
                isCorrect: { type: "boolean" },
              },
            },
          },
          timeLimitMs: { type: "integer", minimum: 100, maximum: 60000 },
          memoryLimitMb: { type: "integer", minimum: 16, maximum: 2048 },
          maxCodeSizeKb: { type: "integer", minimum: 1, maximum: 1024 },
          testCases: {
            type: "array",
            items: {
              type: "object",
              required: ["input", "expectedOutput", "isHidden"],
              properties: {
                input: { type: "string" },
                expectedOutput: { type: "string" },
                isHidden: { type: "boolean" },
              },
            },
          },
        },
      },
    },
  },
} as const;
