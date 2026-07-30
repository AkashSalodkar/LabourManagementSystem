// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://localhost:7029',
        changeOrigin: true,
        secure: false, // Disable SSL verification for development
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
