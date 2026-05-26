import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8081,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        // Nécessaire pour que le backend reçoive localhost:8080 comme Host,
        // sinon le redirect URI OAuth serait construit avec le mauvais port.
        changeOrigin: true,
        // Supprime le préfixe /api avant de transmettre au backend
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    }
  }
})