import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, X } from 'lucide-react';

const PWAUpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Listen for custom event from service worker registration
    const handleSwUpdate = () => {
      console.log('PWA update available detected');
      setUpdateAvailable(true);
    };

    window.addEventListener('sw-update-available', handleSwUpdate);

    // Also check directly for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Check if there's already a waiting worker
        if (registration.waiting) {
          console.log('Found waiting service worker');
          setUpdateAvailable(true);
        }

        // Listen for new updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New service worker installed and waiting');
                setUpdateAvailable(true);
              }
            });
          }
        });
      });

      // Listen for controller change to reload
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }

    return () => {
      window.removeEventListener('sw-update-available', handleSwUpdate);
    };
  }, []);

  const handleUpdate = () => {
    setInstalling(true);
    
    // Tell the waiting service worker to skip waiting
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
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
