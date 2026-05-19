/**
 * Permission utilities for browser permissions and push notifications
 */

export type PermissionType = 'camera' | 'location' | 'storage' | 'microphone' | 'notification';
export type BrowserType = 'ios' | 'samsung' | 'android' | 'other';
export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface PermissionState {
  status: PermissionStatus;
  requestedAt?: number;
  deniedAt?: number;
  dismissed?: boolean;
  dismissedUntil?: number;
}

export interface PermissionStateMap {
  camera: PermissionState;
  location: PermissionState;
  storage: PermissionState;
  microphone: PermissionState;
  notification: PermissionState;
}

/**
 * Detect browser type from user agent
 */
export const getBrowserType = (): BrowserType => {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/SamsungBrowser/.test(ua)) return 'samsung';
  if (/Android/.test(ua)) return 'android';
  return 'other';
};

/**
 * Get current permission status for a specific permission type
 */
export const getPermissionStatus = async (type: PermissionType): Promise<PermissionStatus> => {
  // Check localStorage first for cached status
  const cached = getPermissionStateFromStorage(type);
  if (cached?.status && cached.status !== 'prompt') {
    return cached.status;
  }

  try {
    switch (type) {
      case 'camera':
        return await getCameraPermissionStatus();
      case 'location':
        return getLocationPermissionStatus();
      case 'microphone':
        return await getMicrophonePermissionStatus();
      case 'notification':
        return getNotificationPermissionStatus();
      case 'storage':
        return await getStoragePermissionStatus();
      default:
        return 'unknown';
    }
  } catch (error) {
    console.error(`Error checking ${type} permission:`, error);
    return 'unknown';
  }
};

/**
 * Get all permission statuses
 */
export const getAllPermissionStatuses = async (): Promise<PermissionStateMap> => {
  const types: PermissionType[] = ['camera', 'location', 'storage', 'microphone', 'notification'];
  const result: Partial<PermissionStateMap> = {};

  for (const type of types) {
    const status = await getPermissionStatus(type);
    result[type] = { status };
  }

  return result as PermissionStateMap;
};

/**
 * Request permission for a specific type
 */
export const requestPermission = async (type: PermissionType): Promise<boolean> => {
  try {
    switch (type) {
      case 'camera':
        return await requestCameraPermission();
      case 'location':
        return requestLocationPermission();
      case 'microphone':
        return await requestMicrophonePermission();
      case 'notification':
        return await requestNotificationPermission();
      case 'storage':
        return await requestStoragePermission();
      default:
        return false;
    }
  } catch (error) {
    console.error(`Error requesting ${type} permission:`, error);
    return false;
  }
};

/**
 * Request all permissions at once
 */
export const requestAllPermissions = async (): Promise<{ [key in PermissionType]: boolean }> => {
  const types: PermissionType[] = ['camera', 'location', 'storage', 'microphone', 'notification'];
  const results: any = {};

  for (const type of types) {
    results[type] = await requestPermission(type);
  }

  return results;
};

// ============================================================================
// Permission-specific implementations
// ============================================================================

/**
 * Camera: Attempt to access via navigator.mediaDevices.getUserMedia (lightweight check)
 */
const getCameraPermissionStatus = async (): Promise<PermissionStatus> => {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      return 'unknown';
    }

    // Try to get camera stream to check permission
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1 } });
    stream.getTracks().forEach(track => track.stop());
    return 'granted';
  } catch (error: any) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return 'denied';
    }
    if (error.name === 'NotFoundError' || error.name === 'NoDevicesFoundError') {
      return 'prompt'; // Device not found, but permission not denied
    }
    return 'prompt'; // Likely needs prompt
  }
};

const requestCameraPermission = async (): Promise<boolean> => {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn('getUserMedia not supported');
      return false;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: { min: 1 } } 
    });
    stream.getTracks().forEach(track => track.stop());
    
    savePermissionState('camera', 'granted');
    return true;
  } catch (error: any) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      savePermissionState('camera', 'denied');
    }
    return false;
  }
};

/**
 * Location: Uses Geolocation API
 */
const getLocationPermissionStatus = (): PermissionStatus => {
  if (!navigator.geolocation) {
    return 'unknown';
  }
  
  // Geolocation doesn't expose permission status directly
  // Return cached status or 'prompt'
  const cached = getPermissionStateFromStorage('location');
  return cached?.status || 'prompt';
};

const requestLocationPermission = async (): Promise<boolean> => {
  if (!navigator.geolocation) {
    console.warn('Geolocation not supported');
    return false;
  }

  return new Promise<boolean>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => {
        savePermissionState('location', 'granted');
        resolve(true);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          savePermissionState('location', 'denied');
        }
        resolve(false);
      },
      { timeout: 5000, enableHighAccuracy: false }
    );
  });
};

/**
 * Microphone: Access via navigator.mediaDevices.getUserMedia
 */
