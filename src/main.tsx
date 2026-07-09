import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ErrorFallback } from './components/ErrorFallback'

const root = createRoot(document.getElementById('root')!)

async function bootstrap() {
  try {
    const { default: App } = await import('./App.tsx')
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    )
  } catch (error) {
    root.render(<ErrorFallback error={error} />)
  }
}

bootstrap()
