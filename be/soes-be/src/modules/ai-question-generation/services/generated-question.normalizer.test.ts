import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { cleanEscapedText, normalizeObjectiveFields, safeTruncate } from './generated-question.normalizer'
import { generatedQuestionSchema } from '../schemas/generated-question.schema'

describe('generated-question.normalizer', () => {
  describe('cleanEscapedText', () => {
    it('cleans escaped double and single quotes and math symbols', () => {
      const escaped = 'In ra \\"YES\\" nếu đúng, ngược lại in ra \\"NO\\". Tham số \\$N\\$.'
      assert.equal(cleanEscapedText(escaped), 'In ra "YES" nếu đúng, ngược lại in ra "NO". Tham số $N$.')
    })
  })

  describe('safeTruncate', () => {
    it('keeps text under 200 characters unchanged', () => {
      const text = 'Một câu hỏi ngắn gọn dưới 200 ký tự.'
      assert.equal(safeTruncate(text, 200), text)
    })

    it('truncates text over 200 characters gracefully at word boundary with ellipsis', () => {
      const longText = 'Trong ngôn ngữ lập trình Java, từ khóa nào sau đây được sử dụng để ngăn chặn việc một phương thức bị ghi đè bởi bất kỳ lớp con nào kế thừa từ lớp chứa phương thức đó? Hãy chọn phương án đúng nhất trong các phương án được liệt kê dưới đây.'
      assert.ok(longText.length > 200)
      const truncated = safeTruncate(longText, 200)
      assert.ok(truncated.length <= 200)
      assert.ok(truncated.endsWith('...'))
      assert.ok(truncated.length >= 170)
    })
  })

  describe('normalizeObjectiveFields', () => {
    it('preserves full content while truncating title <= 200 for long objective questions', () => {
      const longQuestionText = 'Trong lập trình Java hướng đối tượng, khi bạn xây dựng một lớp con kế thừa từ một lớp cha và muốn đảm bảo rằng một phương thức cụ thể không bao giờ bị ghi đè bởi bất kỳ lớp con nào khác trong hệ thống phân cấp kế thừa, từ khóa nào sau đây là bắt buộc phải được khai báo trước chữ ký của phương thức đó?'
      assert.ok(longQuestionText.length > 250)

      const payload = {
        questions: [
          {
            title: longQuestionText,
            content: longQuestionText,
            type: 'SINGLE_CHOICE',
            difficulty: 'MEDIUM',
            difficultyReason: 'Lý do: Đòi hỏi nhớ và phân biệt từ khóa.',
            explanation: 'Từ khóa final ngăn chặn việc ghi đè phương thức.',
            options: [
              { content: 'final', isCorrect: true },
              { content: 'static', isCorrect: false },
              { content: 'abstract', isCorrect: false },
              { content: 'synchronized', isCorrect: false },
            ],
          },
        ],
      }

      const normalized = normalizeObjectiveFields(payload) as typeof payload
      const q = normalized.questions[0]

      // content preserves the full text
      assert.equal(q.content, longQuestionText)
      // title is safely truncated <= 200
      assert.ok(q.title.length <= 200)
      assert.ok(q.title.endsWith('...'))
      // difficultyReason is cleaned
      assert.equal(q.difficultyReason, 'Đòi hỏi nhớ và phân biệt từ khóa.')

      // Passes Zod validation without "Too big: expected string to have <=200 characters" error
      const parsed = generatedQuestionSchema.safeParse(q)
      assert.equal(parsed.success, true)
    })

    it('truncates overlong title for programming questions', () => {
      const longTitle = 'Viết chương trình tính toán ma trận và tìm đường đi ngắn nhất giữa hai đỉnh bất kỳ trong đồ thị vô hướng có trọng số dương sử dụng thuật toán Dijkstra tối ưu với hàng đợi ưu tiên min-heap kết hợp danh sách kề biểu diễn đồ thị.'
      assert.ok(longTitle.length > 200)

      const payload = {
        questions: [
          {
            title: longTitle,
            content: 'Chi tiết bài toán Dijkstra...',
            type: 'PROGRAMMING',
            difficulty: 'HARD',
            difficultyReason: 'Đòi hỏi cài đặt cấu trúc dữ liệu heap.',
            explanation: 'Sử dụng priority queue.',
            language: 'JAVA',
            options: [],
            timeLimitMs: 2000,
            memoryLimitMb: 256,
            maxCodeSizeKb: 256,
            testCases: [
              { input: '1\n', expectedOutput: '1\n', isHidden: false },
            ],
          },
        ],
      }

      const normalized = normalizeObjectiveFields(payload) as typeof payload
      const q = normalized.questions[0]
      assert.ok(q.title.length <= 200)

      const parsed = generatedQuestionSchema.safeParse(q)
      assert.equal(parsed.success, true)
    })
  })
})
