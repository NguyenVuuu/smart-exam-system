import { ValidationError } from '../../../errors/AppError'
import { practiceDraftSchema } from '../validators/ai-agent.validator'

export interface PracticeAnswer { itemId: string; selectedIndex: number }
export interface ScorableItem { id: string; snapshot: unknown }

export function gradePractice(items: ScorableItem[], answers: PracticeAnswer[]) {
  const choices = new Map(answers.map(({ itemId, selectedIndex }) => [itemId, selectedIndex]))
  if (choices.size !== items.length || answers.length !== items.length
      || items.some(({ id }) => !choices.has(id))) {
    throw new ValidationError('Submit one answer for every question')
  }
  return items.map((item) => {
    const question = practiceDraftSchema.shape.questions.element.parse(item.snapshot)
    const selectedIndex = choices.get(item.id)!
    return { itemId: item.id, selectedIndex, score: Number(selectedIndex === question.correctIndex) }
  })
}
