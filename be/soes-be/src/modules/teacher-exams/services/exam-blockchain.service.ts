/**
 * Exam Blockchain Service
 *
 * Xử lý việc tính hash nội dung đề thi, ghi lên blockchain,
 * và verify tính toàn vẹn sau này.
 */

import type { ExamQuestion, ExamQuestionOption, ProgrammingTestCase } from '@prisma/client'
import prisma from '../../../lib/prisma'
import { computeExamHash, anchorExamHash, verifyExamHash } from '../../../lib/blockchain'
import { logger } from '../../../lib/logger'

type ExamQuestionWithRelations = ExamQuestion & {
  options: ExamQuestionOption[]
  programmingTests: ProgrammingTestCase[]
}

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
        title: q.title,
        content: q.content,
        type: q.type,
        difficulty: q.difficulty,
        points: String(q.points),
        options: q.options
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((o) => ({
            content: o.content,
            isCorrect: o.isCorrect,
            orderIndex: o.orderIndex,
          })),
        // ProgrammingTestCase không có orderIndex — sort theo id để đảm bảo thứ tự ổn định
        programmingTests: q.programmingTests
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((t) => ({
            id: t.id,
            input: t.input,
            expectedOutput: t.expectedOutput,
            isHidden: t.isHidden,
          })),
      })),
  }
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
        totalPoints: true,
        blockchainTxHash: true,
        examQuestions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: { orderBy: { orderIndex: 'asc' } },
            programmingTests: true,
          },
        },
      },
    })

    if (!exam || !exam.examQuestions.length) {
      logger.warn('Skipping blockchain anchor — exam not found or empty', { examId })
      return
    }

    // Đã anchor rồi thì không ghi lại — smart contract sẽ revert nếu cố ghi đè
    if (exam.blockchainTxHash) {
      logger.info('Skipping blockchain anchor — already anchored', { examId, txHash: exam.blockchainTxHash })
      return
    }

    const content = buildExamHashContent(
      exam.id,
      exam.title,
      String(exam.totalPoints),
      exam.examQuestions,
    )
    const contentHash = computeExamHash(content)

    // Ghi lên blockchain (có thể mất 15–30s trên Sepolia)
    const anchor = await anchorExamHash(examId, contentHash)

    // Lưu hash + txHash vào DB dù blockchain có thành công hay không
    await prisma.exam.update({
      where: { id: examId },
      data: {
        contentHash,
        blockchainTxHash: anchor?.txHash ?? null,
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
        totalPoints: true,
        examQuestions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: { orderBy: { orderIndex: 'asc' } },
            programmingTests: true,
          },
        },
      },
    })
    if (!exam) return false
    const currentHash = computeExamHash(
      buildExamHashContent(exam.id, exam.title, String(exam.totalPoints), exam.examQuestions),
    )
    return currentHash === storedHash
  } catch (error) {
    logger.error('Fast integrity check failed', { examId, error: String(error) })
    return true // fail-open: nếu không check được thì không block tạo ca thi
  }
}

export interface ExamIntegrityResult {  examId: string
  status: 'VALID' | 'TAMPERED' | 'NOT_ANCHORED' | 'BLOCKCHAIN_UNAVAILABLE'
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
      totalPoints: true,
      contentHash: true,
      blockchainTxHash: true,
      blockchainAnchoredAt: true,
      examQuestions: {
        orderBy: { orderIndex: 'asc' },
        include: {
          options: { orderBy: { orderIndex: 'asc' } },
          programmingTests: true,
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

  const currentHash = computeExamHash(
    buildExamHashContent(exam.id, exam.title, String(exam.totalPoints), exam.examQuestions),
  )

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
  if (exam.blockchainTxHash) {
    const result = await verifyExamHash(examId, currentHash, exam.blockchainTxHash)

    if (result.onChainHash === null) {
      // Không đọc được chain — dùng local hash để verify
      return {
        examId,
        status: localHashMatch ? 'VALID' : 'TAMPERED',
        currentHash,
        onChainHash: null,
        contentHashMatch: localHashMatch,
        blockchainTxHash: exam.blockchainTxHash,
        etherscanUrl,
        anchoredAt: exam.blockchainAnchoredAt,
        message: localHashMatch
          ? 'Hash nội dung khớp (blockchain không thể kết nối, dùng hash cục bộ).'
          : '⚠️ Hash nội dung KHÔNG khớp — đề thi có thể đã bị chỉnh sửa!',
      }
    }

    return {
      examId,
      status: result.isValid ? 'VALID' : 'TAMPERED',
      currentHash,
      onChainHash: result.onChainHash,
      contentHashMatch: result.isValid,
      blockchainTxHash: exam.blockchainTxHash,
      etherscanUrl,
      anchoredAt: result.storedAt ?? exam.blockchainAnchoredAt,
      message: result.isValid
        ? '✅ Đề thi nguyên vẹn — hash khớp với bản ghi trên blockchain.'
        : '⚠️ Hash nội dung KHÔNG khớp với blockchain — đề thi có thể đã bị chỉnh sửa!',
    }
  }

  // Có contentHash local nhưng chưa ghi được lên chain
  return {
    examId,
    status: localHashMatch ? 'VALID' : 'TAMPERED',
    currentHash,
    onChainHash: null,
    contentHashMatch: localHashMatch,
    blockchainTxHash: null,
    etherscanUrl: null,
    anchoredAt: exam.blockchainAnchoredAt,
    message: localHashMatch
      ? 'Hash nội dung khớp (chưa có bản ghi blockchain).'
      : '⚠️ Hash nội dung KHÔNG khớp — đề thi có thể đã bị chỉnh sửa!',
  }
}
