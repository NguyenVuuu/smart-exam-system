import { Amplify } from 'aws-amplify'
import { useEffect, useState } from 'react'
import { FaceLivenessDetector, type FaceLivenessDetectorProps } from '@aws-amplify/ui-react-liveness'
import '@aws-amplify/ui-react-liveness/styles.css'
import './face-liveness.css'
import { vietnameseLivenessText } from './face-liveness.vi'
import { trackFaceCameraStreams } from './face-camera'

const identityPoolId = import.meta.env.VITE_AWS_FACE_IDENTITY_POOL_ID as string | undefined
if (identityPoolId) Amplify.configure({ Auth: { Cognito: { identityPoolId, allowGuestAccess: true } } })

interface Props {
  sessionId: string
  region: string
  onAnalysisComplete: () => Promise<void>
  onError: NonNullable<FaceLivenessDetectorProps['onError']>
  onUserCancel: () => void
}

export default function FaceLivenessPanel(props: Props) {
  const [camera, setCamera] = useState<ReturnType<typeof trackFaceCameraStreams> | null>(null)

  useEffect(() => {
    const tracker = trackFaceCameraStreams(navigator.mediaDevices)
    const frame = window.requestAnimationFrame(() => setCamera(tracker))
    return () => { window.cancelAnimationFrame(frame); tracker.release() }
  }, [])

  if (!camera) return <p role="status" className="p-8 text-center text-sm text-slate-600">Đang chuẩn bị camera...</p>

  return <FaceLivenessDetector {...props} displayText={vietnameseLivenessText}
    onAnalysisComplete={async () => {
      camera.stop()
      await props.onAnalysisComplete()
    }}
    onError={(...args) => {
      camera.stop()
      props.onError(...args)
    }}
    onUserCancel={() => {
      camera.stop()
      props.onUserCancel()
    }} />
}
