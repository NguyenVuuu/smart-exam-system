/**
 * Exam Blockchain Service
 *
 * Xử lý việc tính hash nội dung đề thi, ghi lên blockchain,
 * và verify tính toàn vẹn sau này.
 */

import type { Exam, ExamQuestion, ExamQuestionOption, ExamSection, ProgrammingQuestionConfig, ProgrammingTestCase } from '@prisma/client'
import prisma from '../../../lib/prisma'
import { computeExamHash, anchorExamHash, verifyExamHash } from '../../../lib/blockchain'
import { logger } from '../../../lib/logger'
import { decryptField, decryptNullable } from '../../../lib/encryption'
import { openExamOption } from '../../../lib/exam-option-secret'
import { classifyExamIntegrity, type IntegrityStatus } from './exam-integrity-policy'
import { ConflictError } from '../../../errors/AppError'

type ExamQuestionWithRelations = ExamQuestion & {
  options: ExamQuestionOption[]
  programmingTests: ProgrammingTestCase[]
  programmingConfig: ProgrammingQuestionConfig | null
}

type ExamForHash = Pick<Exam, 'id' | 'title' | 'description' | 'type' | 'format' | 'subjectId' | 'semesterId' | 'defaultDurationMinutes' | 'totalPoints'> & {
  sections: ExamSection[]
  examQuestions: ExamQuestionWithRelations[]
}

const V2_PREFIX = 'v2:'
export const hashVersion = (storedHash: string) => storedHash.startsWith(V2_PREFIX) ? 2 : 1
export const anchorKey = (examId: string, version: number) => version === 2 ? `${examId}:v2` : examId

/**
 * Tạo object nội dung đề thi dùng để tính hash.
 * Chỉ bao gồm dữ liệu câu hỏi và đáp án — không bao gồm metadata thay đổi được.
 */
function buildExamHashContent(
  examId: string,
  title: string,
  totalPoints: string,
  questions: ExamQuestionWithRelations[],
) {
  return {
    examId,
    title,
    totalPoints,
    questions: questions
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((q) => ({
        orderIndex: q.orderIndex,
        title: decryptField(q.title),
        content: decryptField(q.content),
        type: q.type,
        difficulty: q.difficulty,
        points: String(q.points),
        options: q.options
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((o) => ({
            content: openExamOption(o).content,
            isCorrect: openExamOption(o).isCorrect,
            orderIndex: o.orderIndex,
          })),
        // ProgrammingTestCase không có orderIndex — sort theo id để đảm bảo thứ tự ổn định
        programmingTests: q.programmingTests
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((t) => ({
            id: t.id,
            input: decryptField(t.input),
            expectedOutput: decryptField(t.expectedOutput),
            isHidden: t.isHidden,
          })),
      })),
  }
}

function buildExamHashContentV2(exam: ExamForHash) {
  const legacy = buildExamHashContent(exam.id, exam.title, String(exam.totalPoints), exam.examQuestions)
  const sortedQuestions = [...exam.examQuestions].sort((a, b) => a.orderIndex - b.orderIndex)
  return {
    ...legacy,
    description: exam.description,
    type: exam.type,
    format: exam.format,
    subjectId: exam.subjectId,
    semesterId: exam.semesterId,
    defaultDurationMinutes: exam.defaultDurationMinutes,
    sections: [...exam.sections].sort((a, b) => a.orderIndex - b.orderIndex).map((section) => ({
      orderIndex: section.orderIndex, title: section.title, description: section.description,
      type: section.type, targetPoints: String(section.targetPoints),
    })),
    questions: legacy.questions.map((question, index) => {
      const source = sortedQuestions[index]
      return {
        ...question,
        sectionId: source.sectionId,
        explanation: decryptNullable(source.explanation),
        language: source.language,
        programmingConfig: source.programmingConfig ? {
          timeLimitMs: source.programmingConfig.timeLimitMs,
          memoryLimitKb: source.programmingConfig.memoryLimitKb,
          maxCodeSizeKb: source.programmingConfig.maxCodeSizeKb,
        } : null,
        programmingTests: question.programmingTests.map((test) => ({
          ...test, isSample: source.programmingTests.find((item) => item.id === test.id)?.isSample ?? false,
        })),
      }
    }),
  }
}

