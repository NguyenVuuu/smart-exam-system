import { Stack } from 'expo-router'

// Guard được xử lý tại từng màn hình qua useRequireAuth
// Sidebar state được lưu trong uiStore (Zustand) — persist across navigation
export default function StudentLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
