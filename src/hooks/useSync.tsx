import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { flushOutbox, subscribeOutboxFlush, requestFlush } from '@/services/offline/flushOutbox';
import { getOutboxCounts, listActiveOutbox } from '@/services/offline/outboxStore';
import { isOnline, isSyncPaused, setSyncPaused } from '@/services/offline/connectivity';
import { listenForBackgroundSyncFlush } from '@/services/offline/backgroundSync';
import { clearStore, STORES } from '@/services/offline/indexedDb';
import { useWorkspace } from './useWorkspace';

interface SyncContextValue {
  online: boolean;
  syncPaused: boolean;
  pendingCount: number;
  failedCount: number;
  blockedCount: number;
  isFlushing: boolean;
  setSyncPaused: (paused: boolean) => void;
  flush: () => Promise<void>;
  clearOfflineCache: () => Promise<void>;
  activeItems: Awaited<ReturnType<typeof listActiveOutbox>>;
  refreshCounts: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const { currentWorkspaceId } = useWorkspace();
  const [online, setOnline] = useState(isOnline());
  const [syncPaused, setSyncPausedState] = useState(isSyncPaused());
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [isFlushing, setIsFlushing] = useState(false);
  const [activeItems, setActiveItems] = useState<
    Awaited<ReturnType<typeof listActiveOutbox>>
  >([]);

  const refreshCounts = useCallback(async () => {
    const counts = await getOutboxCounts(currentWorkspaceId ?? undefined);
    setPendingCount(counts.pending);
    setFailedCount(counts.failed);
    setBlockedCount(counts.blocked);
    const items = await listActiveOutbox(currentWorkspaceId ?? undefined);
    setActiveItems(items);
  }, [currentWorkspaceId]);

  const flush = useCallback(async () => {
    setIsFlushing(true);
    try {
      await flushOutbox(currentWorkspaceId ?? undefined);
      await refreshCounts();
    } finally {
      setIsFlushing(false);
    }
  }, [currentWorkspaceId, refreshCounts]);

  const handleSetSyncPaused = useCallback(
    (paused: boolean) => {
      setSyncPaused(paused);
      setSyncPausedState(paused);
      if (!paused && isOnline()) {
        void flush();
      }
    },
    [flush]
  );

  const clearOfflineCache = useCallback(async () => {
    await clearStore(STORES.outbox);
    await refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      void flush();
    };
    const onOffline = () => setOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const unsubFlush = subscribeOutboxFlush(() => {
      void refreshCounts();
    });

    const unsubBg = listenForBackgroundSyncFlush(() => {
      void flush();
    });

    if (isOnline() && !isSyncPaused()) {
      void flush();
    }

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      unsubFlush();
      unsubBg();
    };
  }, [flush, refreshCounts]);

  const value = useMemo(
    () => ({
      online,
      syncPaused,
      pendingCount,
      failedCount,
      blockedCount,
      isFlushing,
      setSyncPaused: handleSetSyncPaused,
      flush,
      clearOfflineCache,
      activeItems,
      refreshCounts,
    }),
    [
      online,
      syncPaused,
      pendingCount,
      failedCount,
      blockedCount,
      isFlushing,
      handleSetSyncPaused,
      flush,
      clearOfflineCache,
      activeItems,
      refreshCounts,
    ]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export const useSync = (): SyncContextValue => {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error('useSync must be used within SyncProvider');
  }
  return ctx;
};

export { requestFlush };
