import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalizeNumericJavaTests } from './programming-test-format'
import { programmingPracticeQuestionSchema } from '../validators/ai-agent.validator'

const solution = 'import java.util.Scanner; class Main { public static void main(String[] args) { Scanner s = new Scanner(System.in); int n = s.nextInt(); int sum = 0; for (int i=0; i<n; i++) sum += s.nextInt(); System.out.println(sum); } }'
const question = () => ({
  language: 'JAVA' as const,
  referenceSolution: solution,
  starterCode: 'class Main { public static void main(String[] args) {} }',
  stem: 'Đọc số lượng phần tử n và n số nguyên, sau đó dùng vòng lặp để tính tổng các phần tử và in tổng ra màn hình.',
  explanation: 'Chương trình đọc n, dùng vòng lặp đọc n giá trị rồi cộng dồn vào biến tổng trước khi in kết quả.',
  supportQuote: 'Vòng lặp cho phép xử lý từng phần tử của mảng.',
  testCases: [{ input: '3\\n1 2 3', expectedOutput: '6\\n' }, { input: '2\\r\\n-1\\t2', expectedOutput: '1\\r\\n' }],
})

test('agent response and stored snapshot schema decode escaped separators for numeric Java input', () => {
  const parsed = programmingPracticeQuestionSchema.parse(question())
  assert.deepEqual(parsed.testCases, [
    { input: '3\n1 2 3', expectedOutput: '6\n' }, { input: '2\r\n-1\t2', expectedOutput: '1\r\n' },
  ])
  assert.equal(parsed.referenceSolution, solution)
  assert.deepEqual(programmingPracticeQuestionSchema.parse(parsed), parsed)
})

test('literal backslash exercises and string-reading programs are not rewritten', () => {
  const literal = { ...question(), referenceSolution: solution + ' // print "\\\\n" literally' }
  assert.deepEqual(normalizeNumericJavaTests(literal), literal)
  for (const read of ['next()', 'nextLine()', 'readLine()']) {
    const stringReader = { ...question(), referenceSolution: solution + ` scanner.${read};` }
    assert.deepEqual(normalizeNumericJavaTests(stringReader), stringReader)
  }
  const text = { ...question(), testCases: [{ input: 'hello\\nworld', expectedOutput: 'hello\\nworld' }] }
  assert.deepEqual(normalizeNumericJavaTests(text), text)
})

test('C/C++ and already valid whitespace remain unchanged', () => {
  for (const language of ['C', 'CPP']) {
    const other = { ...question(), language }
    assert.deepEqual(normalizeNumericJavaTests(other), other)
  }
  const valid = { ...question(), testCases: [{ input: '3\n1  2\t3\n', expectedOutput: '6\n' }] }
  assert.deepEqual(normalizeNumericJavaTests(valid), valid)
})

test('n and exactly n array values use separate lines without changing numeric values', () => {
  const array = { ...question(), stem: 'Nhập số nguyên n và mảng gồm n số nguyên, tính tổng các phần tử bằng vòng lặp rồi in tổng trên một dòng.',
    testCases: [{ input: '5 1 2 3 4 5', expectedOutput: '15' }, { input: '3\n1  2\t3', expectedOutput: '6' }] }
  const normalized = programmingPracticeQuestionSchema.parse(array)
  assert.equal(normalized.testCases[0].input, '5\n1 2 3 4 5')
  assert.equal(normalized.testCases[1].input, array.testCases[1].input)
  assert.deepEqual(normalized.testCases.map(test => test.input.split(/\s+/)), array.testCases.map(test => test.input.split(/\s+/)))
  const extraParameter = { ...array, testCases: [{ input: '3 1 2 3 9', expectedOutput: '0' }] }
  assert.equal(normalizeNumericJavaTests(extraParameter).testCases[0].input, '3 1 2 3 9')
  const fixedArray = { ...array, stem: 'Tính tổng các phần tử của mảng có ba số nguyên.',
    testCases: [{ input: '2 5 6', expectedOutput: '13' }] }
  assert.equal(normalizeNumericJavaTests(fixedArray).testCases[0].input, '2 5 6')
})
