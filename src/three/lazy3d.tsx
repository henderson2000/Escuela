import { lazy, Suspense, type ComponentProps, type ComponentType } from 'react'
import { loadModule } from '../lib/lazy'
import type { Viewer as ViewerType } from './Viewer'

/**
 * Modelo 3D que se descarga recién cuando se dibuja. Así las páginas de texto (teoría, guía, juegos de preguntas)
 * no esperan a three.js: el modelo llega después, dentro del visor, que ya sabe esperarlo.
 * Uso: const TornoModel = lazyModel(() => import('./models/Torno'), 'TornoModel')
 */
export function lazyModel<M, K extends keyof M>(load: () => Promise<M>, name: K): M[K] {
  return lazy(() => loadModule(load).then((m) => ({ default: m[name] as unknown as ComponentType<any> }))) as unknown as M[K]
}

const ViewerImpl = lazy(() => loadModule(() => import('./Viewer')).then((m) => ({ default: m.Viewer })))

/** El visor 3D, descargado aparte: mientras llega se ve el recuadro vacío (con el mismo tamaño). */
export function Viewer(props: ComponentProps<typeof ViewerType>) {
  return (
    <Suspense fallback={<div className={props.className ?? 'viewer'} />}>
      <ViewerImpl {...props} />
    </Suspense>
  )
}
