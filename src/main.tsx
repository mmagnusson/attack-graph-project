import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applySharedLinkToStorage } from './hooks/sharedLink'

// A shared link seeds persisted state before the first render
applySharedLinkToStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
