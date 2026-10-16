import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Part } from '../Part'
import { Wire, latheGeometry, tinned } from '../helpers'

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

// LED de 5 mm (1 unidad = 5 mm): cápsula Ø5,0 × 8,6 mm, borde Ø5,8 mm, patas de 0,5 mm a 2,54 mm.
const R = 0.5
const FLANGE_H = 0.2
const BODY_H = 1.52 // altura total de epoxi sobre el borde
const LEG = 0.1 // sección de la pata (0,5 mm)
const PITCH = 0.508 // 2,54 mm
const XA = PITCH / 2 // ánodo a la derecha
const XK = -PITCH / 2 // cátodo a la izquierda

/** mezcla el color con blanco: la resina es un vidrio tintado, no pintura */
function tint(hex: string) {
  return '#' + new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.45).getHexString()
}

export function LedModel({ color, on, brightness = 1 }: LedProps) {
  const c = LED_COLORS[color]
  const glow = on ? brightness : 0
  const light = useRef<THREE.PointLight>(null)
  const chipMat = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(() => {
    if (light.current) light.current.intensity += (glow * 6 - light.current.intensity) * 0.15
  })

  // cápsula: cilindro con cúpula, hecha por revolución (con un leve ensanche abajo)
  const domeGeo = useMemo(() => {
    const prof: [number, number][] = [[0, FLANGE_H]]
    prof.push([R * 0.985, FLANGE_H], [R, FLANGE_H + 0.05], [R, FLANGE_H + BODY_H - R])
    for (let k = 1; k <= 16; k++) {
      const a = (k / 16) * (Math.PI / 2)
      prof.push([R * Math.cos(a), FLANGE_H + BODY_H - R + R * Math.sin(a)])
    }
    return latheGeometry(prof, 64)
  }, [])

  // borde inferior con el lado plano que marca el cátodo
  const flangeGeo = useMemo(() => {
    const s = new THREE.Shape()
    const r = 0.58
    const flatX = -0.5 // lado del cátodo (x negativo)
    const a = Math.acos(flatX / r)
    s.moveTo(flatX, -Math.sqrt(r * r - flatX * flatX))
    s.absarc(0, 0, r, -a, a, false)
    s.lineTo(flatX, -Math.sqrt(r * r - flatX * flatX))
    const g = new THREE.ExtrudeGeometry(s, { depth: FLANGE_H, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2, curveSegments: 64 })
    g.rotateX(-Math.PI / 2)
    return g
  }, [])

  // yunque del cátodo: placa ancha con la copa reflectora arriba
  const anvilGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-LEG / 2, 0)
    s.lineTo(LEG / 2, 0)
    s.lineTo(LEG / 2, 0.5)
    s.lineTo(0.2, 0.62)
    s.lineTo(0.2, 1.0)
    s.lineTo(-0.16, 1.0)
    s.lineTo(-0.16, 0.62)
    s.lineTo(-LEG / 2, 0.5)
    s.closePath()
    return new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false })
  }, [])

  // poste del ánodo: placa angosta con la punta inclinada
  const postGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-LEG / 2, 0)
    s.lineTo(LEG / 2, 0)
    s.lineTo(LEG / 2, 0.55)
    s.lineTo(0.08, 0.6)
    s.lineTo(0.08, 1.12)
    s.lineTo(-0.12, 1.2)
    s.lineTo(-0.12, 0.6)
    s.lineTo(-LEG / 2, 0.55)
    s.closePath()
    return new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false })
  }, [])

  const cupGeo = useMemo(
    () => latheGeometry([[0.0, 0], [0.09, 0], [0.18, 0.13], [0.2, 0.13], [0.11, -0.02], [0, -0.02]], 40),
    [],
  )

  const epoxy = (
    <meshPhysicalMaterial
      color={tint(c.hex)}
      transmission={0.95}
      thickness={0.35}
      roughness={0.04}
      ior={1.5}
      attenuationColor={c.hex}
      attenuationDistance={2.5}
      emissive={c.hex}
      emissiveIntensity={glow * 0.22}
      clearcoat={1}
      clearcoatRoughness={0.05}
    />
  )
  const leadMat = <meshStandardMaterial {...tinned} />

  return (
    <group position={[0, -0.4, 0]}>
      <pointLight ref={light} position={[0, 1.4, 0]} color={c.hex} intensity={0} distance={8} />

      <Part id="capsula" offset={[0, 1.7, 0]} labelAt={[0.9, 1.4, 0]}>
        <mesh geometry={domeGeo}>{epoxy}</mesh>
      </Part>

      <Part id="borde" offset={[0, 1.05, 0]} labelAt={[-0.95, 0.1, 0]}>
        <mesh geometry={flangeGeo}>{epoxy}</mesh>
      </Part>

      {/* yunque: pieza grande del cátodo con la copa reflectora */}
      <Part id="yunque" offset={[-0.7, 0.3, 0]} labelAt={[-0.7, 1.0, 0]}>
        <mesh geometry={anvilGeo} position={[XK, 0.0, -0.03]}>
          {leadMat}
        </mesh>
        <mesh geometry={cupGeo} position={[XK + 0.02, 1.0, 0]}>
          <meshStandardMaterial color="#e6e8ec" metalness={1} roughness={0.15} side={THREE.DoubleSide} />
        </mesh>
      </Part>

      <Part id="chip" offset={[0, 0.7, 0.6]} labelAt={[0.15, 1.35, 0.4]}>
        <mesh position={[XK + 0.02, 1.04, 0]}>
          <boxGeometry args={[0.07, 0.05, 0.07]} />
          <meshStandardMaterial ref={chipMat} color="#3a3a3a" emissive={c.hex} emissiveIntensity={glow * 5} />
        </mesh>
      </Part>

      <Part id="poste" offset={[0.7, 0.3, 0]} labelAt={[0.7, 1.0, 0]}>
        <mesh geometry={postGeo} position={[XA, 0.0, -0.03]}>
          {leadMat}
        </mesh>
      </Part>

      <Part id="hilo" offset={[0.3, 1.0, 0.3]} labelAt={[0.15, 1.45, 0]}>
        <Wire points={[[XK + 0.02, 1.07, 0], [XK + 0.1, 1.42, 0], [XA - 0.1, 1.38, 0], [XA - 0.06, 1.2, 0]]} radius={0.006} color="#e8c56a" smooth={0.5} />
      </Part>

      {/* patas: sección cuadrada, con un ensanche ("tope") a 1 mm del borde */}
      <Part id="anodo" offset={[0.5, -0.5, 0]} labelAt={[0.7, -1.9, 0]}>
        <Wire points={[[XA, 0.02, 0], [XA, -0.3, 0], [XA, -3.6, 0]]} radius={LEG * 0.7} square smooth={0} {...tinned} />
        <mesh position={[XA, -0.24, 0]}>
          <boxGeometry args={[0.2, 0.08, LEG]} />
          {leadMat}
        </mesh>
      </Part>

      <Part id="catodo" offset={[-0.5, -0.5, 0]} labelAt={[-0.7, -1.6, 0]}>
        <Wire points={[[XK, 0.02, 0], [XK, -0.3, 0], [XK, -3.1, 0]]} radius={LEG * 0.7} square smooth={0} {...tinned} />
        <mesh position={[XK, -0.24, 0]}>
          <boxGeometry args={[0.2, 0.08, LEG]} />
          {leadMat}
        </mesh>
      </Part>
    </group>
  )
}
