import { useEffect } from 'react'
import { Toaster } from 'sonner'
import AppRouter from './router/AppRouter'
import { useAuthStore } from './store/authStore'

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </>
  )
}
