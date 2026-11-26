import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Part } from '../../Part'
import { useCanvasTexture } from '../../helpers'
import { useKeepRendering } from '../../keepRendering'
import { Bulb, DinModule, PLYWOOD, PorcelainHolder, WallSwitch } from '../electricShared'
import {  estado } from './Instalacion.data'
import type {  InstalacionParams } from './Instalacion.data'
export { estado, instalacionParts } from './Instalacion.data'
export type { Circuito2, Falla, InstalacionParams } from './Instalacion.data'

/* ------------------------------------------------------------------ medidas del tablero de práctica */

const Z = 0.16 // cables apoyados sobre el tablero
const H1: [number, number] = [-1.5, 3.0]
const H2: [number, number] = [3.5, 3.0]
const S1: [number, number] = [-1.5, -2.5]
const S2: [number, number] = [3.5, -2.5]

const COLORS = { fase: '#7c4a21', neutro: '#5ab4e5', retorno: '#1f1f22', tierra: '#3a9a3a', puente: '#d62828' }
type Cond = keyof typeof COLORS

interface Run {
  pts: [number, number][]
  cond: Cond
  /** tramos con corriente según qué lámparas están encendidas */
  on: (h1: boolean, h2: boolean, p: InstalacionParams) => boolean
}

const any = (h1: boolean, h2: boolean) => h1 || h2

function runs(p: InstalacionParams): Run[] {
  const fase: Run = { cond: 'fase', on: any, pts: [[-5.2, 0.2], [-4.3, 0.2], [-4.3, -3.8], [S1[0], -3.8], [S1[0], -3.1]] }
  const n1: Run = { cond: 'neutro', on: (h1) => h1, pts: [[-1.2, 4.4], [-1.2, 2.4]] }
  const n2: Run = { cond: 'neutro', on: (_h1, h2) => h2, pts: [[3.8, 4.4], [3.8, 2.4]] }
  const tierra: Run = { cond: 'tierra', on: () => false, pts: [[-5.2, 1.0], [-4.9, 1.0], [-4.9, 4.8], [4.4, 4.8]] }
  const retS1H1: Run = { cond: 'retorno', on: (h1) => h1, pts: [[S1[0], -1.9], [S1[0], -1.2], [-1.8, -1.2], [-1.8, 2.4]] }
  if (p.circuito === 'simple')
    return [fase, retS1H1, { cond: 'neutro', on: (h1) => h1, pts: [[-5.2, 0.6], [-4.6, 0.6], [-4.6, 4.4], [-1.2, 4.4]] }, n1, tierra]
  if (p.circuito === 'serie')
    return [
      fase,
      retS1H1,
      { cond: 'puente', on: (h1) => h1, pts: [[-1.2, 2.4], [-1.2, 1.6], [3.2, 1.6], [3.2, 2.4]] },
      { cond: 'neutro', on: (_h1, h2) => h2, pts: [[-5.2, 0.6], [-4.6, 0.6], [-4.6, 4.4], [3.8, 4.4]] },
      n2,
      tierra,
    ]
  if (p.circuito === 'paralelo')
    return [
      fase,
      retS1H1,
      { cond: 'retorno', on: (_h1, h2) => h2, pts: [[-1.8, 1.2], [3.2, 1.2], [3.2, 2.4]] },
      { cond: 'neutro', on: any, pts: [[-5.2, 0.6], [-4.6, 0.6], [-4.6, 4.4], [-1.2, 4.4]] },
      { cond: 'neutro', on: (_h1, h2) => h2, pts: [[-1.2, 4.4], [3.8, 4.4]] },
      n1,
      n2,
      tierra,
    ]
  // escalera (combinación): dos conductores "viajeros" entre las llaves
  return [
    fase,
    { cond: 'puente', on: (h1, _h2, q) => h1 && !q.s1, pts: [[S1[0] - 0.25, -1.9], [S1[0] - 0.25, -0.6], [S2[0] - 0.25, -0.6], [S2[0] - 0.25, -1.9]] },
    { cond: 'puente', on: (h1, _h2, q) => h1 && q.s1, pts: [[S1[0] + 0.25, -1.9], [S1[0] + 0.25, -0.9], [S2[0] + 0.25, -0.9], [S2[0] + 0.25, -1.9]] },
    { cond: 'retorno', on: (h1) => h1, pts: [[S2[0], -3.1], [S2[0], -3.5], [4.6, -3.5], [4.6, 1.0], [-1.8, 1.0], [-1.8, 2.4]] },
    { cond: 'neutro', on: (h1) => h1, pts: [[-5.2, 0.6], [-4.6, 0.6], [-4.6, 4.4], [-1.2, 4.4]] },
    n1,
    tierra,
  ]
}

