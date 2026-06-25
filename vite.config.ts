import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { execSync } from "node:child_process";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// Derive a build-stable version from the current commit instead of Date.now(),
// which changed on every build and needlessly invalidated the service-worker
// precache. Falls back gracefully when git isn't available.
const appVersion = (() => {
  try {
    const sha = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    return `1.0.0-${sha}`;
  } catch {
    return "1.0.0";
  }
})();

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'placeholder.svg'],
      manifest: {
        name: 'TraKKiT Mobile',
        short_name: 'TraKKiT',
        description: 'Sales agent management and tracking application',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'
          },
          {
            src: '/placeholder.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Purge precache entries from prior builds so mobile/PWA clients stop
        // requesting chunk hashes that no longer exist (the blank-screen cause).
        cleanupOutdatedCaches: true,
        // Activate the new service worker immediately after deploy instead of
        // waiting for all tabs to close, so clients get the fresh module graph.
        clientsClaim: true,
        skipWaiting: true,
        // SPA deep links resolve to the current shell rather than a 404.
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/auth\/callback/],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/skafzkzjaszxgqryzhjp\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Collapse all third-party code into a single `vendor` chunk. Splitting
        // vendors previously left React's named exports (forwardRef, etc.)
        // undefined due to a cross-chunk init-order race, and produced many
        // independently-hashed chunks that could go stale on mobile/PWA caches
        // (blank white screen). One vendor chunk removes both failure modes.
        manualChunks(id) {
          if (id.includes("node_modules")) return "vendor";
          return undefined;
        },
      },
    },
  },

}));
