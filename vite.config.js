import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: './index.vite.html',
      },
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/characters': 'http://localhost:3001',
    }
  }
})
