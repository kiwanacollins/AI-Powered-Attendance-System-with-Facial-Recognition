import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Configure CORS for development
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  // Configure public directory handling
  publicDir: 'public',
  build: {
    outDir: 'dist',
    // Copy the models directory as-is to the output directory
    assetsInlineLimit: 0
  },
  // Resolve paths for imports
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    }
  }
})
