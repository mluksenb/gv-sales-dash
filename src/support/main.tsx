import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './support.css'
import { SupportApp } from './SupportApp'

createRoot(document.getElementById('support-root')!).render(
  <StrictMode>
    <SupportApp />
  </StrictMode>,
)
