import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializePWA } from './serviceWorkerRegistration'
import { initSecurity } from './lib/security'
import { loadPrivacySettings } from './lib/dataProtection'

// Add debugging logs
console.log('Starting app initialization...');

// Initialize the full application
if (import.meta.env.PROD) {
  console.log('Production mode detected, initializing PWA...');
  initializePWA();
}

console.log('Initializing security...');
initSecurity();
console.log('Security initialized');

// Get the root element
const rootElement = document.getElementById('root');
console.log('Root element found:', rootElement);

if (!rootElement) {
  console.error('Failed to find root element!');
  throw new Error('Failed to find root element');
}

try {
  console.log('Creating React root...');
  const root = createRoot(rootElement);
  
  console.log('Rendering app...');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log('App rendered successfully');
} catch (error) {
  console.error('Failed to render app:', error);
  // Display error message in the UI
  rootElement.innerHTML = `
    <div style="padding: 20px; color: red;">
      <h1>Error Starting App</h1>
      <pre>${error instanceof Error ? error.message : 'Unknown error'}</pre>
    </div>
  `;
}
