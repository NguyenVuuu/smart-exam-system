import { Redirect } from 'expo-router'

export default function QuestionApprovalsRedirect() {
  return <Redirect href="/(app)/(teacher)/approvals?tab=questions" />
}
