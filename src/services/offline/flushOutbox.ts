import { isOnline, isSyncPaused } from './connectivity';
import { listPendingOutbox, updateOutboxItem, removeOutboxItem } from './outboxStore';
import { syncOutboxItem, classifySyncError, MAX_ATTEMPTS } from './syncHandlers';
import { registerBackgroundSync } from './backgroundSync';

let flushing = false;
const listeners = new Set<() => void>();

export function subscribeOutboxFlush(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(): void {
  listeners.forEach((l) => l());
}

export async function flushOutbox(workspaceId?: string): Promise<{
  synced: number;
  failed: number;
}> {
  if (!isOnline() || isSyncPaused()) {
    return { synced: 0, failed: 0 };
  }

  if (flushing) return { synced: 0, failed: 0 };
  flushing = true;

  let synced = 0;
  let failed = 0;

  try {
    const all = await listPendingOutbox(workspaceId);
    for (const item of all.filter((i) => i.status === 'syncing')) {
      await updateOutboxItem(item.id, { status: 'pending' });
    }
    const pending = await listPendingOutbox(workspaceId);
    for (const item of pending.filter((i) => i.status === 'failed')) {
      await updateOutboxItem(item.id, { status: 'pending', lastError: undefined });
    }
    const toProcess = await listPendingOutbox(workspaceId);

    for (const item of toProcess) {
      if (!isOnline() || isSyncPaused()) break;

      await updateOutboxItem(item.id, { status: 'syncing' });

      try {
        await syncOutboxItem(item);
        await removeOutboxItem(item.id);
        synced++;
      } catch (error) {
        const status = classifySyncError(error);
        const attempts = item.attempts + 1;
        const lastError =
          error instanceof Error ? error.message : String(error);

        await updateOutboxItem(item.id, {
          status: attempts >= MAX_ATTEMPTS && status === 'failed' ? 'failed' : status,
          attempts,
          lastError,
        });

        if (status === 'failed') failed++;
      }
    }
  } finally {
    flushing = false;
    notifyListeners();
  }

  return { synced, failed };
}

export async function enqueueAndMaybeFlush(
  workspaceId: string,
  afterEnqueue?: () => void
): Promise<void> {
  await registerBackgroundSync();
  afterEnqueue?.();

  if (isOnline() && !isSyncPaused()) {
    await flushOutbox(workspaceId);
  }
  notifyListeners();
}

export function requestFlush(workspaceId?: string): void {
  void flushOutbox(workspaceId);
}
