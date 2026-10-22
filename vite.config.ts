import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base relativa para poder publicarla en GitHub Pages o en cualquier carpeta
export default defineConfig({
  base: './',
  plugins: [react()],
  // cada taller se descarga aparte; el visor 3D (three.js) y el editor de Computación rondan 1 MB cada uno
  build: { chunkSizeWarningLimit: 1100 },
})
