import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { MotionProvider } from './components/ui/MotionProvider'
import './index.css'
import App from './App.tsx'

const registerPwaWorker = () => {
  registerSW({ immediate: true })
}

if (typeof window.requestIdleCallback === 'function') {
  window.requestIdleCallback(() => registerPwaWorker())
} else {
  window.addEventListener('load', registerPwaWorker, { once: true })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionProvider>
      <App />
    </MotionProvider>
  </StrictMode>,
)
