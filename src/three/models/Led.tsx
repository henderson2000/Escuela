import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Part } from '../Part'
import { Wire, metal } from '../helpers'

export const LED_COLORS = {
  rojo: { label: 'Rojo', hex: '#ff2a2a', vf: 2.0, lambda: '620–630 nm' },
  naranja: { label: 'Naranja', hex: '#ff7a1a', vf: 2.1, lambda: '600–610 nm' },
  amarillo: { label: 'Amarillo', hex: '#ffd21a', vf: 2.1, lambda: '585–595 nm' },
  verde: { label: 'Verde', hex: '#2aff5a', vf: 2.2, lambda: '520–570 nm' },
  azul: { label: 'Azul', hex: '#2a6bff', vf: 3.2, lambda: '460–470 nm' },
  blanco: { label: 'Blanco', hex: '#f4f7ff', vf: 3.2, lambda: 'espectro amplio' },
} as const
export type LedColor = keyof typeof LED_COLORS

export interface LedProps {
  color: LedColor
  on: boolean
  /** 0..1 brillo (depende de la corriente) */
  brightness?: number
}

const R = 0.5
const H = 1.22

export function LedModel({ color, on, brightness = 1 }: LedProps) {
  const c = LED_COLORS[color]
  const glow = on ? brightness : 0
  const light = useRef<THREE.PointLight>(null)

  useFrame(() => {
    if (light.current) light.current.intensity += (glow * 6 - light.current.intensity) * 0.15
  })

  // borde inferior con el lado plano que marca el cátodo
  const flangeGeo = useMemo(() => {
    const s = new THREE.Shape()
    const r = 0.58
    const flatX = -0.5 // lado del cátodo (x negativo)
    const a = Math.acos(flatX / r) // ángulo donde el círculo corta la recta x = flatX
    s.moveTo(flatX, -Math.sqrt(r * r - flatX * flatX))
    s.absarc(0, 0, r, -a, a, false)
    s.lineTo(flatX, -Math.sqrt(r * r - flatX * flatX))
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: false, curveSegments: 48 })
    g.rotateX(-Math.PI / 2)
    return g
  }, [])

  const epoxy = (
    <meshPhysicalMaterial
      color={c.hex}
      transparent
      opacity={0.42}
      roughness={0.1}
      transmission={0}
      emissive={c.hex}
      emissiveIntensity={glow * 0.9}
      depthWrite={false}
    />
  )

  return (
    <group position={[0, -0.4, 0]}>
      <pointLight ref={light} position={[0, 1.2, 0]} color={c.hex} intensity={0} distance={8} />

      <Part id="capsula" offset={[0, 2.2, 0]} labelAt={[0.9, 1.4, 0]}>
        <mesh position={[0, 0.18 + H / 2, 0]} renderOrder={2}>
          <cylinderGeometry args={[R, R, H, 48, 1, true]} />
          {epoxy}
        </mesh>
        <mesh position={[0, 0.18 + H, 0]} renderOrder={2}>
          <sphereGeometry args={[R, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          {epoxy}
        </mesh>
      </Part>

      <Part id="borde" offset={[0, 1.4, 0]} labelAt={[-0.95, 0.1, 0]}>
        <mesh geometry={flangeGeo} renderOrder={2}>
          {epoxy}
        </mesh>
      </Part>

      {/* yunque: pieza grande del cátodo con la copa reflectora */}
      <Part id="yunque" offset={[-0.9, 0.4, 0]} labelAt={[-0.7, 1.0, 0]}>
        <mesh position={[-0.2, 0.55, 0]}>
          <boxGeometry args={[0.36, 0.8, 0.08]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        <mesh position={[-0.1, 1.0, 0]}>
          <cylinderGeometry args={[0.2, 0.12, 0.14, 24, 1, true]} />
          <meshStandardMaterial {...metal} side={THREE.DoubleSide} />
        </mesh>
      </Part>

      <Part id="chip" offset={[0, 0.9, 0.6]} labelAt={[0.15, 1.35, 0.4]}>
        <mesh position={[-0.1, 1.0, 0]}>
          <boxGeometry args={[0.09, 0.07, 0.09]} />
          <meshStandardMaterial color="#333" emissive={c.hex} emissiveIntensity={glow * 4} />
        </mesh>
      </Part>

      <Part id="poste" offset={[0.9, 0.4, 0]} labelAt={[0.7, 1.0, 0]}>
        <mesh position={[0.22, 0.6, 0]}>
          <boxGeometry args={[0.16, 0.9, 0.08]} />
          <meshStandardMaterial {...metal} />
        </mesh>
      </Part>

      <Part id="hilo" offset={[0.4, 1.3, 0.3]} labelAt={[0.15, 1.45, 0]}>
        <Wire points={[[-0.1, 1.04, 0], [0.0, 1.32, 0], [0.18, 1.22, 0], [0.22, 1.05, 0]]} radius={0.008} color="#e8c56a" />
      </Part>

      <Part id="anodo" offset={[0.6, -0.8, 0]} labelAt={[0.65, -1.8, 0]}>
        <Wire points={[[0.254, 0.25, 0], [0.254, -2.8, 0]]} radius={0.045} />
      </Part>

      <Part id="catodo" offset={[-0.6, -0.8, 0]} labelAt={[-0.65, -1.6, 0]}>
        <Wire points={[[-0.254, 0.25, 0], [-0.254, -2.4, 0]]} radius={0.045} />
      </Part>
    </group>
  )
}
