import { Toaster } from 'sonner'
import AppRouter from './router/AppRouter'
import { useInitAuth } from './auth/hooks/useInitAuth'
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

  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  )
}