function RunTube({ run }: { run: Run }) {
  const geo = useMemo(() => {
    const path = new THREE.CurvePath<THREE.Vector3>()
    for (let i = 0; i < run.pts.length - 1; i++) {
      const [a, b] = [run.pts[i], run.pts[i + 1]]
      path.add(new THREE.LineCurve3(new THREE.Vector3(a[0], a[1], Z), new THREE.Vector3(b[0], b[1], Z)))
    }
    return new THREE.TubeGeometry(path, run.pts.length * 4, 0.055, 8, false)
  }, [run.pts])
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={COLORS[run.cond]} roughness={0.45} />
    </mesh>
  )
}

/** Puntos que se mueven en los cables con corriente. Es corriente alterna: van y vienen 50 veces por segundo
 *  (acá, mucho más lento para que se vea). */
function Flow({ list }: { list: { pts: [number, number][] }[] }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const t = useRef(0)
  const m = useMemo(() => new THREE.Matrix4(), [])
  const dots = useMemo(() => {
    const out: { a: [number, number]; b: [number, number]; f: number }[] = []
    for (const r of list)
      for (let i = 0; i < r.pts.length - 1; i++) {
        const [a, b] = [r.pts[i], r.pts[i + 1]]
        const len = Math.hypot(b[0] - a[0], b[1] - a[1])
        const n = Math.max(1, Math.round(len / 0.5))
        for (let k = 0; k < n; k++) out.push({ a, b, f: (k + 0.5) / n })
      }
    return out
  }, [list])
  useFrame((_, dt) => {
    const mesh = ref.current
    if (!mesh) return
    t.current += Math.min(dt, 0.05)
    const sway = Math.sin(t.current * 3) * 0.18
    dots.forEach((d, k) => {
      const len = Math.hypot(d.b[0] - d.a[0], d.b[1] - d.a[1]) || 1
      const f = Math.min(1, Math.max(0, d.f + sway / len))
      m.makeTranslation(d.a[0] + (d.b[0] - d.a[0]) * f, d.a[1] + (d.b[1] - d.a[1]) * f, Z + 0.06)
      mesh.setMatrixAt(k, m)
    })
    mesh.instanceMatrix.needsUpdate = true
  })
  if (!dots.length) return null
  return (
    <instancedMesh key={dots.length} ref={ref} args={[undefined, undefined, dots.length]}>
      <sphereGeometry args={[0.07, 8, 6]} />
      <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={1.4} />
    </instancedMesh>
  )
}

/* ------------------------------------------------------------------ piezas */

function DinDevice({ x, label, sub, on, kind }: { x: number; label: string; sub: string; on: boolean; kind: 'dif' | 'pia' }) {
  return (
    <group position={[x, 1.5, 0.2]}>
      <DinModule poles={2} label={label} sub={sub} on={on} kind={kind} scale={0.027} />
    </group>
  )
}

/** Caja octogonal de chapa, portalámparas de porcelana y lámpara de 60 W, mirando hacia afuera de la pared (+z). */
function Lamp({ glow }: { glow: number }) {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.2]} castShadow>
        <cylinderGeometry args={[0.6, 0.6, 0.4, 8]} />
        <meshStandardMaterial color="#8a8f96" metalness={0.6} roughness={0.45} />
      </mesh>
      <group position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <PorcelainHolder scale={0.014} />
        <group position={[0, (36 - 21) * 0.014, 0]}>
          <Bulb glow={glow} scale={0.014} />
        </group>
      </group>
    </group>
  )
}

function SwitchBox({ on, two }: { on: boolean; two?: boolean }) {
  return <WallSwitch on={on} two={two} scale={0.014} />
}

function Spark() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.setScalar(0.6 + Math.abs(Math.sin(clock.elapsedTime * 25)) * 0.8)
  })
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.25, 0]} />
      <meshStandardMaterial color="#fff" emissive="#fde047" emissiveIntensity={4} />
    </mesh>
  )
}


/** Altura del piso (el tablero se cuelga en la pared con su borde de abajo a 80 cm). */
const FLOOR = -5.5 - 8

