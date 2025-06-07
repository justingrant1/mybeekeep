// This function registers our service worker for PWA functionality

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
          
          // Check for updates on each load
          registration.update();
          
          // Set up a periodic update check
          setInterval(() => {
            registration.update();
            console.log('Checking for service worker updates...');
          }, 1000 * 60 * 60); // Check for updates every hour
        })
        .catch(error => {
          console.error('ServiceWorker registration failed: ', error);
        });
    });
  }
}

// This function handles service worker updates and prompts the user
export function handleServiceWorkerUpdates() {
  if ('serviceWorker' in navigator) {
    // Handle new content available
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // This fires when the service worker controlling this page
      // changes, e.g., a new service worker has skipped waiting
      // and become the new active service worker.
      console.log('New service worker activated, reloading for fresh content...');
      window.location.reload();
    });
    
    // When a service worker update is ready, optionally show a prompt to the user
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'UPDATE_READY') {
        // You could display a notification or prompt here
        console.log('App update is ready!');
        
        // For instance, show a banner:
        const updateBanner = document.createElement('div');
        updateBanner.style.position = 'fixed';
        updateBanner.style.bottom = '0';
        updateBanner.style.left = '0';
        updateBanner.style.right = '0';
        updateBanner.style.padding = '10px';
        updateBanner.style.backgroundColor = '#f5a623';
        updateBanner.style.color = 'white';
        updateBanner.style.textAlign = 'center';
        updateBanner.style.zIndex = '9999';
        updateBanner.innerHTML = `
          App update available! <button id="update-app-btn" style="margin-left: 10px; padding: 5px 10px; border: none; background: white; color: #f5a623; border-radius: 4px;">Update</button>
        `;
        
        document.body.appendChild(updateBanner);
        
        // Listen for click on update button
        document.getElementById('update-app-btn')?.addEventListener('click', () => {
          // Tell the service worker to skipWaiting which triggers the controllerchange event
          navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
        });
      }
    });
  }
}

// This function checks if the app is in standalone (installed) mode
export function isRunningStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

// This function checks if the device is mobile
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Function to show an "Add to Home Screen" prompt for iOS
export function showIOSInstallPrompt() {
  if (isMobileDevice() && !isRunningStandalone() && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream) {
    const installPrompt = document.createElement('div');
    installPrompt.style.position = 'fixed';
    installPrompt.style.bottom = '0';
    installPrompt.style.left = '0';
    installPrompt.style.right = '0';
    installPrompt.style.padding = '15px';
    installPrompt.style.backgroundColor = '#f5a623';
    installPrompt.style.color = 'white';
    installPrompt.style.textAlign = 'center';
    installPrompt.style.zIndex = '9999';
    installPrompt.style.boxShadow = '0 -2px 5px rgba(0,0,0,0.1)';
    installPrompt.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="text-align: left;">
          <div style="font-weight: bold; margin-bottom: 5px;">Install BeeKeeper Pro</div>
          <div>Add to Home Screen for offline access</div>
        </div>
        <button id="ios-install-close" style="background: transparent; border: 1px solid white; color: white; padding: 5px 10px; border-radius: 4px;">
          Close
        </button>
      </div>
      <div style="margin-top: 10px; font-size: 0.9em;">
        Tap <span style="font-size: 1.4em; vertical-align: middle;">⎙</span> and then "Add to Home Screen"
      </div>
    `;
    
    document.body.appendChild(installPrompt);
    
    document.getElementById('ios-install-close')?.addEventListener('click', () => {
      installPrompt.style.display = 'none';
      // Remember user's choice in localStorage
      localStorage.setItem('pwa-install-prompt-dismissed', 'true');
    });
  }
}

// Initialize all PWA features
export function initializePWA() {
  registerServiceWorker();
  handleServiceWorkerUpdates();
  
  // Check for installation prompt (only show if not dismissed before)
  if (!localStorage.getItem('pwa-install-prompt-dismissed')) {
    setTimeout(() => {
      showIOSInstallPrompt();
    }, 3000); // Show prompt after 3 seconds
  }
}
