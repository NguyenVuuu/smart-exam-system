type NumericTestQuestion = {
  language: string
  referenceSolution: string
  stem?: string
  testCases: { input: string; expectedOutput: string }[]
}
const NUMBER_TOKEN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/

function formatArrayInput(stem: string, input: string) {
  if (!/mảng|array/i.test(stem) || !/(?:^|[^\p{L}\p{N}_])n(?=$|[^\p{L}\p{N}_])/iu.test(stem)) return input
  const tokens = input.trim().split(/\s+/)
  if (!/^\d+$/.test(tokens[0]) || !tokens.every(token => NUMBER_TOKEN.test(token)) ||
    Number(tokens[0]) !== tokens.length - 1 || input.split(/\r?\n/)[0].trim() === tokens[0]) return input
  return `${tokens[0]}\n${tokens.slice(1).join(' ')}`
}

function decodeNumericSeparators(text: string) {
  if (!text.includes('\\')) return text
  const decoded = text.replace(/\\r\\n|\\[nrt]/g, separator => ({ '\\r\\n': '\r\n', '\\n': '\n', '\\r': '\r', '\\t': '\t' })[separator]!)
  const tokens = decoded.trim().split(/\s+/)
  return tokens.every(token => NUMBER_TOKEN.test(token)) ? decoded : text
}

export function normalizeNumericJavaTests<T extends NumericTestQuestion>(question: T): T {
  const code = question.referenceSolution
  if (question.language !== 'JAVA' || !/\.(?:nextInt|nextLong|nextDouble|nextFloat|nextShort|nextByte|nextBigInteger|nextBigDecimal)\s*\(/.test(code) ||
    /\.(?:next|nextLine|readLine)\s*\(/.test(code) || /\\\\[nrt]/.test(code)) return question
  return { ...question, testCases: question.testCases.map(test => ({
    ...test, input: formatArrayInput(question.stem ?? '', decodeNumericSeparators(test.input)),
    expectedOutput: decodeNumericSeparators(test.expectedOutput),
  })) }
}
