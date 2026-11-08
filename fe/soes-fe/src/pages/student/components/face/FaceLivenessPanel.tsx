import { Amplify } from 'aws-amplify'
import { FaceLivenessDetector, type FaceLivenessDetectorProps } from '@aws-amplify/ui-react-liveness'
import '@aws-amplify/ui-react/styles.css'

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
  return <FaceLivenessDetector {...props} />
}
