import { useEffect } from 'react'
import { Toaster } from 'sonner'
import AppRouter from './router/AppRouter'
import { useInitAuth } from './auth/hooks/useInitAuth'
import { useSystemSettingsStore } from './store/systemSettingsStore'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  useInitAuth()
  const fetchPublicSettings = useSystemSettingsStore((state) => state.fetchPublicSettings)

  useEffect(() => {
    fetchPublicSettings()
  }, [fetchPublicSettings])

  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  )
}
