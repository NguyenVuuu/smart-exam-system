import { AppError, ValidationError } from "../../../errors/AppError";
import { ZodError } from "zod";
import { geminiConfig, requireGemini } from "../../../lib/gemini";
import {
  generatedQuestionsJsonSchema,
  generatedQuestionsSchema,
} from "../schemas/generated-question.schema";
import type { GeneratedQuestion } from "../schemas/generated-question.schema";
import { generationSystemInstruction } from "../prompts/question-generation.prompt";
import type { AiInputContent } from "./document-reader.service";

function normalizeObjectiveFields(payload: unknown) {
  if (!payload || typeof payload !== "object") return payload;
  const questions = (payload as { questions?: unknown }).questions;
  if (!Array.isArray(questions)) return payload;

  for (const question of questions) {
    if (!question || typeof question !== "object") continue;
    const q = question as {
      title?: string;
      content?: string;
      type?: string;
      difficultyReason?: string;
      options?: Array<{ content?: string; isCorrect?: boolean }>;
    };

    if (typeof q.difficultyReason === "string") {
      q.difficultyReason = q.difficultyReason
        .replace(/\u00a0/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\*\*|__/g, "")
        .replace(/^\s*[-*#]+\s*/, "")
        .replace(/^\s*(?:lý do xếp độ khó|difficulty reason)\s*:\s*/i, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    if (q.type !== "PROGRAMMING") {
      Object.assign(question, {
        language: null,
        timeLimitMs: 2_000,
        memoryLimitMb: 256,
        maxCodeSizeKb: 256,
        testCases: [],
      });

      if (q.type === "TRUE_FALSE" && Array.isArray(q.options)) {
        q.options.forEach((option) => {
          const label = option.content?.trim().toLocaleLowerCase("vi");
          if (label === "true" || label === "đúng") option.content = "Đúng";
          if (label === "false" || label === "sai") option.content = "Sai";
        });
      }
    }
  }
  return payload;
}

function isInterrogative(value: string) {
  return (
    /\?\s*$/.test(value.trim()) ||
    /(?:^|[\s,;:.])(ai|gì|nào|khi nào|tại sao|vì sao|bao nhiêu|như thế nào)(?=$|[\s,;:.?!])/i.test(
      value,
    )
  );
}

function validateGeneratedQuestions(
  questions: GeneratedQuestion[],
  extraction: boolean,
) {
  const errors: string[] = [];
  questions.forEach((question, index) => {
    const path = `questions.${index}`;
    const correctCount = question.options.filter(
      (option) => option.isCorrect,
    ).length;
    const normalizedOptions = question.options.map((option) =>
      option.content.trim().toLocaleLowerCase("vi"),
    );

    if (new Set(normalizedOptions).size !== normalizedOptions.length) {
      errors.push(`${path}.options không được trùng nội dung`);
    }
    if (
      question.type !== "PROGRAMMING" &&
      question.title.trim() !== question.content.trim()
    ) {
      errors.push(`${path}.title và content phải giống nhau`);
    }
    if (question.type === "SINGLE_CHOICE") {
      if (question.options.length !== 4)
        errors.push(`${path}.options phải có đúng 4 lựa chọn`);
      if (correctCount !== 1)
        errors.push(`${path}.options phải có chính xác 1 đáp án đúng`);
    }
    if (question.type === "MULTIPLE_CHOICE") {
      if (question.options.length < 4 || question.options.length > 5)
        errors.push(`${path}.options phải có từ 4 đến 5 lựa chọn`);
      if (correctCount < 2)
        errors.push(`${path}.options phải có ít nhất 2 đáp án đúng`);
    }
    if (question.type === "TRUE_FALSE") {
      if (
        isInterrogative(question.title) ||
        isInterrogative(question.content)
      ) {
        errors.push(
          `${path}.title và content phải là mệnh đề, không được là câu nghi vấn`,
        );
      }
      if (
        question.options.length !== 2 ||
        !normalizedOptions.includes("đúng") ||
        !normalizedOptions.includes("sai")
      ) {
        errors.push(`${path}.options chỉ được gồm Đúng và Sai`);
      }
      if (correctCount !== 1)
        errors.push(`${path}.options phải có chính xác 1 đáp án đúng`);
    }
    if (question.type === "PROGRAMMING") {
      const publicTestCount = question.testCases.filter(
        (testCase) => !testCase.isHidden,
      ).length;
      const hiddenTestCount = question.testCases.length - publicTestCount;
      const testInputs = question.testCases.map((testCase) =>
        testCase.input.replace(/\r\n/g, "\n"),
      );

      if (question.options.length > 0)
        errors.push(`${path}.options phải rỗng đối với bài lập trình`);
      if (!question.language)
        errors.push(`${path}.language là bắt buộc đối với bài lập trình`);
      if (!question.testCases.length)
        errors.push(`${path}.testCases là bắt buộc đối với bài lập trình`);
      if (publicTestCount < 1)
        errors.push(`${path}.testCases phải có ít nhất 1 test công khai`);
      if (!extraction && (hiddenTestCount < 2 || hiddenTestCount > 4))
        errors.push(`${path}.testCases phải có từ 2 đến 4 test ẩn`);
      if (new Set(testInputs).size !== testInputs.length)
        errors.push(`${path}.testCases không được trùng dữ liệu đầu vào`);
      if (
        question.testCases.some(
          (testCase) => testCase.expectedOutput.trim().length === 0,
        )
      ) {
        errors.push(`${path}.testCases.expectedOutput không được để trống`);
      }
    }
  });
  return errors;
}

function describeValidationError(error: unknown) {
  if (error instanceof ValidationError) return error.message;
  if (error instanceof SyntaxError) return "JSON trả về không hợp lệ";
  if (error instanceof ZodError) {
    return error.issues
      .slice(0, 8)
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
  }
  return null;
}

function normalizeTextForComparison(text?: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function deduplicateQuestions<T extends { title?: string; content?: string }>(questions: T[]): T[] {
  const seenTexts = new Set<string>();
  const uniqueList: T[] = [];

  for (const q of questions) {
    const key = normalizeTextForComparison(q.title || q.content);
    if (!key || seenTexts.has(key)) {
      continue;
    }
    seenTexts.add(key);
    uniqueList.push(q);
  }

  return uniqueList;
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
    let validationReason = "";

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const retryInstruction = validationReason
        ? [
            "Kết quả trước chưa đạt yêu cầu. Hãy tạo lại toàn bộ danh sách, chỉ trả JSON hợp lệ và sửa các lỗi sau:",
            validationReason,
          ].join("\n")
        : "";

      try {
        const response = await requireGemini().models.generateContent({
          model: geminiConfig.model,
          contents: [
            ...parts,
            { text: retryInstruction ? `${prompt}\n${retryInstruction}` : prompt },
          ],
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

        if (!response.text) {
          throw new ValidationError("Gemini trả về nội dung rỗng.");
        }

        const payload = normalizeObjectiveFields(JSON.parse(response.text));
        const parsedQuestions = generatedQuestionsSchema.parse(payload).questions;
        const questions = deduplicateQuestions(parsedQuestions);
        const validationErrors = validateGeneratedQuestions(
          questions,
          extraction,
        );

        if (!extraction && questions.length !== questionCount) {
          validationErrors.push(
            `Phải trả đúng ${questionCount} câu không trùng nhau, hiện nhận được ${questions.length} câu`,
          );
        }
        if (validationErrors.length) {
          throw new ValidationError(validationErrors.slice(0, 8).join("; "));
        }

        return questions;
      } catch (error) {
        const reason = describeValidationError(error);
        if (attempt === 0 && reason) {
          validationReason = reason;
          continue;
        }
        throw error;
      }
    }

    throw new ValidationError(
      "Gemini không thể tạo câu hỏi đúng cấu trúc sau khi thử lại.",
    );
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
