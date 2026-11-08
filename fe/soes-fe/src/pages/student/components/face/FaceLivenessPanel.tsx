import { useEffect, useState } from 'react'
import { Amplify } from 'aws-amplify'
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness'
import '@aws-amplify/ui-react/styles.css'

interface Props {
  identityPoolId: string
  sessionId: string
  region: string
  onAnalysisComplete: () => Promise<void>
  onError: () => void
  onUserCancel: () => void
}

export default function FaceLivenessPanel({ identityPoolId, ...props }: Props) {
  const [configuredPoolId, setConfiguredPoolId] = useState<string | null>(null)

  useEffect(() => {
    Amplify.configure({ Auth: { Cognito: { identityPoolId, allowGuestAccess: true } } })
    setConfiguredPoolId(identityPoolId)
  }, [identityPoolId])

  if (configuredPoolId !== identityPoolId) return null
  return <FaceLivenessDetector {...props} />
}
