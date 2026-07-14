export interface ScoreResponseDto {
  examId: string
  title: string
  type: string
  score: number | null
  publishedAt?: Date
}
