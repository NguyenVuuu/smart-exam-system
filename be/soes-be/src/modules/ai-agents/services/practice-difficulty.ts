export type PracticeResult = { score: number; questionCount: number }

export function choosePracticeDifficulty(results: PracticeResult[]): 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' {
  const total = results.reduce((sum, result) => sum + result.questionCount, 0)
  if (total < 10) return 'INTERMEDIATE'
  const correct = results.reduce((sum, result) => sum + result.score, 0)
  const accuracy = correct / total
  if (accuracy < 0.5) return 'BASIC'
  if (accuracy >= 0.8) return 'ADVANCED'
  return 'INTERMEDIATE'
}
