import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/dreammall-nostr-client/', // Für GitHub Pages
  
  // Global polyfills
  define: {
    'global': 'globalThis', // Polyfill für Node.js-Umgebungen
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    minify: true,
    target: 'es2020',
  },

  // Development server
  server: {
    port: 8081,
    host: '0.0.0.0',
    open: false,
    cors: true
  },

  // Preview server
  preview: {
    port: 8080,
    host: '0.0.0.0',
    open: false
  },

  // Optimierungen
  optimizeDeps: {
    include: ['@noble/hashes', '@noble/curves']
  },

  // Resolve-Konfiguration
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer'
    }
  }
});
