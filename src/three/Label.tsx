import { createContext, useContext, type ComponentProps, type RefObject } from 'react'
import { Html } from '@react-three/drei'

/** Capa HTML propia de cada visor: las etiquetas se montan acá y no dentro del contenedor del canvas
 *  (evita errores de React al desmontar el visor). */
export const HtmlLayerContext = createContext<RefObject<HTMLDivElement | null> | null>(null)

export function Label(props: ComponentProps<typeof Html>) {
  const layer = useContext(HtmlLayerContext)
  return <Html {...props} portal={(layer as RefObject<HTMLElement>) ?? undefined} />
}
