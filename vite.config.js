import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
      },
      external: ['react-router-dom', 'pdfjs-dist/build/pdf.worker.entry']
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/characters': 'http://localhost:3001',
    }
  }
})