const getMicrophonePermissionStatus = async (): Promise<PermissionStatus> => {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      return 'unknown';
    }

    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: { echoCancellation: true },
      video: false 
    });
    stream.getTracks().forEach(track => track.stop());
    return 'granted';
  } catch (error: any) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return 'denied';
    }
    return 'prompt';
  }
};

const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn('getUserMedia not supported');
      return false;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: { echoCancellation: true },
      video: false 
    });
    stream.getTracks().forEach(track => track.stop());
    
    savePermissionState('microphone', 'granted');
    return true;
  } catch (error: any) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      savePermissionState('microphone', 'denied');
    }
    return false;
  }
};

/**
 * Notification: Uses Notification API
 */
const getNotificationPermissionStatus = (): PermissionStatus => {
  if (!('Notification' in window)) {
    return 'unknown';
  }

  const status = Notification.permission as unknown as string;
  return (status === 'default' ? 'prompt' : status) as PermissionStatus;
};

const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Notification API not supported');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    const status = permission === 'default' ? 'prompt' : (permission as PermissionStatus);
    savePermissionState('notification', status);
    
    // If granted, set up push subscription
    if (permission === 'granted') {
      await setupPushSubscription();
    }
    
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Storage: Request persistent storage via StorageManager API
 */
const getStoragePermissionStatus = async (): Promise<PermissionStatus> => {
  try {
    if (!navigator.storage?.estimate) {
      return 'unknown';
    }

    // Check if persistent storage is already granted
    if (navigator.storage.getDirectory) {
      return 'granted';
    }

    // Check cached status
    const cached = getPermissionStateFromStorage('storage');
    return cached?.status || 'prompt';
  } catch (error) {
    return 'prompt';
  }
};

const requestStoragePermission = async (): Promise<boolean> => {
  try {
    if (!navigator.storage?.persist) {
      console.warn('StorageManager.persist not supported');
      return false;
    }

    const persisted = await navigator.storage.persist();
    savePermissionState('storage', persisted ? 'granted' : 'denied');
    return persisted;
  } catch (error) {
    console.error('Error requesting storage permission:', error);
    return false;
  }
};

// ============================================================================
// Push notification setup
// ============================================================================

/**
 * Set up push notification subscription after permission is granted
 */
const setupPushSubscription = async (): Promise<void> => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription
      const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.warn('VAPID public key not configured');
        return;
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      // Send subscription to backend
      await savePushSubscription(subscription);
    }

    console.log('Push subscription active:', subscription);
  } catch (error) {
    console.error('Error setting up push subscription:', error);
  }
};

/**
 * Save push subscription to backend
 */
const savePushSubscription = async (subscription: PushSubscription): Promise<void> => {
  try {
    const response = await fetch('/api/push-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
      }),
    });

    if (!response.ok) {
      console.error('Failed to save push subscription:', response.statusText);
    }
  } catch (error) {
    console.error('Error saving push subscription:', error);
  }
};

/**
 * Convert VAPID key from base64 to Uint8Array
 */
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

// ============================================================================
// Storage utilities
// ============================================================================

const STORAGE_KEY_PREFIX = 'permission_';
const PERMISSION_STATE_KEY = 'permission_states';

export const getPermissionStateFromStorage = (type: PermissionType): PermissionState | null => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${type}`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error(`Error reading permission state for ${type}:`, error);
    return null;
  }
};

export const savePermissionState = (type: PermissionType, status: PermissionStatus): void => {
  try {
    const state: PermissionState = {
      status,
      requestedAt: Date.now(),
    };
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${type}`, JSON.stringify(state));
  } catch (error) {
    console.error(`Error saving permission state for ${type}:`, error);
  }
};

export const dismissPermissionPrompt = (type: PermissionType, hours: number = 24): void => {
  try {
    const state = getPermissionStateFromStorage(type) || { status: 'prompt' };
    state.dismissed = true;
    state.dismissedUntil = Date.now() + hours * 60 * 60 * 1000;
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${type}`, JSON.stringify(state));
  } catch (error) {
    console.error(`Error dismissing permission prompt for ${type}:`, error);
  }
};

export const clearPermissionDismissal = (type: PermissionType): void => {
  try {
    const state = getPermissionStateFromStorage(type) || { status: 'prompt' };
    state.dismissed = false;
    state.dismissedUntil = undefined;
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${type}`, JSON.stringify(state));
  } catch (error) {
    console.error(`Error clearing dismissal for ${type}:`, error);
  }
};

export const isPermissionDismissed = (type: PermissionType): boolean => {
  try {
    const state = getPermissionStateFromStorage(type);
    if (!state?.dismissed) return false;
    
    if (state.dismissedUntil && Date.now() > state.dismissedUntil) {
      // Dismissal expired, clear it
      clearPermissionDismissal(type);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error checking dismissal for ${type}:`, error);
    return false;
  }
};

export const clearAllPermissionStates = (): void => {
  try {
    const types: PermissionType[] = ['camera', 'location', 'storage', 'microphone', 'notification'];
    types.forEach(type => {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${type}`);
    });
  } catch (error) {
    console.error('Error clearing all permission states:', error);
  }
};
