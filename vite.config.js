import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/dreammall-nostr-client/', // GitHub Pages base URL
  
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
    host: true,
    cors: true
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src',
      '@services': '/src/services',
      '@styles': '/src/styles',
      '@utils': '/src/utils',
      // Polyfills für Node.js-Module
      'buffer': 'buffer',
      'crypto': 'crypto-browserify',
      'stream': 'stream-browserify',
    }
  },

  // Optimization
  optimizeDeps: {
    include: ['nostr-tools', 'buffer', 'crypto-browserify', 'stream-browserify']
  }
});
