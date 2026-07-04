import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    hmr: false  // Désactiver le hot reload (pas de flash blanc)
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
