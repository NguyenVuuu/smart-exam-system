import { Sparkles } from 'lucide-react'
import type { AiGenerationProgress, AiGenerationStage } from '../../hooks/useAiGenerationProgress'

const labels: Record<AiGenerationStage, string> = {
  UPLOADING: 'Đang tải tài liệu lên', PREPARING: 'Đang chuẩn bị tài liệu',
  GENERATING: 'Đang tạo câu hỏi', CORRECTING: 'Đang hiệu chỉnh câu chưa đạt',
  VALIDATING: 'Đang kiểm tra kết quả', COMPLETED: 'Đang nhận kết quả', FAILED: 'Không thể hoàn tất yêu cầu',
}

interface AiGenerationStatusProps {
  progress: AiGenerationProgress
  className?: string
}

export function AiGenerationStatus({ progress, className = '' }: AiGenerationStatusProps) {
  return <div
    className={`flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-12 text-center ${className}`}
    role="status"
    aria-live="polite"
  >
    <div className="relative flex items-center justify-center" aria-hidden="true">
      <span className="absolute h-16 w-16 animate-ping rounded-full bg-blue-400/20 opacity-75" style={{ animationDuration: '1.8s' }} />
      <span className="absolute h-10 w-10 animate-ping rounded-full bg-blue-500/30 opacity-90" style={{ animationDuration: '1.2s' }} />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/25">
        <Sparkles size={24} className="animate-bounce text-amber-300" style={{ animationDuration: '1s' }} />
      </div>
    </div>
    <p className="mt-4 text-sm font-bold text-gray-950">
      {progress.connected || progress.stage === 'UPLOADING' ? labels[progress.stage] : 'Đang chờ kết quả từ máy chủ'}
    </p>
    {progress.stage === 'CORRECTING' && Boolean(progress.completedCount) && <p className="mt-1 text-xs text-gray-500">
      Giữ lại {progress.completedCount} câu đã đạt{progress.requestedCount ? ` / ${progress.requestedCount} câu` : ''}
    </p>}
    <span className="mt-1 text-xs tabular-nums text-gray-500" aria-live="off">Đã chờ {progress.elapsedSeconds} giây</span>
  </div>
}
