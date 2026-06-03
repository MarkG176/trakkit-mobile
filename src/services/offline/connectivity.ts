const SYNC_PAUSED_KEY = 'trakkit_sync_paused';

let syncPaused = false;

try {
  syncPaused = localStorage.getItem(SYNC_PAUSED_KEY) === 'true';
} catch {
  syncPaused = false;
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function isSyncPaused(): boolean {
  return syncPaused;
}

export function setSyncPaused(paused: boolean): void {
  syncPaused = paused;
  try {
    if (paused) {
      localStorage.setItem(SYNC_PAUSED_KEY, 'true');
    } else {
      localStorage.removeItem(SYNC_PAUSED_KEY);
    }
  } catch {
    // ignore
  }
}

export function isOfflineModeEnabled(): boolean {
  try {
    return localStorage.getItem(SYNC_PAUSED_KEY) !== 'true';
  } catch {
    return true;
  }
}
