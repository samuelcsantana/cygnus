import { Component, type ErrorInfo, type ReactNode } from 'react'

import { reportError } from '@/lib/error-reporting'

import { ErrorFallback } from './ErrorFallback'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * React only supports error boundaries via class components — there is no
 * hook or function-component equivalent for getDerivedStateFromError /
 * componentDidCatch. This is the one legitimate exception to this codebase's
 * function-components-only rule.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportError(error, { componentStack: errorInfo.componentStack })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReload={() => window.location.assign('/')} />
    }
    return this.props.children
  }
}
