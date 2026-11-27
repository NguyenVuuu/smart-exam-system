interface ScoreSummaryItem {
  courseOfferingId: string
  score: number
  type: string
  publishedAt: string | Date | null
  title: string
}

export function calculateAverageScore(items: ScoreSummaryItem[]): number | null {
  const courses = new Map<string, ScoreSummaryItem[]>()
  for (const item of items) {
    const scores = courses.get(item.courseOfferingId) ?? []
    scores.push(item)
    courses.set(item.courseOfferingId, scores)
  }
  const averages = [...courses.values()].map(scores => {
    const quizzes = scores.filter(item => item.type === 'QUIZ').sort((first, second) => {
      const firstTime = new Date(first.publishedAt ?? 0).getTime()
      const secondTime = new Date(second.publishedAt ?? 0).getTime()
      if (!Number.isNaN(firstTime) && !Number.isNaN(secondTime) && firstTime !== secondTime) return firstTime - secondTime
      return first.title.localeCompare(second.title, 'vi')
    }).slice(0, 3)
    const midterm = scores.find(item => item.type === 'MIDTERM')
    const final = scores.find(item => item.type === 'FINAL')
    const parts = [
      ...quizzes.map(item => ({ score: item.score, weight: 1 })),
      ...(midterm ? [{ score: midterm.score, weight: 2 }] : []),
      ...(final ? [{ score: final.score, weight: 3 }] : []),
    ]
    const weight = parts.reduce((sum, part) => sum + part.weight, 0)
    return weight ? parts.reduce((sum, part) => sum + part.score * part.weight, 0) / weight : null
  }).filter((score): score is number => score !== null)
  return averages.length ? averages.reduce((sum, score) => sum + score, 0) / averages.length : null
}
