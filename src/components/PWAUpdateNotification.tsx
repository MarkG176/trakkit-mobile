import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, X } from 'lucide-react';
import { setupServiceWorkerListeners } from '@/utils/serviceWorker';

const PWAUpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if service worker update is available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      });
    }

    // Listen for offline data sync events
    const handleOfflineSync = () => {
      console.log('Syncing offline data...');
      // Trigger your existing offline sync logic here
    };

    window.addEventListener('syncOfflineData', handleOfflineSync);

    return () => {
      window.removeEventListener('syncOfflineData', handleOfflineSync);
    };
  }, []);

  const handleUpdate = () => {
    setInstalling(true);
    
    // Skip waiting and reload the page
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <Alert className="bg-primary text-primary-foreground border-primary">
        <Download className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>New app version available!</span>
          <div className="flex gap-2 ml-4">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleUpdate}
              disabled={installing}
              className="text-xs"
            >
              {installing ? 'Updating...' : 'Update'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              disabled={installing}
              className="text-xs hover:bg-primary-foreground/20"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default PWAUpdateNotification;
