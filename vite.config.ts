import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base relativa para poder publicarla en GitHub Pages o en cualquier carpeta
export default defineConfig({
  base: './',
  plugins: [react()],
  // three.js pesa ~1 MB: es esperable que el bundle supere el límite por defecto
  build: { chunkSizeWarningLimit: 2000 },
})
