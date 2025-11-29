import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    target: ['es2020', 'edge88', 'firefox78', 'safari14', 'chrome87'],
    rollupOptions: {
      output: {
        manualChunks: {
          'pdfjs': ['pdfjs-dist']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist']
  }
})
