import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/',
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    target: 'es2022',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
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
      '@utils': '/src/utils'
    }
  },

  // Optimization
  optimizeDeps: {
    include: ['nostr-tools']
  }
});
