/**
 * ExamBlockchainBadge
 *
 * Hiển thị trạng thái blockchain anchor của đề thi tối giản:
 * - Tiêu đề: "Toàn vẹn đề thi"
 * - Badge: "Đã anchor trên Sepolia"
 * - Nút: "Kiểm tra toàn vẹn"
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
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
  const inFlight = useRef(false)
  const latestStatus = useRef<ExamIntegrityResult['status'] | null>(null)
  const mounted = useRef(true)

    const handleVerify = useCallback(async (isManual = false) => {
      if (inFlight.current) return
      inFlight.current = true
      onVerifiedChange?.(false)
      setVerifyState({ phase: 'loading' })
      try {
        const result = await verifyTeacherExamIntegrity(exam.id)
        if (!mounted.current) return
        latestStatus.current = result.status
        setVerifyState({ phase: 'done', result })
        onTamperedChange?.(result.status === 'TAMPERED')
        onVerifiedChange?.(result.status === 'VALID')

        if (isManual) {
          if (result.status === 'VALID') {
            toast.success('Đề thi nguyên vẹn – hash khớp với bản ghi trên blockchain.')
          } else if (result.status === 'TAMPERED') {
            toast.error('Cảnh báo: Đề thi đã bị chỉnh sửa, không khớp với blockchain!')
          } else {
            toast.info(result.message || 'Chưa có bản ghi trên blockchain.')
          }
        } else if (result.status === 'TAMPERED') {
          toast.error('Cảnh báo: Đề thi đã bị chỉnh sửa, không khớp với blockchain!')
        }
      } catch {
        if (!mounted.current) return
        latestStatus.current = null
        onVerifiedChange?.(false)
        setVerifyState({ phase: 'error', message: 'Không thể kết nối để xác minh.' })
        if (isManual) {
          toast.error('Không thể kết nối để xác minh toàn vẹn đề thi.')
        }
      } finally {
        inFlight.current = false
      }
    }, [exam.id, onTamperedChange, onVerifiedChange])

    useEffect(() => {
      mounted.current = true
      if (exam.status !== 'PUBLISHED') return () => { mounted.current = false }

      const firstCheck = window.setTimeout(() => { void handleVerify(false) }, 0)
      const timer = window.setInterval(() => {
        if (latestStatus.current !== 'VALID' && latestStatus.current !== 'TAMPERED') {
          void handleVerify(false)
        }
      }, 15_000)
      return () => {
        mounted.current = false
        window.clearTimeout(firstCheck)
        window.clearInterval(timer)
      }
    }, [exam.status, handleVerify])

    // Chỉ hiển thị khi đề đã publish (có contentHash)
    if (!exam.contentHash && exam.status === 'DRAFT') return null

    const isAnchored = Boolean(exam.blockchainAnchoredAt)
    const verifyResult = verifyState.phase === 'done' ? verifyState.result : null
    const verifiedOnChain = verifyResult?.status === 'VALID'

    return (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            {/* Title & Badge */}
            <div className="flex flex-wrap items-center gap-2.5">
              <ShieldCheck size={16} className="text-indigo-600 shrink-0" />
              <span className="text-sm font-semibold text-gray-700">Toàn vẹn đề thi</span>

              {isAnchored || verifiedOnChain ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Đã anchor trên Sepolia
                </span>
              ) : exam.contentHash ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Chưa xác nhận trên blockchain
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                  Chưa anchor
                </span>
              )}
            </div>

            {/* Verify button */}
            {exam.status === 'PUBLISHED' && (
        <button
          type="button"
          onClick={() => void handleVerify(true)}
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
            )}
          </div>
          )
}
