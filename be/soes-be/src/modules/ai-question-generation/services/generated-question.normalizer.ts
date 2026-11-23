const VIETNAMESE_ACCENT_REGEX = /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i;

const DIACRITIC_MAP: Array<[RegExp, string]> = [
  // Multi-word phrases first (longer match first)
  [/\buoc chung lon nhat\b/gi, 'ước chung lớn nhất'],
  [/\bboi chung nho nhat\b/gi, 'bội chung nhỏ nhất'],
  [/\btrung binh cong\b/gi, 'trung bình cộng'],
  [/\bmang mot chieu\b/gi, 'mảng một chiều'],
  [/\bmang hai chieu\b/gi, 'mảng hai chiều'],
  [/\bso chinh phuong\b/gi, 'số chính phương'],
  [/\bso nguyen to\b/gi, 'số nguyên tố'],
  [/\bso hoan hao\b/gi, 'số hoàn hảo'],
  [/\bso doi xung\b/gi, 'số đối xứng'],
  [/\bso nguyen\b/gi, 'số nguyên'],
  [/\bso duong\b/gi, 'số dương'],
  [/\bso am\b/gi, 'số âm'],
  [/\bso thuc\b/gi, 'số thực'],
  [/\bxau ky tu\b/gi, 'xâu ký tự'],
  [/\bky tu\b/gi, 'ký tự'],
  [/\btinh tong\b/gi, 'tính tổng'],
  [/\btinh tich\b/gi, 'tính tích'],
  [/\btinh giai thua\b/gi, 'tính giai thừa'],
  [/\bgiai thua\b/gi, 'giai thừa'],
  [/\btong cac phan tu\b/gi, 'tổng các phần tử'],
  [/\bcac phan tu\b/gi, 'các phần tử'],
  [/\bphan tu\b/gi, 'phần tử'],
  [/\bo chi so\b/gi, 'ở chỉ số'],
  [/\bchi so\b/gi, 'chỉ số'],
  [/\btim kiem\b/gi, 'tìm kiếm'],
  [/\bsap xep\b/gi, 'sắp xếp'],
  [/\btang dan\b/gi, 'tăng dần'],
  [/\bgiam dan\b/gi, 'giảm dần'],
  [/\blon nhat\b/gi, 'lớn nhất'],
  [/\bnho nhat\b/gi, 'nhỏ nhất'],
  [/\blon hon\b/gi, 'lớn hơn'],
  [/\bnho hon\b/gi, 'nhỏ hơn'],
  [/\btrong mang\b/gi, 'trong mảng'],
  [/\btrong chuoi\b/gi, 'trong chuỗi'],
  [/\bdem so luong\b/gi, 'đếm số lượng'],
  [/\bso luong\b/gi, 'số lượng'],
  [/\bdem so\b/gi, 'đếm số'],
  [/\bchia het cho\b/gi, 'chia hết cho'],
  [/\bchia het\b/gi, 'chia hết'],
  [/\bdao nguoc\b/gi, 'đảo ngược'],
  [/\bduyet mang\b/gi, 'duyệt mảng'],
  [/\bxoa phan tu\b/gi, 'xóa phần tử'],
  [/\bchen phan tu\b/gi, 'chèn phần tử'],
  [/\bkiem tra\b/gi, 'kiểm tra'],
  [/\bviet chuong trinh\b/gi, 'viết chương trình'],
  [/\bchuong trinh\b/gi, 'chương trình'],
  [/\bchan\b/gi, 'chẵn'],
  [/\ble\b/gi, 'lẻ'],
  [/\bmang\b/gi, 'mảng'],
  [/\bchuoi\b/gi, 'chuỗi'],
  [/\bdem\b/gi, 'đếm'],
  [/\btinh\b/gi, 'tính'],
  [/\btim\b/gi, 'tìm'],
  [/\bday so\b/gi, 'dãy số'],
];

export function restoreVietnameseDiacritics(text: string): string {
  if (!text) return text;
  // Nếu đã có dấu tiếng Việt rồi thì giữ nguyên
  if (VIETNAMESE_ACCENT_REGEX.test(text)) return text;

  let result = text;
  for (const [regex, replacement] of DIACRITIC_MAP) {
    result = result.replace(regex, replacement);
  }

  // Nếu có thay đổi, viết hoa chữ cái đầu tiên
  if (result !== text && result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  return result;
}

export function cleanEscapedText(text: string): string {
  if (!text) return text;
  return text
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\$/g, "$")
    .replace(/\\(?:le|leq)\b/g, '≤')
    .replace(/\\(?:ge|geq)\b/g, '≥')
    .replace(/\\(?:ne|neq)\b/g, '≠')
    .replace(/\\(?:times)\b/g, '×')
    .replace(/\\(?:pm)\b/g, '±')
    .replace(/\\(?:dots|ldots)\b/g, '...')
    .replace(/\\(?:in)\b/g, '∈');
}

export function safeTruncate(text: string, maxLength = 200): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  const targetLen = maxLength - 3;
  const lastSpace = trimmed.lastIndexOf(" ", targetLen);
  const cutPoint = lastSpace >= Math.max(10, targetLen - 30) ? lastSpace : targetLen;
  return `${trimmed.slice(0, cutPoint).trimEnd()}...`;
}

export function normalizeObjectiveFields(payload: unknown) {
  if (!payload || typeof payload !== "object") return payload;
  const questions = (payload as { questions?: unknown }).questions;
  if (!Array.isArray(questions)) return payload;

  for (const question of questions) {
    if (!question || typeof question !== "object") continue;
    const q = question as {
      title?: string;
      content?: string;
      explanation?: string;
      type?: string;
      difficultyReason?: string;
      options?: Array<{ content?: string; isCorrect?: boolean }>;
      testCases?: Array<{ input?: string; expectedOutput?: string; isHidden?: boolean }>;
    };

    if (typeof q.title === "string") q.title = restoreVietnameseDiacritics(cleanEscapedText(q.title));
    if (typeof q.content === "string") q.content = cleanEscapedText(q.content);
    if (typeof q.explanation === "string") q.explanation = cleanEscapedText(q.explanation);

    if (Array.isArray(q.options)) {
      for (const opt of q.options) {
        if (opt && typeof opt.content === "string") opt.content = cleanEscapedText(opt.content);
      }
    }

    if (Array.isArray(q.testCases)) {
      for (const tc of q.testCases) {
        if (tc && typeof tc.input === "string") tc.input = cleanEscapedText(tc.input);
        if (tc && typeof tc.expectedOutput === "string") tc.expectedOutput = cleanEscapedText(tc.expectedOutput);
      }
    }

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
        q.content = primaryText;
        const candidateTitle =
          typeof q.title === "string" && q.title.trim() && q.title.trim().length <= 200
            ? q.title.trim()
            : primaryText;
        q.title = safeTruncate(candidateTitle, 200);
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
    } else {
      if (typeof q.title === "string" && q.title.trim()) {
        q.title = safeTruncate(restoreVietnameseDiacritics(q.title.trim()), 200);
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
