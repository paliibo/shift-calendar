import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import './style.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Офлайн-кеш лише у зібраній версії: у режимі розробки він підсовував би старі модулі.
// Шлях відносний до BASE_URL, бо сайт живе в підтеці.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}
