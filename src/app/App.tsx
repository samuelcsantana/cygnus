import { RouterProvider } from 'react-router-dom'

import { AppProviders } from './providers/AppProviders'
import { ErrorBoundary } from './ErrorBoundary'
import { router } from './router'

export function App() {
  return (
    <AppProviders>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </AppProviders>
  )
}
