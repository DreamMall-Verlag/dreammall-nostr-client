import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/', // Lokale Entwicklung ohne base path
  
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
    minify: false, // Deaktiviere Minifizierung für Debugging
    target: 'es2022',
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        manualChunks: {
          'nostr-tools': ['nostr-tools'], // Isoliere nostr-tools in eigenem Chunk
        },
      },
      // Erweiterte Rollup-Optionen zur Fehlerbehebung
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      },
      // Deaktiviere aggressive Optimierungen
      onwarn: (warning, warn) => {
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        if (warning.code === 'EVAL') return;
        warn(warning);
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
