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
        // Split large third-party libraries into long-lived vendor chunks so
        // app-code changes don't force re-downloading all dependencies.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-router") || id.includes("react-dom") || /[\\/]react[\\/]/.test(id)) {
            return "react-vendor";
          }
          if (id.includes("@supabase")) return "supabase-vendor";
          if (id.includes("@tanstack")) return "tanstack-vendor";
          if (id.includes("@react-google-maps") || id.includes("@googlemaps")) return "maps-vendor";
          if (id.includes("@radix-ui")) return "radix-vendor";
          if (id.includes("date-fns")) return "date-vendor";
          if (id.includes("lucide-react")) return "icons-vendor";
          return undefined;
        },
      },
    },
  },
}));