export function computeStoredExamHash(exam: ExamForHash, version: number): string {
  const content = version === 2
    ? buildExamHashContentV2(exam)
    : buildExamHashContent(exam.id, exam.title, String(exam.totalPoints), exam.examQuestions)
  const hash = computeExamHash(content)
  return version === 2 ? `${V2_PREFIX}${hash}` : hash
}

/**
 * Anchor hash của đề thi lên blockchain sau khi publish.
 * Không bao giờ throw — nếu blockchain thất bại, chỉ log warning.
 */
export async function anchorPublishedExam(examId: string): Promise<void> {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        title: true,
        description: true, type: true, format: true, subjectId: true, semesterId: true,
        defaultDurationMinutes: true, sections: true,
        totalPoints: true,
        contentHash: true,
        blockchainTxHash: true,
        blockchainAnchoredAt: true,
        status: true,
        examQuestions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: { orderBy: { orderIndex: 'asc' } },
            programmingTests: true,
            programmingConfig: true,
          },
        },
      },
    })

    if (!exam || exam.status !== 'READY' || !exam.examQuestions.length) {
      logger.warn('Skipping blockchain anchor — exam not found or empty', { examId })
      return
    }

    // Đã anchor rồi thì không ghi lại — smart contract sẽ revert nếu cố ghi đè
    if (exam.blockchainAnchoredAt) {
      logger.info('Skipping blockchain anchor — already anchored', { examId, txHash: exam.blockchainTxHash })
      return
    }

    const version = hashVersion(exam.contentHash ?? '')
    const contentHash = computeStoredExamHash(exam, exam.contentHash ? version : 2)
    if (exam.contentHash && exam.contentHash !== contentHash) {
      logger.error('Skipping blockchain anchor — stored exam hash does not match content', { examId })
      return
    }

    // Ghi lên blockchain (có thể mất 15–30s trên Sepolia)
    const anchor = await anchorExamHash(anchorKey(examId, exam.contentHash ? version : 2), contentHash)

    // Lưu hash + txHash vào DB dù blockchain có thành công hay không
    await prisma.exam.update({
      where: { id: examId },
      data: {
        contentHash,
        blockchainTxHash: anchor?.txHash ?? exam.blockchainTxHash,
        blockchainAnchoredAt: anchor?.anchoredAt ?? null,
      },
    })

    if (anchor) {
      logger.info('Exam anchored on blockchain', { examId, txHash: anchor.txHash })
    } else {
      logger.info('Exam hash stored locally (blockchain unavailable)', { examId, contentHash })
    }
  } catch (error) {
    logger.error('Blockchain anchor failed silently', { examId, error: String(error) })
  }
}

/**
 * Verify nhanh — chỉ so sánh local hash, không gọi blockchain.
 * Dùng cho guard tạo ca thi để tránh gọi chain mỗi lần.
 * Trả về true nếu hash khớp, false nếu bị sửa.
 */
export async function verifyExamIntegrityFast(examId: string, storedHash: string): Promise<boolean> {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        title: true,
        description: true, type: true, format: true, subjectId: true, semesterId: true,
        defaultDurationMinutes: true, sections: true,
        totalPoints: true,
        examQuestions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: { orderBy: { orderIndex: 'asc' } },
            programmingTests: true,
            programmingConfig: true,
          },
        },
      },
    })
    if (!exam) return false
    const currentHash = computeStoredExamHash(exam, hashVersion(storedHash))
    return currentHash === storedHash
  } catch (error) {
    logger.error('Fast integrity check failed', { examId, error: String(error) })
    return false
  }
}

export interface ExamIntegrityResult {
  examId: string
  status: IntegrityStatus
  currentHash: string
  onChainHash: string | null
  contentHashMatch: boolean
  blockchainTxHash: string | null
  etherscanUrl: string | null
  anchoredAt: Date | null
  message: string
}

/**
 * Verify tính toàn vẹn của đề thi.
 * So sánh hash hiện tại của nội dung trong DB với hash đã được ghi lên blockchain.
 */
