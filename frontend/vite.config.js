import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In development, /api is proxied to the local backend (port 5050; 5000 is often taken by Windows/macOS services) so no CORS setup is needed.
    proxy: {
      '/api': 'http://localhost:5050',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
})
