import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'

import { Toaster } from '@/components/ui/sonner'
import '@/lib/i18n'
import { queryClient, setUnauthorizedHandler } from '@/lib/query-client'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    })
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  )
}
