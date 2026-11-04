import { Stack } from 'expo-router'

// Guard được xử lý tập trung ở app/index.tsx
// Layout này chỉ wrap stack navigator
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
