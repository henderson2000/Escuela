import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

/**
 * El visor 3D sólo dibuja cuando algo cambia (para no gastar la computadora con la escena quieta).
 * Los modelos con una animación que sigue sola (un motor girando, un LED que parpadea…) llaman a este
 * hook con `active = true` mientras la animación dura, y el visor sigue dibujando cuadro a cuadro.
 */
export function useKeepRendering(active: boolean, fps?: number) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (!active) return
    invalidate()
    // animaciones lentas (un LED que parpadea): basta con unos pocos cuadros por segundo
    if (fps) {
      const id = window.setInterval(() => invalidate(), 1000 / fps)
      return () => window.clearInterval(id)
    }
  }, [active, fps, invalidate])
  useFrame(() => {
    if (active && !fps) invalidate()
  })
}