export async function verifyExamIntegrity(examId: string): Promise<ExamIntegrityResult> {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: {
      id: true,
      title: true,
      description: true, type: true, format: true, subjectId: true, semesterId: true,
      defaultDurationMinutes: true, sections: true,
      totalPoints: true,
      contentHash: true,
      blockchainTxHash: true,
      blockchainAnchoredAt: true,
      examQuestions: {
        orderBy: { orderIndex: 'asc' },
        include: {
          options: { orderBy: { orderIndex: 'asc' } },
          programmingTests: true,
          programmingConfig: true,
        },
      },
    },
  })

  if (!exam) {
    return {
      examId,
      status: 'NOT_ANCHORED',
      currentHash: '',
      onChainHash: null,
      contentHashMatch: false,
      blockchainTxHash: null,
      etherscanUrl: null,
      anchoredAt: null,
      message: 'Đề thi không tồn tại.',
    }
  }

  const version = hashVersion(exam.contentHash ?? '')
  const currentHash = computeStoredExamHash(exam, version)

  if (!exam.contentHash) {
    return {
      examId,
      status: 'NOT_ANCHORED',
      currentHash,
      onChainHash: null,
      contentHashMatch: false,
      blockchainTxHash: null,
      etherscanUrl: null,
      anchoredAt: null,
      message: 'Đề thi chưa được anchor (chưa publish hoặc blockchain chưa cấu hình).',
    }
  }

  const localHashMatch = currentHash === exam.contentHash
  const etherscanUrl = exam.blockchainTxHash
    ? `https://sepolia.etherscan.io/tx/${exam.blockchainTxHash}`
    : null

  // Nếu có txHash → verify trực tiếp từ chain
  if (exam.blockchainTxHash || exam.blockchainAnchoredAt) {
    const result = await verifyExamHash(anchorKey(examId, version), currentHash, exam.blockchainTxHash ?? '')

    if (result.onChainHash === null) {
      // Không đọc được chain; chỉ báo trạng thái cục bộ, không coi là đã xác minh.
      return {
        examId,
        status: classifyExamIntegrity(currentHash, exam.contentHash, true, null),
        currentHash,
        onChainHash: null,
        contentHashMatch: localHashMatch,
        blockchainTxHash: exam.blockchainTxHash,
        etherscanUrl,
        anchoredAt: exam.blockchainAnchoredAt,
        message: localHashMatch
          ? 'Hash cục bộ khớp nhưng không thể xác minh blockchain.'
          : '⚠️ Hash nội dung KHÔNG khớp — đề thi có thể đã bị chỉnh sửa!',
      }
    }

    return {
      examId,
      status: classifyExamIntegrity(currentHash, exam.contentHash, true, result.onChainHash),
      currentHash,
      onChainHash: result.onChainHash,
      contentHashMatch: localHashMatch,
      blockchainTxHash: exam.blockchainTxHash,
      etherscanUrl,
      anchoredAt: result.storedAt ?? exam.blockchainAnchoredAt,
      message: result.isValid && localHashMatch
        ? '✅ Đề thi nguyên vẹn — hash khớp với bản ghi trên blockchain.'
        : '⚠️ Hash nội dung KHÔNG khớp với blockchain — đề thi có thể đã bị chỉnh sửa!',
    }
  }

  const chainRecord = await verifyExamHash(anchorKey(examId, version), currentHash, '')
  const status = classifyExamIntegrity(currentHash, exam.contentHash, false, chainRecord.onChainHash)
  return {
    examId,
    status,
    currentHash,
    onChainHash: chainRecord.onChainHash || null,
    contentHashMatch: localHashMatch,
    blockchainTxHash: null,
    etherscanUrl: null,
    anchoredAt: chainRecord.storedAt,
    message: status === 'VALID'
      ? '✅ Đề thi nguyên vẹn — hash khớp với bản ghi trên blockchain.'
      : status === 'TAMPERED'
        ? '⚠️ Hash nội dung KHÔNG khớp với blockchain — đề thi có thể đã bị chỉnh sửa!'
        : 'Hash cục bộ khớp; đề chưa được xác nhận trên blockchain.',
  }
}

export async function requireVerifiedExamAnchor(examId: string): Promise<void> {
  const result = await verifyExamIntegrity(examId)
  if (result.status !== 'VALID') {
    throw new ConflictError('Không thể tạo hoặc cập nhật ca thi: đề chưa được xác minh nguyên vẹn trên blockchain.')
  }
}
