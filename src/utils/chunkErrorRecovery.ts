/**
 * Recovery helpers for failed dynamic-import (code-split chunk) loads.
 *
 * On mobile / installed PWAs a stale service-worker or HTTP cache can serve an
 * outdated HTML/module graph that references chunk hashes which no longer exist
 * after a redeploy. The dynamic `import()` then rejects with errors like
 * "error loading dynamically imported module ..." and, with no boundary above
 * <Suspense>, the app renders a blank white screen.
 *
 * These helpers detect such failures, purge caches + service workers, and
 * reload once (guarded against reload loops) so the fresh module graph loads.
 */

const CHUNK_ERROR_PATTERNS = [
  "failed to fetch dynamically imported module",
  "error loading dynamically imported module",
  "importing a module script failed",
  "unable to preload css",
];

/** True when an error looks like a code-split chunk / dynamic import failure. */
export const isChunkLoadError = (err: unknown): boolean => {
  if (!err) return false;
  const message =
    err instanceof Error
      ? `${err.name} ${err.message}`
      : typeof err === "string"
        ? err
        : (() => {
            try {
              return String((err as { message?: unknown })?.message ?? err);
            } catch {
              return "";
            }
          })();
  const normalized = message.toLowerCase();
  return CHUNK_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern));
};

const RELOAD_GUARD_KEY = "chunk-reload-ts";
const RELOAD_WINDOW_MS = 10_000;

/**
 * Clears caches + service workers and reloads the page once. Guarded so a
 * genuinely broken deploy cannot cause an infinite reload loop: if we already
 * attempted a reload within RELOAD_WINDOW_MS, we bail and let the error
 * boundary show a manual "Refresh app" screen instead.
 *
 * @returns true if a reload was triggered, false if suppressed by the guard.
 */
export const attemptChunkRecovery = async (): Promise<boolean> => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
    if (Date.now() - last < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    // sessionStorage may be unavailable (private mode); proceed without guard.
  }

  try {
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // ignore cache purge failures
  }

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } catch {
    // ignore service worker unregister failures
  }

  window.location.reload();
  return true;
};

/**
 * Installs global listeners that recover from chunk load failures even when
 * they happen before React mounts (a true white-screen scenario). Safe to call
 * once at startup.
 */
export const installChunkErrorHandlers = (): void => {
  // Vite fires this when a dynamically imported module fails to preload.
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    void attemptChunkRecovery();
  });

  window.addEventListener("error", (event) => {
    if (isChunkLoadError(event.error ?? event.message)) {
      void attemptChunkRecovery();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkLoadError(event.reason)) {
      void attemptChunkRecovery();
    }
  });
};
