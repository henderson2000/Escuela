import { createContext, useContext, useRef, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Label } from './Label'
import type { Group } from 'three'

export type Vec3 = [number, number, number]

/** Estado compartido entre todas las partes de un modelo 3D. */
export interface PartsState {
  /** 0 = armado, 1 = totalmente despiezado */
  explode: number
  /** mostrar etiquetas con el nombre de cada parte */
  labels: boolean
  /** partes ocultas */
  hidden: Record<string, boolean>
  /** parte seleccionada (se resalta su etiqueta) */
  selected: string | null
  onSelect?: (id: string) => void
  /** parte marcada con un "?" (juego de identificar partes) */
  quizTarget?: string | null
  /** nombres legibles de las partes */
  names: Record<string, string>
}

export const PartsContext = createContext<PartsState>({
  explode: 0,
  labels: false,
  hidden: {},
  selected: null,
  names: {},
})

export const useParts = () => useContext(PartsContext)

interface PartProps {
  id: string
  /** hacia dónde se mueve la pieza al despiezar */
  offset?: Vec3
  /** posición base de la pieza */
  position?: Vec3
  /** dónde va la etiqueta (relativa a la pieza) */
  labelAt?: Vec3
  /** algunas partes se dibujan en dos grupos; sólo uno lleva etiqueta */
  noLabel?: boolean
  children: ReactNode
}

export function Part({ id, offset = [0, 0, 0], position = [0, 0, 0], labelAt = [0, 0, 0], noLabel, children }: PartProps) {
  const ctx = useParts()
  const ref = useRef<Group>(null)

  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const k = 1 - Math.exp(-dt * 8)
    g.position.x += (position[0] + offset[0] * ctx.explode - g.position.x) * k
    g.position.y += (position[1] + offset[1] * ctx.explode - g.position.y) * k
    g.position.z += (position[2] + offset[2] * ctx.explode - g.position.z) * k
  })

  const visible = !ctx.hidden[id]
  const selected = ctx.selected === id
  const isQuiz = ctx.quizTarget === id

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!ctx.onSelect) return
    e.stopPropagation()
    ctx.onSelect(id)
  }

  return (
    <group
      ref={ref}
      position={position}
      visible={visible}
      onClick={visible ? onClick : undefined}
      onPointerOver={(e) => {
        if (!ctx.onSelect || !visible) return
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {children}
      {visible && !noLabel && (ctx.labels || selected || isQuiz) && (
        <Label position={labelAt} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className={`part-label ${selected ? 'selected' : ''} ${isQuiz ? 'quiz' : ''}`}>
            {isQuiz ? '?' : ctx.names[id] ?? id}
          </div>
        </Label>
      )}
    </group>
  )
}
