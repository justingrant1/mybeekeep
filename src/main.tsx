import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializePWA } from './serviceWorkerRegistration'
import { initSecurity } from './lib/security'
import { loadPrivacySettings } from './lib/dataProtection'

// Initialize the full application
if (import.meta.env.PROD) {
  initializePWA();
}
initSecurity();
loadPrivacySettings();

console.log('BeeKeeper Pro initialized');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
