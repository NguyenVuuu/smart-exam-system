import { AppError, ValidationError } from "../../../errors/AppError";
import { ZodError } from "zod";
import { geminiConfig, requireGemini } from "../../../lib/gemini";
import {
  generatedQuestionsJsonSchema,
  generatedQuestionsSchema,
} from "../schemas/generated-question.schema";
import { generationSystemInstruction } from "../prompts/question-generation.prompt";
import type { AiInputContent } from "./document-reader.service";

function normalizeObjectiveFields(payload: unknown) {
  if (!payload || typeof payload !== "object") return payload;
  const questions = (payload as { questions?: unknown }).questions;
  if (!Array.isArray(questions)) return payload;

  for (const question of questions) {
    if (
      question &&
      typeof question === "object" &&
      (question as { type?: unknown }).type !== "PROGRAMMING"
    ) {
      Object.assign(question, {
        language: null,
        timeLimitMs: 2_000,
        memoryLimitMb: 256,
        maxCodeSizeKb: 256,
        testCases: [],
      });
    }
  }
  return payload;
}

export async function generateWithGemini(
  contents: AiInputContent[],
  prompt: string,
  extraction: boolean,
  questionCount: number,
) {
  try {
    const parts = contents.map((content) =>
      content.type === "text"
        ? { text: content.text }
        : {
          inlineData: {
            data: content.data,
            mimeType: content.mime_type,
          },
        },
    );
    const maxOutputTokens = extraction
      ? 16_384
      : Math.min(12_288, Math.max(2_048, questionCount * 1_500));
    const response = await requireGemini().models.generateContent({
      model: geminiConfig.model,
      contents: [...parts, { text: prompt }],
      config: {
        systemInstruction: generationSystemInstruction,
        responseMimeType: "application/json",
        responseJsonSchema: generatedQuestionsJsonSchema,
        maxOutputTokens,
        temperature: 0.2,
        thinkingConfig: { thinkingBudget: 0 },
        abortSignal: AbortSignal.timeout(geminiConfig.timeoutMs),
        httpOptions: { timeout: geminiConfig.timeoutMs },
      },
    });

    if (!response.text)
      throw new ValidationError("Gemini returned an empty response");
    const payload = normalizeObjectiveFields(JSON.parse(response.text));
    return generatedQuestionsSchema.parse(payload).questions;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof ZodError) {
      const issues = error.issues
        .slice(0, 5)
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw new ValidationError(
        `Gemini trả về câu hỏi chưa đúng cấu trúc: ${issues}`,
      );
    }
    if (error instanceof SyntaxError) {
      throw new ValidationError("Gemini trả về dữ liệu JSON không hợp lệ.");
    }
    const details =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    if (/429|RESOURCE_EXHAUSTED|quota/i.test(details)) {
      throw new AppError(
        429,
        "Đã hết hạn mức sử dụng Gemini hoặc đang gửi yêu cầu quá nhanh. Vui lòng chờ rồi thử lại hoặc kiểm tra quota/billing của Google AI.",
      );
    }
    if (/401|403|API_KEY|permission/i.test(details)) {
      throw new AppError(
        503,
        "Gemini API key không hợp lệ hoặc không có quyền sử dụng model đã cấu hình.",
      );
    }
    if (/404|NOT_FOUND|model/i.test(details)) {
      throw new AppError(
        503,
        `Không tìm thấy Gemini model '${geminiConfig.model}'.`,
      );
    }
    if (/timeout|AbortError|TimeoutError/i.test(details)) {
      throw new AppError(
        504,
        "Gemini xử lý quá thời gian cho phép. Hãy giảm số file, dung lượng file hoặc số câu hỏi.",
      );
    }
    throw new ValidationError(
      "Gemini không thể tạo câu hỏi hợp lệ từ tài liệu đã chọn.",
    );
  }
}
