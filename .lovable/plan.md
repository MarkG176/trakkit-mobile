

## Make PWA Install Banner Permanent with Device-Specific Instructions

### Problem
The current install prompt can be dismissed, has a 24-hour cooldown, and shows the same generic UI on all devices. iOS users see an "Install" button that does nothing because Safari doesn't support `beforeinstallprompt`.

### What Changes

**1. Delete `src/components/InstallPrompt.tsx`** and remove its import/usage from `App.tsx`. Consolidate everything into `PWAInstallPrompt.tsx`.

**2. Rewrite `src/components/PWAInstallPrompt.tsx`** with:

- **Device detection** using `navigator.userAgent`:
  - **iOS** (iPhone/iPad Safari): Detect via `/iPhone|iPad|iPod/` user agent
  - **Android Chrome**: Detect via `/Android/` user agent + `beforeinstallprompt` support
  - **Samsung Internet**: Detect via `/SamsungBrowser/`
  - **Other browsers**: Generic fallback

- **Platform-specific instructions**:
  - **Android/Chrome**: Show "Install" button that triggers `deferredPrompt.prompt()`. If user dismisses native prompt, banner stays.
  - **iOS Safari**: Show step-by-step: "Tap the Share button (□↑), then tap 'Add to Home Screen'"
  - **Samsung Internet**: Show: "Tap the menu (⋮), then 'Add page to' → 'Home screen'"
  - **Other**: Show generic "Use your browser menu to add this app to your home screen"

- **Permanent until installed**:
  - Remove "Later" button, X button, `localStorage` cooldown, and 30-second timeout
  - Show immediately on mount (no delay)
  - Only hide when `display-mode: standalone` or `navigator.standalone` is true
  - Listen for `appinstalled` event and `display-mode` media query changes

- **Skip in iframe/preview** contexts (Lovable editor) to avoid interference

**3. Update `src/App.tsx`**: Remove `InstallPrompt` import and `<InstallPrompt />` usage. Keep only `<PWAInstallPrompt />`.

### Technical Details

```text
Device Detection Flow:
  userAgent contains "iPhone|iPad|iPod"  →  iOS instructions (Share → Add to Home Screen)
  userAgent contains "SamsungBrowser"    →  Samsung instructions (Menu → Add page to)
  beforeinstallprompt fires              →  Android/Chrome native install button
  none of the above                      →  Generic browser menu instructions
```

- Standalone detection: `matchMedia('(display-mode: standalone)')` + `(navigator as any).standalone`
- Banner renders as a fixed bottom card, always visible, no close mechanism
- Files modified: `PWAInstallPrompt.tsx`, `App.tsx`
- Files deleted: `InstallPrompt.tsx`

