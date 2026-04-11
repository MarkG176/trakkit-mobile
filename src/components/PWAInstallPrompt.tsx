import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Smartphone, Share, MoreVertical } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type DeviceType = 'ios' | 'samsung' | 'android' | 'other';

const detectDevice = (): DeviceType => {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/SamsungBrowser/.test(ua)) return 'samsung';
  if (/Android/.test(ua)) return 'android';
  return 'other';
};

const isStandaloneMode = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true;
};

const isInIframeOrPreview = (): boolean => {
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  return window.location.hostname.includes('id-preview--') ||
    window.location.hostname.includes('lovableproject.com');
};

const DISMISS_KEY = 'pwa-install-dismissed-at';

const isDismissedRecently = (): boolean => {
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;
  const elapsed = Date.now() - parseInt(dismissed, 10);
  return elapsed < 24 * 60 * 60 * 1000; // 24 hours
};

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isStandaloneMode());
  const [device] = useState<DeviceType>(detectDevice);
  const [dismissed, setDismissed] = useState(isDismissedRecently());

  useEffect(() => {
    if (isInIframeOrPreview()) return;

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const mq = window.matchMedia('(display-mode: standalone)');
    const handleMqChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);
    mq.addEventListener('change', handleMqChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      mq.removeEventListener('change', handleMqChange);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setDismissed(true);
  };

  if (isInstalled || isInIframeOrPreview() || dismissed) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    } catch (err) {
      console.error('Install prompt error:', err);
    }
  };

  const renderContent = () => {
    // Android/Chrome with native prompt available
    if (deferredPrompt) {
      return (
        <div className="flex items-start space-x-3">
          <div className="bg-primary-foreground/20 p-2 rounded-lg flex-shrink-0">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Install TraKKiT</h3>
            <p className="text-xs opacity-90 mb-3">
              Add to your home screen for quick access
            </p>
            <Button size="sm" variant="secondary" onClick={handleInstallClick} className="text-xs">
              <Download className="h-3 w-3 mr-1" />
              Install App
            </Button>
          </div>
        </div>
      );
    }

    if (device === 'ios') {
      return (
        <div className="flex items-start space-x-3">
          <div className="bg-primary-foreground/20 p-2 rounded-lg flex-shrink-0">
            <Share className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Install TraKKiT</h3>
            <p className="text-xs opacity-90">
              Tap the <strong>Share</strong> button <span className="inline-block">□↑</span> at the bottom of your browser, then tap <strong>"Add to Home Screen"</strong>
            </p>
          </div>
        </div>
      );
    }

    if (device === 'samsung') {
      return (
        <div className="flex items-start space-x-3">
          <div className="bg-primary-foreground/20 p-2 rounded-lg flex-shrink-0">
            <MoreVertical className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Install TraKKiT</h3>
            <p className="text-xs opacity-90">
              Tap the <strong>menu</strong> (⋮), then <strong>"Add page to"</strong> → <strong>"Home screen"</strong>
            </p>
          </div>
        </div>
      );
    }

    // Generic fallback
    return (
      <div className="flex items-start space-x-3">
        <div className="bg-primary-foreground/20 p-2 rounded-lg flex-shrink-0">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Install TraKKiT</h3>
          <p className="text-xs opacity-90">
            Use your browser menu to add this app to your home screen
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <Card className="bg-primary text-primary-foreground border-primary shadow-lg">
        <CardContent className="p-4">
          {renderContent()}
          <div className="flex justify-end mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10 text-xs px-2 py-1 h-auto"
              onClick={handleDismiss}
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt;
