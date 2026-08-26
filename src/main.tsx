import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app/App.tsx'
import './index.css'
import { initErrorReporting } from './lib/error-reporting'
import { registerServiceWorker } from './lib/register-sw'

initErrorReporting()
registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
