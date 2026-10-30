/**
 * ExamBlockchainBadge
 *
 * Hiển thị trạng thái blockchain anchor của đề thi.
 * - Nếu đề đã được anchor: badge xanh + link Etherscan + nút Verify Integrity
 * - Nếu chưa anchor (DRAFT): không hiển thị
 */

import { useState } from 'react'
import { ExternalLink, ShieldCheck, ShieldAlert, ShieldOff, Loader2 } from 'lucide-react'
import type { Exam } from '../../types/teacher-exam.types'
import { verifyTeacherExamIntegrity, type ExamIntegrityResult } from '../../api/teacher-exams.api'

interface Props {
  exam: Exam
  onTamperedChange?: (tampered: boolean) => void
  onVerifiedChange?: (verified: boolean) => void
}

type VerifyState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'done'; result: ExamIntegrityResult }
  | { phase: 'error'; message: string }

export function ExamBlockchainBadge({ exam, onTamperedChange, onVerifiedChange }: Props) {
  const [verifyState, setVerifyState] = useState<VerifyState>({ phase: 'idle' })

  // Chỉ hiển thị khi đề đã publish (có contentHash)
  if (!exam.contentHash && exam.status === 'DRAFT') return null

  const isAnchored = Boolean(exam.blockchainTxHash)
  // Đề không có contentHash thì không cần verify — cho phép tạo ca thi bình thường
  const requiresVerify = Boolean(exam.contentHash)

  const handleVerify = async () => {
    setVerifyState({ phase: 'loading' })
    try {
      const result = await verifyTeacherExamIntegrity(exam.id)
      setVerifyState({ phase: 'done', result })
      const tampered = result.status === 'TAMPERED'
      onTamperedChange?.(tampered)
      onVerifiedChange?.(true) // đã verify dù kết quả thế nào
    } catch {
      setVerifyState({ phase: 'error', message: 'Không thể kết nối để verify. Thử lại sau.' })
    }
  }

  void requiresVerify

  const verifyResult = verifyState.phase === 'done' ? verifyState.result : null

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-indigo-600 shrink-0" />
          <span className="text-sm font-semibold text-gray-700">Bảo mật đề thi (Blockchain)</span>
        </div>

        {isAnchored ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Đã anchor trên Sepolia
          </span>
        ) : exam.contentHash ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Hash cục bộ (blockchain chưa cấu hình)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
            Chưa anchor
          </span>
        )}
      </div>

      {/* Hash info */}
      {exam.contentHash && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500">SHA-256 nội dung đề thi:</p>
          <code className="block truncate rounded bg-gray-50 px-2 py-1 text-xs font-mono text-gray-700 border border-gray-200">
            {exam.contentHash}
          </code>
        </div>
      )}

      {/* Anchor time + Etherscan link */}
      {isAnchored && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {exam.blockchainAnchoredAt && (
            <span>
              Ghi lên chain lúc:{' '}
              <span className="font-medium text-gray-700">
                {new Date(exam.blockchainAnchoredAt).toLocaleString('vi-VN')}
              </span>
            </span>
          )}
          <a
            href={exam.etherscanUrl ?? `https://sepolia.etherscan.io`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            <ExternalLink size={12} />
            Xem trên Etherscan
          </a>
        </div>
      )}

      {/* Verify button */}
      {exam.contentHash && (
        <div className="pt-1 border-t border-gray-100 flex items-center gap-3">
          <button
            onClick={() => void handleVerify()}
            disabled={verifyState.phase === 'loading'}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verifyState.phase === 'loading' ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Đang kiểm tra...
              </>
            ) : (
              <>
                <ShieldCheck size={12} />
                Kiểm tra toàn vẹn
              </>
            )}
          </button>
          {verifyState.phase === 'idle' && (
            <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <ShieldAlert size={12} />
              Cần kiểm tra toàn vẹn trước khi tạo ca thi
            </p>
          )}
        </div>
      )}

      {/* Verify result */}
      {verifyState.phase === 'done' && verifyResult && (
        <VerifyResultPanel result={verifyResult} />
      )}

      {verifyState.phase === 'error' && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 p-3">
          <ShieldAlert size={14} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{verifyState.message}</p>
        </div>
      )}
    </div>
  )
}

function VerifyResultPanel({ result }: { result: ExamIntegrityResult }) {
  const isValid = result.status === 'VALID'
  const isTampered = result.status === 'TAMPERED'
  const isNotAnchored = result.status === 'NOT_ANCHORED'

  return (
    <div
      className={`rounded-lg border p-3 space-y-2 ${
        isValid
          ? 'bg-emerald-50 border-emerald-200'
          : isTampered
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
      }`}
    >
      {/* Status */}
      <div className="flex items-center gap-2">
        {isValid ? (
          <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
        ) : isTampered ? (
          <ShieldAlert size={14} className="text-red-600 shrink-0" />
        ) : (
          <ShieldOff size={14} className="text-amber-600 shrink-0" />
        )}
        <p
          className={`text-xs font-semibold ${
            isValid ? 'text-emerald-700' : isTampered ? 'text-red-700' : 'text-amber-700'
          }`}
        >
          {result.message}
        </p>
      </div>

      {/* Hash comparison */}
      <div className="space-y-1.5 text-xs">
        <HashRow label="Hash hiện tại" value={result.currentHash} highlight={!isValid && !isNotAnchored ? 'danger' : 'normal'} />
        {result.onChainHash && (
          <HashRow label="Hash trên chain" value={result.onChainHash} highlight="normal" />
        )}
      </div>

      {/* Anchored at */}
      {result.anchoredAt && (
        <p className="text-xs text-gray-500">
          Anchor lúc:{' '}
          <span className="font-medium text-gray-700">
            {new Date(result.anchoredAt).toLocaleString('vi-VN')}
          </span>
        </p>
      )}

      {/* Etherscan link */}
      {result.etherscanUrl && (
        <a
          href={result.etherscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <ExternalLink size={11} />
          Xem transaction trên Etherscan
        </a>
      )}
    </div>
  )
}

function HashRow({ label, value, highlight }: { label: string; value: string; highlight: 'normal' | 'danger' }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-gray-500">{label}:</span>
      <code
        className={`block truncate rounded px-2 py-0.5 font-mono text-xs border ${
          highlight === 'danger'
            ? 'bg-red-100 text-red-800 border-red-200'
            : 'bg-white text-gray-700 border-gray-200'
        }`}
      >
        {value}
      </code>
    </div>
  )
}
