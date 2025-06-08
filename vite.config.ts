import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['uuid', 'date-fns']
  },
  resolve: {
    alias: {
      uuid: resolve(__dirname, 'node_modules/uuid/dist/esm/index.js'),
      'date-fns': resolve(__dirname, 'node_modules/date-fns/esm/index.js')
    }
  },
  base: '/', // Ensure correct base path for deployment
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    // Enable SPA mode to serve index.html for all routes
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor code from application code
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
        },
      },
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
    // Ensure we're setting a proper publicPath
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true, // Listen on all addresses
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },
  // These settings help with deploying SPA on static hosts
  preview: {
    port: 4173,
    host: true,
    strictPort: true,
  }
})