/** Conductor de tierra con su aislación verde con franjas amarillas. */
const GY_TEX = (() => {
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 16
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#2f9a3c'
  ctx.fillRect(0, 0, 256, 16)
  ctx.fillStyle = '#f2cf1d'
  for (let x = 0; x < 256; x += 64) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + 26, 0)
    ctx.lineTo(x + 40, 16)
    ctx.lineTo(x + 14, 16)
    ctx.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(60, 1)
  return t
})()
const GY_MAT = new THREE.MeshStandardMaterial({ map: GY_TEX ?? undefined, color: GY_TEX ? '#ffffff' : '#3a9a3a', roughness: 0.45 })
const COPPER = new THREE.MeshStandardMaterial({ color: '#c47a4c', metalness: 1, roughness: 0.3 })
const BRONZE = new THREE.MeshStandardMaterial({ color: '#b08d57', metalness: 0.9, roughness: 0.35 })
const CONCRETE = new THREE.MeshStandardMaterial({ color: '#8d8b85', roughness: 0.95 })

/** Bajada de tierra: sale del tablero, baja por la pared engrampada y llega a la jabalina en su cámara. */
function Jabalina() {
  const X = -8.6
  const JZ = 2.9
  const geo = useMemo(() => {
    const pts = [
      [-8.2, 0.6, 0.3],
      [-8.6, 0.6, 0.3],
      [X, -5.2, 0.15],
      [X, -5.7, -0.28],
      [X, FLOOR + 0.6, -0.28],
      [X, FLOOR + 0.12, 0.1],
      [X, FLOOR + 0.12, JZ - 2.0],
      [X, FLOOR + 0.5, JZ - 1.35],
      [X, FLOOR + 0.75, JZ - 0.6],
      [X + 0.2, FLOOR + 0.74, JZ],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z))
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 160, 0.075, 10, false)
  }, [])
  return (
    <group>
      <mesh geometry={geo} material={GY_MAT} castShadow />
      {/* grampas que sujetan el cable a la pared */}
      {[-7.2, -9.2, -11.2].map((y) => (
        <mesh key={y} position={[X, y, -0.3]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.11, 0.025, 6, 16, Math.PI]} />
          <meshStandardMaterial color="#e8e8e4" roughness={0.6} />
        </mesh>
      ))}
      {/* cámara de inspección de hormigón, abierta */}
      <group position={[X, FLOOR, JZ]} scale={1.7}>
        {[
          [0, 0.75, 1.7, 0.2],
          [0, -0.75, 1.7, 0.2],
          [0.75, 0, 0.2, 1.3],
          [-0.75, 0, 0.2, 1.3],
        ].map(([x, z, w, d], i) => (
          <mesh key={i} position={[x, 0.09, z]} material={CONCRETE} castShadow receiveShadow>
            <boxGeometry args={[w, 0.18, d]} />
          </mesh>
        ))}
        {/* tierra y ripio en el fondo */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.32, 1.32]} />
          <meshStandardMaterial color="#3b2f24" roughness={1} />
        </mesh>
        {Array.from({ length: 18 }, (_, i) => (
          <mesh key={i} position={[Math.sin(i * 2.4) * 0.5, 0.05, Math.cos(i * 3.7) * 0.5]} scale={[1, 0.6, 1]}>
            <sphereGeometry args={[0.05 + (i % 3) * 0.02, 8, 6]} />
            <meshStandardMaterial color={i % 2 ? '#7a746b' : '#a19a8e'} roughness={0.9} />
          </mesh>
        ))}
        {/* cabeza de la jabalina y tomacable de bronce */}
        <mesh position={[0, 0.3, 0]} material={COPPER} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.55, 20]} />
        </mesh>
        <mesh position={[0, 0.43, 0]} material={BRONZE}>
          <boxGeometry args={[0.32, 0.16, 0.26]} />
        </mesh>
        <mesh position={[0.2, 0.43, 0]} rotation={[0, 0, Math.PI / 2]} material={BRONZE}>
          <cylinderGeometry args={[0.05, 0.05, 0.14, 6]} />
        </mesh>
        {/* tapa de la cámara apoyada al costado */}
        <mesh position={[1.25, 0.45, -0.2]} rotation={[0, 0, -1.2]} castShadow>
          <boxGeometry args={[0.08, 1.4, 1.4]} />
          <meshStandardMaterial color="#2e7d3a" roughness={0.6} />
        </mesh>
      </group>
    </group>
  )
}

