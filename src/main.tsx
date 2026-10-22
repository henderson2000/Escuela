import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

const rootEl = document.getElementById('root')!

/** Si algo falla antes de que React pueda mostrarlo, se muestra el error en pantalla (en vez de quedar vacía). */
function showFatal(msg: string) {
  if (rootEl.childElementCount > 0 && !rootEl.querySelector('.fatal')) {
    // la app sigue viva: sólo se agrega un aviso arriba
    const bar = document.createElement('div')
    bar.className = 'fatal-bar'
    bar.textContent = '⚠ Error: ' + msg
    document.body.appendChild(bar)
    return
  }
  rootEl.innerHTML = ''
  const box = document.createElement('div')
  box.className = 'fatal'
  const h = document.createElement('h2')
  h.textContent = 'La página no pudo cargar'
  const p = document.createElement('p')
  p.textContent = 'Recargá con Ctrl + F5. Si sigue pasando, mandale este mensaje al docente:'
  const pre = document.createElement('pre')
  pre.textContent = msg
  box.append(h, p, pre)
  rootEl.appendChild(box)
}
window.addEventListener('error', (e) => {
  // avisos inofensivos del navegador que no rompen nada
  if (!e.message || /ResizeObserver/.test(e.message)) return
  showFatal(`${e.message} (${e.filename?.split('/').pop()}:${e.lineno})`)
})
window.addEventListener('unhandledrejection', (e) => showFatal(String((e.reason as Error)?.message ?? e.reason)))

createRoot(rootEl, {
  onUncaughtError: (err) => showFatal((err as Error)?.stack?.split('\n').slice(0, 4).join('\n') ?? String(err)),
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// funciona sin internet lo que ya se abrió (sólo en la versión publicada y fuera de otras páginas)
if (import.meta.env.PROD && 'serviceWorker' in navigator && window.self === window.top) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined)
  })
}
