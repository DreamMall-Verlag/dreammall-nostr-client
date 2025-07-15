import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  root: '.',
  base: '/', // GitHub Pages base path is always root
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    target: 'es2022', // Changed from es2020 to support top-level await
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },

  // ESBuild configuration - explicitly handle .js files
  esbuild: {
    include: /\.(js|ts|jsx|tsx)$/,
    exclude: [],
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    target: 'es2022' // Changed from es2020 to support top-level await
  },

  // Development server
  server: {
    port: 8081,
    host: '0.0.0.0',
    open: false,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    fs: {
      allow: ['..', '.', './src', './public']
    },
    // Fix MIME type issues
    middlewareMode: false,
    hmr: {
      overlay: false
    },
    // Ensure proper MIME types for JS modules
    mime: {
      'application/javascript': ['js'],
      'text/javascript': ['js']
    }
  },

  // Preview server
  preview: {
    port: 8080,
    host: true,
    cors: true
  },

  // Plugins
  plugins: [
    // Legacy browser support
    legacy({
      targets: ['defaults', 'not IE 11']
    }),

    // PWA Configuration
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'jsdelivr-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheKeyWillBeUsed: async ({ request }) => {
                return `${request.url}`;
              }
            }
          }
        ]
      },
      manifest: {
        name: 'DreamMall NOSTR Client',
        short_name: 'DreamMall',
        description: 'Decentralized messaging with NOSTR protocol',
        theme_color: '#667eea',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'assets/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'assets/icon-512.png', 
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['social', 'communication'],
        screenshots: [
          {
            src: 'assets/screenshot-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: 'assets/screenshot-narrow.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ]
      }
    })
  ],

  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src',
      '@services': '/src/services',
      '@styles': '/src/styles',
      '@utils': '/src/utils'
    }
  },

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },

  // CSS configuration
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      css: {
        charset: false
      }
    }
  },

  // Optimization
  optimizeDeps: {
    include: ['nostr-tools'],
    exclude: ['@noble/secp256k1']
  },

  // Worker and WASM support
  worker: {
    format: 'es'
  }
});
