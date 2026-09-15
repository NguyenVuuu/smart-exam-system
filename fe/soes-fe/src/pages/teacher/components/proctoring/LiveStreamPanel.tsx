import { Camera, Image, MonitorUp } from 'lucide-react'
import type { ProctoringSessionRecord } from '../../types/teacher-exam.types'
import type { LiveStreamType } from './StudentLiveTable'

export type LiveStatus = 'IDLE' | 'REQUESTING' | 'CONNECTING' | 'CONNECTED'

export interface LiveStreamPanelProps {
  liveStudent: ProctoringSessionRecord | null
  liveStatus: LiveStatus
  liveSessionId: string | null
  liveStreamType: LiveStreamType
  remoteStream: MediaStream | null
  videoRef: React.RefObject<HTMLVideoElement | null>
  onCapture: () => void
}

export default function LiveStreamPanel({
  liveStudent,
  liveStatus,
  liveSessionId,
  liveStreamType,
  remoteStream,
  videoRef,
  onCapture,
}: LiveStreamPanelProps) {
  const isScreen = liveStreamType === 'SCREEN'

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xs">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-sm font-bold text-slate-900">
          {isScreen ? 'Màn hình đang xem' : 'Camera đang xem'}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {liveStudent ? `${liveStudent.studentName} · ${liveStudent.studentCode}` : 'Chưa chọn sinh viên'}
        </p>
      </div>
      <div className="aspect-video bg-slate-950">
        {remoteStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full ${isScreen ? 'object-contain' : 'object-cover'}`}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-300">
            {isScreen ? <MonitorUp size={34} /> : <Camera size={34} />}
            <span className="text-sm">
              {liveStatus === 'IDLE'
                ? isScreen
                  ? 'Chọn sinh viên để xem màn hình'
                  : 'Chọn sinh viên để xem live camera'
                : isScreen
                  ? 'Đang mở màn hình sinh viên...'
                  : 'Đang mở camera sinh viên...'}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-5 py-4 text-xs text-slate-500">
        <span>Trạng thái: {liveStatus}</span>
        <div className="flex items-center gap-3">
          {remoteStream && (
            <button
              type="button"
              onClick={onCapture}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <Image size={14} /> Chụp bằng chứng
            </button>
          )}
          {liveSessionId && <span>Session: {liveSessionId.slice(0, 8)}</span>}
        </div>
      </div>
    </section>
  )
}
