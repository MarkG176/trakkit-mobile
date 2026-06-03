const SYNC_TAG = 'trakkit-outbox';

export async function registerBackgroundSync(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(SYNC_TAG);
    }
  } catch {
    // Background Sync unsupported or not granted
  }
}

export function listenForBackgroundSyncFlush(onFlush: () => void): () => void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return () => undefined;
  }

  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'FLUSH_OUTBOX') {
      onFlush();
    }
  };

  navigator.serviceWorker.addEventListener('message', handler);
  return () => navigator.serviceWorker.removeEventListener('message', handler);
}
