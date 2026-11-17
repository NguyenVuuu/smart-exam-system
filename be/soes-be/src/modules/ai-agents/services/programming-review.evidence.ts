import { decryptField } from '../../../lib/encryption'

interface TestResultEvidence {
  status: string
  actualOutput: string | null
  errorMessage: string | null
  testCase: { input: string; expectedOutput: string; isHidden: boolean }
}

export function publicFailedTests(results: TestResultEvidence[]) {
  return results.filter((result) => result.status !== 'PASSED' && !result.testCase.isHidden)
    .slice(0, 3).map((result) => ({
      input: decryptField(result.testCase.input).slice(0, 500),
      expectedOutput: decryptField(result.testCase.expectedOutput).slice(0, 500),
      actualOutput: result.actualOutput?.slice(0, 500) ?? null,
      status: result.status,
      errorMessage: result.errorMessage?.slice(0, 500) ?? null,
    }))
}
