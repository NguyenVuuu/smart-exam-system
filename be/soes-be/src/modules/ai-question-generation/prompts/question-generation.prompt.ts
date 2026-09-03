import type { GenerateQuestionsBody } from "../validators/ai-question-generation.validator";

const difficultyLabels = {
  AUTO: "Tự phân bổ hợp lý theo Bloom: EASY nhận biết, MEDIUM thông hiểu/vận dụng, HARD phân tích.",
  EASY: "Tất cả câu hỏi ở mức EASY (nhận biết).",
  MEDIUM: "Tất cả câu hỏi ở mức MEDIUM (thông hiểu hoặc vận dụng).",
  HARD: "Tất cả câu hỏi ở mức HARD (phân tích hoặc vận dụng cao).",
} as const;

export function buildGenerationPrompt(
  input: GenerateQuestionsBody,
  subjectName: string,
  sourceNames: string[],
) {
  const task =
    input.mode === "EXTRACT_EXISTING_EXAM"
      ? "Bóc tách toàn bộ câu hỏi nhận diện được trong tài liệu; giữ nguyên ý nghĩa và đáp án, không sáng tác câu mới. Nếu yêu cầu bổ sung của giảng viên chỉ định phạm vi câu hỏi thì chỉ bóc tách đúng phạm vi đó."
      : `Sinh đúng ${input.questionCount} câu hỏi mới chỉ dựa trên kiến thức trong tài liệu.`;

  return [
    `Môn học: ${subjectName}.`,
    `Nguồn tài liệu: ${sourceNames.join(", ")}.`,
    task,
    difficultyLabels[input.difficulty],
    "QUY TẮC CÂU HỎI TRẮC NGHIỆM (SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE):",
    "- title và content cùng là nội dung câu hỏi rõ ràng, không tối nghĩa.",
    "- Các phương án sai (distractors) phải hợp lý, dựa trên lỗi sai thường gặp của sinh viên, không dùng các phương án vô nghĩa.",
    "- Với SINGLE_CHOICE: chính xác 1 đáp án đúng.",
    "- Với MULTIPLE_CHOICE: ít nhất 1 đáp án đúng.",
    "- Với TRUE_FALSE: chính xác 2 phương án (Đúng / Sai).",
    "- explanation: giải thích chi tiết tại sao đáp án đó đúng và tại sao các phương án khác sai.",
    "- Với câu trắc nghiệm: language là null, testCases là [], timeLimitMs là 2000, memoryLimitMb là 256 và maxCodeSizeKb là 256.",
    "QUY TẮC BÀI TẬP LẬP TRÌNH (PROGRAMMING):",
    "- content: đề bài hoàn chỉnh gồm Mô tả bài toán, Quy cách dữ liệu vào (Input), Dữ liệu ra (Output), Giới hạn ràng buộc (Constraints) và Ví dụ minh họa.",
    "- options: mảng rỗng [].",
    "- language: chỉ định một trong các ngôn ngữ 'C', 'CPP', hoặc 'JAVA'.",
    "- timeLimitMs: từ 1000 đến 3000 ms.",
    "- memoryLimitMb: từ 128 đến 512 MB.",
    "- testCases: phải có ít nhất 1 test case công khai (isHidden: false) giống hệt ví dụ trong đề bài, và từ 2-4 test case ẩn (isHidden: true) kiểm tra các trường hợp biên (edge cases). expectedOutput phải chuẩn xác, không dư thừa khoảng trắng không cần thiết.",
    "YÊU CẦU CHUNG:",
    "- Các câu hỏi trong cùng một lần sinh phải độc lập, không trùng lặp ý tưởng hoặc đáp án.",
    "- difficultyReason: giải thích lý do xếp loại độ khó theo thang đo tư duy Bloom (nhận biết, thông hiểu, vận dụng, phân tích).",
    "- Tuyệt đối bám sát tài liệu cung cấp. Nếu tài liệu không đủ dữ kiện xác định đáp án chắc chắn thì không tạo câu hỏi đó.",
    "- Nếu nội dung có chứa đoạn mã nguồn (code), hãy bọc trong fenced code block Markdown (ví dụ: ```cpp ... ```).",
    input.prompt ? `Yêu cầu bổ sung từ giảng viên: ${input.prompt}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export const generationSystemInstruction = [
  "Bạn là trợ lý xây dựng ngân hàng câu hỏi cho giảng viên đại học.",
  "Đọc kỹ mọi tài liệu được cung cấp và trả về tiếng Việt.",
  "Tuân thủ chính xác JSON schema. Không thêm markdown hoặc văn bản ngoài JSON.",
  "Ưu tiên tính đúng đắn; tuyệt đối không bịa nội dung hay đáp án.",
].join(" ");
