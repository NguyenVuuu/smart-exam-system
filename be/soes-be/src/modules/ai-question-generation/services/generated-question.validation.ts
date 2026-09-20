import type { GeneratedQuestion } from "../schemas/generated-question.schema";

function isInterrogative(value: string) {
  return (
    /\?\s*$/.test(value.trim()) ||
    /(?:^|[\s,;:.])(ai|gì|nào|khi nào|tại sao|vì sao|bao nhiêu|như thế nào)(?=$|[\s,;:.?!])/i.test(
      value,
    )
  );
}

export function validateGeneratedQuestions(
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
