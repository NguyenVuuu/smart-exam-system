import { Toaster } from 'sonner'
import AppRouter from './router/AppRouter'
import { useInitAuth } from './auth/hooks/useInitAuth'

export default function App() {
  useInitAuth()

  return (
    <>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </>
  )
}