export function InstalacionModel(p: InstalacionParams) {
  const st = estado(p)
  const list = runs(p)
  const active = list.filter((r) => r.on(st.h1, st.h2, p))
  const corto = p.falla === 'cortocircuito' && st.energia
  useKeepRendering(active.length > 0 || corto)
  const tex = useCanvasTexture(
    512,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#b07d4f'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#3b2412'
      ctx.font = 'bold 40px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('F  N  220 V ~', w / 2, h / 2 + 14)
    },
    [],
  )
  return (
    <group position={[0, -0.5, 0]}>
      <Part id="panel" offset={[0, 0, -2.5]} labelAt={[6.5, -4.8, 0.3]}>
        <mesh position={[0, 0, -0.2]} receiveShadow castShadow>
          <boxGeometry args={[18, 11, 0.4]} />
          <meshStandardMaterial map={PLYWOOD ?? undefined} roughness={0.8} />
        </mesh>
        <mesh position={[-6.5, 4.95, 0.01]}>
          <planeGeometry args={[3, 0.75]} />
          <meshStandardMaterial map={tex} roughness={0.85} />
        </mesh>
      </Part>
      <Part id="tablero" offset={[-2, 0, 1.5]} labelAt={[-6.5, 4, 1]}>
        <group position={[-6.5, 1.5, 0]}>
          {/* caja con ventana para los aparatos */}
          <mesh position={[0, 0, 0.3]} castShadow>
            <boxGeometry args={[3.4, 4.2, 0.6]} />
            <meshStandardMaterial color="#d9dce0" metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.62]}>
            <boxGeometry args={[2.6, 0.12, 0.05]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
        {/* acometida */}
        <mesh position={[-6.8, 4.5, Z]}>
          <boxGeometry args={[0.11, 1.8, 0.11]} />
          <meshStandardMaterial color={COLORS.fase} />
        </mesh>
        <mesh position={[-6.2, 4.5, Z]}>
          <boxGeometry args={[0.11, 1.8, 0.11]} />
          <meshStandardMaterial color={COLORS.neutro} />
        </mesh>
      </Part>
      <Part id="diferencial" offset={[-1.5, 0, 3]} labelAt={[-7.1, 3, 2]}>
        <group position={[-7.0, 0, 0]}>
          <DinDevice x={0} label="ID" sub={'2 × 25 A\n30 mA'} on={p.dif} kind="dif" />
        </group>
      </Part>
      <Part id="pia" offset={[0.5, 0, 3]} labelAt={[-6, 3, 2]}>
        <group position={[-6.0, 0, 0]}>
          <DinDevice x={0} label="C10" sub={'2 × 10 A\n3 kA'} on={p.pia} kind="pia" />
        </group>
      </Part>
      <Part id="conductores" offset={[0, 0, 1.2]} labelAt={[0.5, -3.8, 0.4]}>
        {list.map((r, k) => (
          <RunTube key={`${p.circuito}-${k}`} run={r} />
        ))}
        {active.length > 0 && <Flow key={`${p.circuito}-${active.length}-${p.s1}-${p.s2}`} list={active} />}
      </Part>
      <Part id="h1" offset={[0, 1.5, 1.5]} labelAt={[H1[0], H1[1] + 1, 1.5]}>
        <group position={[H1[0], H1[1], 0]}>
          <Lamp glow={st.h1 ? st.glow : 0} />
          {corto && (
            <group position={[0.4, -0.5, 0.6]}>
              <Spark />
            </group>
          )}
        </group>
      </Part>
      {(p.circuito === 'serie' || p.circuito === 'paralelo') && (
        <Part id="h2" offset={[1.5, 1.5, 1.5]} labelAt={[H2[0], H2[1] + 1, 1.5]}>
          <group position={[H2[0], H2[1], 0]}>
            <Lamp glow={st.h2 ? st.glow : 0} />
          </group>
        </Part>
      )}
      <Part id="jabalina" offset={[-1.5, -1, 2]} labelAt={[-8.6, FLOOR + 1.6, 2.4]}>
        <Jabalina />
      </Part>
      <Part id="s1" offset={[0, -1.5, 1.5]} labelAt={[S1[0], S1[1] - 1.1, 1]}>
        <group position={[S1[0], S1[1], 0]}>
          <SwitchBox on={p.s1} two={p.circuito === 'escalera'} />
        </group>
      </Part>
      {p.circuito === 'escalera' && (
        <Part id="s2" offset={[1.5, -1.5, 1.5]} labelAt={[S2[0], S2[1] - 1.1, 1]}>
          <group position={[S2[0], S2[1], 0]}>
            <SwitchBox on={p.s2} two />
          </group>
        </Part>
      )}
    </group>
  )
}
