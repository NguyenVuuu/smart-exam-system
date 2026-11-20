import { Camera, Image, Maximize2, Minimize2, MonitorUp } from 'lucide-react'
import { useEffect, useState } from 'react'
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
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!expanded) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [expanded])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !remoteStream) return

    video.srcObject = remoteStream
    void video.play().catch(() => undefined)

    return () => {
      video.pause()
      video.srcObject = null
    }
  }, [remoteStream, videoRef])

  return (
    <section
      role={expanded ? 'dialog' : undefined}
      aria-modal={expanded ? true : undefined}
      aria-label={expanded ? (isScreen ? 'Màn hình sinh viên' : 'Camera sinh viên') : undefined}
      className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xs ${expanded ? 'fixed inset-3 z-[80] flex flex-col shadow-2xl' : 'w-full self-start lg:sticky lg:top-4'}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900">
            {isScreen ? 'Màn hình đang xem' : 'Camera đang xem'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {liveStudent ? `${liveStudent.studentName} · ${liveStudent.studentCode}` : 'Chưa chọn sinh viên'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-label={expanded ? 'Thu nhỏ luồng giám sát' : 'Phóng to luồng giám sát'}
          title={expanded ? 'Thu nhỏ' : 'Phóng to'}
          className="shrink-0 rounded-lg border border-gray-200 p-2 text-slate-600 hover:bg-gray-50"
        >
          {expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>
      </div>
      <div className={expanded ? 'min-h-0 flex-1 bg-slate-950' : 'aspect-video bg-slate-950'}>
        {remoteStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full ${isScreen || expanded ? 'object-contain' : 'object-cover'}`}
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
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-slate-500">
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
