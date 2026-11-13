import { NotFoundError } from '../../../errors/AppError'
import prisma from '../../../lib/prisma'
import { agentAnswerSchema } from '../validators/ai-agent.validator'

export type ConversationContext = { type: 'STUDENT_RESULTS' | 'STUDENT_MATERIAL' | 'TEACHER_SCHEDULE'; id?: string }

const scope = (userId: string, context: ConversationContext) => ({
  userId, contextType: context.type, contextId: context.id ?? null,
})

export async function loadConversation(userId: string, context: ConversationContext, conversationId: string) {
  const conversation = await prisma.aiConversation.findFirst({
    where: { id: conversationId, ...scope(userId, context) },
    include: { turns: { orderBy: { createdAt: 'desc' }, take: 100 } },
  })
  if (!conversation) throw new NotFoundError('Conversation not found')
  return { id: conversation.id, turns: conversation.turns.reverse().map((turn) => ({
    id: turn.id, message: turn.message, answer: agentAnswerSchema.parse(turn.answer), createdAt: turn.createdAt,
  })) }
}

export async function listConversations(userId: string, context: ConversationContext) {
  return prisma.aiConversation.findMany({
    where: scope(userId, context), orderBy: { updatedAt: 'desc' }, take: 20,
    select: { id: true, createdAt: true, updatedAt: true, turns: {
      orderBy: { createdAt: 'asc' }, take: 1, select: { message: true },
    } },
  })
}

export async function recentHistory(userId: string, context: ConversationContext, conversationId?: string) {
  if (!conversationId) return []
  const conversation = await prisma.aiConversation.findFirst({ where: { id: conversationId, ...scope(userId, context) },
    select: { turns: { orderBy: { createdAt: 'desc' }, take: 6,
      select: { message: true, answer: true } } } })
  if (!conversation) throw new NotFoundError('Conversation not found')
  return conversation.turns.reverse().map((turn) => ({
    message: turn.message, summary: agentAnswerSchema.parse(turn.answer).summary,
  }))
}

export async function saveTurn(userId: string, context: ConversationContext, message: string,
  answer: unknown, conversationId?: string) {
  const validated = agentAnswerSchema.parse(answer)
  if (!conversationId) {
    const conversation = await prisma.aiConversation.create({ data: {
      ...scope(userId, context), turns: { create: { message, answer: validated } },
    }, select: { id: true } })
    return conversation.id
  }
  await prisma.$transaction(async (tx) => {
    const changed = await tx.aiConversation.updateMany({
      where: { id: conversationId, ...scope(userId, context) }, data: { updatedAt: new Date() },
    })
    if (!changed.count) throw new NotFoundError('Conversation not found')
    await tx.aiConversationTurn.create({ data: { conversationId, message, answer: validated } })
  })
  return conversationId
}
