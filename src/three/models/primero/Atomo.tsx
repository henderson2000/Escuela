import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Part } from '../../Part'
import { useKeepRendering } from '../../keepRendering'
import { ELEMENTS, SHELL_NAMES, shellsWithCharge } from '../../../primero/electricidad/atoms'

const R_P = 0.16 // radio de protones y neutrones
const R_E = 0.09
const SHELL_R = [1.1, 1.75, 2.45, 3.15]

/** Esferitas del núcleo apiladas en una bola (protones y neutrones mezclados). */
function nucleusPositions(count: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = []
  // espiral de Fibonacci en capas concéntricas
  let placed = 0
  let layer = 0
  while (placed < count) {
    const r = layer === 0 ? 0 : layer * R_P * 1.7
    const n = layer === 0 ? 1 : Math.max(4, Math.round(4 * Math.PI * (r / (R_P * 1.15)) ** 2 * 0.55))
    for (let i = 0; i < n && placed < count; i++, placed++) {
      if (r === 0) {
        pts.push(new THREE.Vector3())
        continue
      }
      const y = 1 - ((i + 0.5) / n) * 2
      const rr = Math.sqrt(1 - y * y)
      const phi = i * 2.399963 + layer
      pts.push(new THREE.Vector3(Math.cos(phi) * rr * r, y * r, Math.sin(phi) * rr * r))
    }
    layer++
  }
  return pts
}

function Nucleus({ protons, neutrons }: { protons: number; neutrons: number }) {
  const pRef = useRef<THREE.InstancedMesh>(null)
  const nRef = useRef<THREE.InstancedMesh>(null)
  const layout = useMemo(() => {
    const pos = nucleusPositions(protons + neutrons)
    // se intercalan para que se vean mezclados
    const isP: boolean[] = []
    let p = protons
    let n = neutrons
    for (let i = 0; i < pos.length; i++) {
      const takeP = p > 0 && (n === 0 || (i % 2 === 0 ? p >= n : p > n))
      isP.push(takeP)
      if (takeP) p--
      else n--
    }
    return { pos, isP }
  }, [protons, neutrons])
  // se acomodan las instancias apenas se montan
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    let ip = 0
    let ineu = 0
    layout.pos.forEach((v, i) => {
      m.makeTranslation(v.x, v.y, v.z)
      if (layout.isP[i]) pRef.current?.setMatrixAt(ip++, m)
      else nRef.current?.setMatrixAt(ineu++, m)
    })
    if (pRef.current) pRef.current.instanceMatrix.needsUpdate = true
    if (nRef.current) nRef.current.instanceMatrix.needsUpdate = true
  }, [layout])
  return (
    <group>
      {protons > 0 && (
        <instancedMesh key={`p${protons}-${neutrons}`} ref={pRef} args={[undefined, undefined, protons]} castShadow>
          <sphereGeometry args={[R_P, 20, 14]} />
          <meshStandardMaterial color="#e5484d" roughness={0.35} />
        </instancedMesh>
      )}
      {neutrons > 0 && (
        <instancedMesh key={`n${protons}-${neutrons}`} ref={nRef} args={[undefined, undefined, neutrons]} castShadow>
          <sphereGeometry args={[R_P, 20, 14]} />
          <meshStandardMaterial color="#9aa3ad" roughness={0.45} />
        </instancedMesh>
      )}
    </group>
  )
}

/** Una capa: órbita circular con sus electrones; gira sola si `spin`. */
function Shell({ index, electrons, valence, spin }: { index: number; electrons: number; valence: boolean; spin: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const r = SHELL_R[index]
  const tilt = [0.35, -0.5, 0.75, -0.25][index]
  useFrame((_, dt) => {
    if (spin && ref.current) ref.current.rotation.y += Math.min(dt, 0.05) * (0.9 / (index + 1))
  })
  const ring = useMemo(() => new THREE.TorusGeometry(r, 0.012, 6, 128), [r])
  return (
    <group rotation={[Math.PI / 2 + tilt * 0.35, 0, tilt]}>
      <mesh geometry={ring} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color={valence ? '#facc15' : '#5b6b80'} transparent opacity={valence ? 0.75 : 0.55} />
      </mesh>
      <group ref={ref}>
        {Array.from({ length: electrons }, (_, i) => {
          const a = (i / electrons) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
              <sphereGeometry args={[R_E, 16, 12]} />
              <meshStandardMaterial color={valence ? '#facc15' : '#3b82f6'} emissive={valence ? '#a16207' : '#1d4ed8'} emissiveIntensity={0.6} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

export interface AtomoParams {
  sym: string
  charge: number
  spin: boolean
}

export function atomParts(p: AtomoParams) {
  const el = ELEMENTS.find((e) => e.sym === p.sym) ?? ELEMENTS[0]
  const shells = shellsWithCharge(el, p.charge)
  return [
    { id: 'nucleo', name: 'Núcleo', desc: `Protones (rojos, carga +) y neutrones (grises, sin carga). ${el.name}: ${el.z} protones y ${el.n} neutrones.` },
    ...shells.map((n, i) => ({
      id: `capa-${SHELL_NAMES[i]}`,
      name: `Capa ${SHELL_NAMES[i]}${i === shells.length - 1 ? ' (valencia)' : ''}`,
      desc:
        i === shells.length - 1
          ? `La capa más externa: tiene ${n} electrón${n === 1 ? '' : 'es'} de valencia (amarillos). Son los que participan en los enlaces y definen cómo conduce el material.`
          : `Capa ${SHELL_NAMES[i]} con ${n} electrones (carga −). Admite hasta ${[2, 8, 18, 32][i]}.`,
    })),
  ]
}

export function AtomoModel(p: AtomoParams) {
  const el = ELEMENTS.find((e) => e.sym === p.sym) ?? ELEMENTS[0]
  const shells = shellsWithCharge(el, p.charge)
  useKeepRendering(p.spin)
  return (
    <group>
      <Part id="nucleo" labelAt={[0, 0.9, 0]}>
        <Nucleus protons={el.z} neutrons={el.n} />
      </Part>
      {shells.map((n, i) => (
        <Part key={`${p.sym}-${i}`} id={`capa-${SHELL_NAMES[i]}`} offset={[0, 1.2 + i * 0.9, 0]} labelAt={[SHELL_R[i], 0.3, 0]}>
          <Shell index={i} electrons={n} valence={i === shells.length - 1} spin={p.spin} />
        </Part>
      ))}
    </group>
  )
}
