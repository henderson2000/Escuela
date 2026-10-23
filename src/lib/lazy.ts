import { lazy, type ComponentType } from 'react'

const RELOAD_KEY = 'its-villada-recargado'

/**
 * Importa un módulo de la app. Si falla porque se publicó una versión nueva mientras la página estaba
 * abierta (los archivos viejos ya no existen), recarga la página una vez para traer la nueva.
 */
export function loadModule<T>(load: () => Promise<T>): Promise<T> {
  return load().then(
    (m) => {
      try {
        sessionStorage.removeItem(RELOAD_KEY)
      } catch {
        /* sin almacenamiento */
      }
      return m
    },
    (err) => {
      let reloaded = false
      try {
        reloaded = sessionStorage.getItem(RELOAD_KEY) === '1'
        if (!reloaded) sessionStorage.setItem(RELOAD_KEY, '1')
      } catch {
        reloaded = true
      }
      if (!reloaded) {
        location.reload()
        return new Promise<T>(() => undefined)
      }
      throw new Error('No se pudo descargar una parte de la página. Revisá la conexión a internet y recargá con Ctrl + F5.', { cause: err })
    },
  )
}

/** Componente que se descarga recién cuando se usa (para un export con nombre). */
export function lazyNamed<M, K extends keyof M>(load: () => Promise<M>, name: K) {
  return lazy(() => loadModule(load).then((m) => ({ default: m[name] as unknown as ComponentType })))
}

/** Descarga algo de fondo cuando el navegador está libre (para que el próximo clic abra al instante). */
export function prefetchWhenIdle(load: () => Promise<unknown>) {
  const run = () => void load().catch(() => undefined)
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
  if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 4000 })
  else window.setTimeout(run, 1500)
}
