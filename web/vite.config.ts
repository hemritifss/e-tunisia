import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    open: true,
    host: true,
    allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.ngrok.io'],
    // Same-origin proxy so the dev server can talk to the NestJS backend
    // without tripping Chrome's Private Network Access checks.
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3000', changeOrigin: true },
      // Socket.io: proxy both HTTP handshake and the WS upgrade.
      '/socket.io': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
    },
  },
  preview: {
    port: 4173,
    host: true,
    allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.ngrok.io'],
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react';
          }
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'motion';
          }
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      // PWA enabled for production. Set selfDestroying: true only during active dev.
      selfDestroying: false,
      registerType: 'autoUpdate',
      manifest: {
        name: 'e-Tunisia',
        short_name: 'eTunisia',
        description: 'Discover hidden Tunisia — the ultimate tourism platform',
        theme_color: '#1E5FA8',
        background_color: '#F7F9FC',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // SPA + History API: serve the app shell for client-side routes,
        // but never hijack API / upload / socket requests.
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/uploads/, /^\/socket\.io/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /^https:\/\/api\..*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
          // ── Offline trip mode (Tier 2.3) ──────────────────────────────────
          // Map tiles: cache-first so a route you've panned over renders offline.
          {
            urlPattern: /^https:\/\/[a-d]?\.?basemaps\.cartocdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Trip + place API (same-origin): network-first with an offline fallback,
          // so a trip you opened on wifi still opens on the road.
          {
            urlPattern: ({ url }: any) =>
              url.pathname.startsWith('/api/v1/trips') || url.pathname.startsWith('/api/v1/places'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'trip-data',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Uploaded place images — cache-first so covers show offline.
          {
            urlPattern: ({ url }: any) => url.pathname.startsWith('/uploads'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'uploads',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Weather forecasts — keep the last response for offline trip days.
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'weather',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 12 },
            },
          },
        ],
      },
    }),
  ],
});
