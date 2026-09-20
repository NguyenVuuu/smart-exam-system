export function normalizeObjectiveFields(payload: unknown) {
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
        .replace(/^\s*(?:lý do xếp độ khó|difficulty reason|lý do)\s*:\s*/i, "")
        .replace(/^\s*(?:mức\s*(?:dễ|trung bình|khó|nhận biết|thông hiểu|vận dụng\s*cao|vận dụng)|easy|medium|hard)\s*:\s*/i, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    if (q.type !== "PROGRAMMING") {
      const primaryText =
        typeof q.content === "string" && q.content.trim()
          ? q.content.trim()
          : typeof q.title === "string" && q.title.trim()
            ? q.title.trim()
            : "";
      if (primaryText) {
        q.title = primaryText;
        q.content = primaryText;
      }

      Object.assign(question, {
        language: null,
        timeLimitMs: 2_000,
        memoryLimitMb: 256,
        maxCodeSizeKb: 256,
        testCases: [],
      });

      if (q.type === "TRUE_FALSE" && Array.isArray(q.options)) {
        q.options.forEach((option) => {
          if (!option || typeof option.content !== "string") return;
          const label = option.content.trim().toLocaleLowerCase("vi");
          if (label === "true" || label === "đúng") option.content = "Đúng";
          if (label === "false" || label === "sai") option.content = "Sai";
        });
      }
    }
  }
  return payload;
}

function normalizeTextForComparison(text?: string): string {
  if (!text) return "";
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function deduplicateQuestions<T extends { title?: string; content?: string }>(questions: T[]): T[] {
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
