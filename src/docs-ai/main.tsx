import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './docs-ai.css'
import { DocsAiApp } from './DocsAiApp'

createRoot(document.getElementById('docs-ai-root')!).render(
  <StrictMode>
    <DocsAiApp />
  </StrictMode>,
)
