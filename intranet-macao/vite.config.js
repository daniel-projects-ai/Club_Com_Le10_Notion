import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Port imposé : le backend n'autorise que http://localhost:3001 comme
  // origine intranet (ORIGINES_INTRANET). Sur le 5173 par défaut de Vite,
  // le CORS bloquerait tous les appels en local.
  server: { port: 3001 },
})
