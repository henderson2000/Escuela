import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Las librerías grandes van cada una en su propio archivo. Así:
 * - cada página descarga sólo las que usa (three.js sólo en 3D, el editor sólo en los cursos, Blockly sólo en Bloques);
 * - al publicar una versión nueva esos archivos no cambian de nombre y el navegador los sigue usando de su caché:
 *   sólo se vuelve a bajar el código de la plataforma que cambió (unos pocos kB), no los megas de las librerías.
 */
const VENDORS: { name: string; test: RegExp }[] = [
  { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|cookie|set-cookie-parser)[\\/]/ },
  { name: 'three', test: /node_modules[\\/]three[\\/]/ },
  { name: 'r3f', test: /node_modules[\\/](@react-three|three-stdlib|its-fine|react-use-measure|zustand|suspend-react|use-sync-external-store|react-reconciler)[\\/]/ },
  { name: 'codemirror', test: /node_modules[\\/](@codemirror|@lezer|crelt|style-mod|w3c-keyname|@marijn)[\\/]/ },
  { name: 'blockly', test: /node_modules[\\/]blockly[\\/]/ },
  { name: 'acorn', test: /node_modules[\\/](acorn|acorn-walk)[\\/]/ },
]

// base relativa para poder publicarla en GitHub Pages o en cualquier carpeta
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // three.js y Blockly rondan 600 kB cada uno sin comprimir (≈150 kB comprimidos) y se bajan sólo donde se usan
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: VENDORS.map((v, i) => ({ ...v, priority: VENDORS.length - i })),
        },
      },
    },
  },
})
