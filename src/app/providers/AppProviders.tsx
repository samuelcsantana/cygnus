import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'

import { Toaster } from '@/components/ui/sonner'
import '@/lib/i18n'
import { reportRequestError } from '@/lib/error-reporting'
import { queryClient, setRequestErrorHandler, setUnauthorizedHandler } from '@/lib/query-client'

import { ThemeProvider } from './ThemeProvider'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    setRequestErrorHandler(reportRequestError)
    setUnauthorizedHandler(() => {
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    })
    return () => setRequestErrorHandler(null)
  }, [])

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
