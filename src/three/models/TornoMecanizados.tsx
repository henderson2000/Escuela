import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Line, RoundedBox } from '@react-three/drei'
import { Part, type Vec3 } from '../Part'
import { gearGeometry, useCanvasTexture } from '../helpers'
import {
  B,
  BED,
  BedSection,
  Brida,
  Broca,
  Chuck3,
  CylX,
  Handwheel,
  InteriorBarra,
  InteriorInserto,
  InteriorTornillo,
  Lever,
  M,
  MandrilCono,
  MandrilCuerpo,
  MandrilMordazas,
  MechaCentrar,
  MoletaCuerpo,
  PernoArrastre,
  PlatoLiso,
  Portainserto,
  PuntoFijo,
  PuntoGiratorioCuerpo,
  PuntoGiratorioPunta,
  RoscarAsiento,
  RoscarCuerpo,
  RoscarInserto,
  RoscarTornillo,
  TronzarBloque,
  TronzarCuchilla,
  TronzarInserto,
  boxesGeometry,
  revolve,
} from './TornoAccesorios'
import { useKeepRendering } from '../keepRendering'
import { D, TAN30, clamp, FR, kFrente, CI, kCil, PE, kPerf, CO, kCon, CP, CP_TH, CP_E, kCP, RA, kRan, RO, kRos, MO, kMol, IN, kInt, f } from './TornoMecanizados.data'
import type { XZ, MecParams } from './TornoMecanizados.data'
export { OP_DURATION, opReadouts } from './TornoMecanizados.data'
export type { OpId, MecParams } from './TornoMecanizados.data'

/* ------------------------------------------------------------------ */
/* Mecanizados en el torno (animados).                                 */
/* Mismas convenciones que Torno.tsx: 1 unidad = 10 mm, todo ×0,1.     */
/* x = eje del torno (plato a la izquierda), y = arriba (eje en y=18), */
/* z = hacia el operario. La herramienta trabaja adelante (+z).        */
/* Las mordazas del plato terminan en x = 0.                           */
/* ------------------------------------------------------------------ */

type P2 = [number, number]
const AXIS = BED.center
const S = 0.1
const CHUCK_X = -9.8
const X0 = -3 // comienzo de la barra (dentro de las mordazas)
const SPIN = 7 // rad/s "de pantalla"
const SQ3 = Math.sqrt(3)

/* ================================================================== carro portaherramientas */

/** Posición del carro: torre (tx, tz, giro trot) y base del charriot (cx, cz, giro cang). */
interface Rig {
  tx: number
  tz: number
  trot: number
  cx: number
  cz: number
  cang: number
}

/** Gira (x, z) alrededor de y como lo hace three.js (rotation.y = a). */
function rotXZ(x: number, z: number, a: number): XZ {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [x * c + z * s, -x * s + z * c]
}

/**
 * Ubica el carro para que la punta de la herramienta (T en el sistema de la torre) quede en `tip`.
 * `slide` = cuánto se corrió el carro superior (charriot) por su guía, hacia −x local.
 */
function rigAt(tip: XZ, T: Vec3, trot = 0, cang = 0, slide = 0): Rig {
  const [ox, oz] = rotXZ(T[0], T[2], trot)
  const tx = tip[0] - ox
  const tz = tip[1] - oz
  const [sx, sz] = rotXZ(-slide, 0, cang)
  return { tx, tz, trot, cx: tx - sx, cz: tz - sz, cang }
}

 // de la punta de la mecha de centrar al origen del mandril
 // desplazamiento de la contrapunta
/* ================================================================== contexto de la escena */

type Sub = { current: (p: number) => void }

interface StageCtx {
  prog: { current: number }
  angle: { current: number }
  subs: Set<Sub>
  tracks: Map<string, Set<THREE.Group>>
}

const Ctx = createContext<StageCtx | null>(null)
const useStage = () => useContext(Ctx)!

/** Llama a `cb(p)` cada vez que cambia el progreso (o los parámetros de la operación). */
function useOnProg(cb: (p: number) => void) {
  const ctx = useStage()
  const ref = useRef(cb)
  ref.current = cb
  useEffect(() => {
    ctx.subs.add(ref)
    return () => {
      ctx.subs.delete(ref)
    }
  }, [ctx])
}

/** Grupo que se mueve por código (lo ubica la operación cada cuadro). */
function Track({ name, children }: { name: string; children: ReactNode }) {
  const ctx = useStage()
  const ref = useRef<THREE.Group>(null)
  useEffect(() => {
    const g = ref.current
    if (!g) return
    let set = ctx.tracks.get(name)
    if (!set) ctx.tracks.set(name, (set = new Set()))
    set.add(g)
    return () => {
      set.delete(g)
    }
  }, [ctx, name])
  return <group ref={ref}>{children}</group>
}

function setTrack(ctx: StageCtx, name: string, x: number, y: number, z: number, ry = 0, visible?: boolean) {
  ctx.tracks.get(name)?.forEach((g) => {
    g.position.set(x, y, z)
    g.rotation.y = ry
    if (visible !== undefined) g.visible = visible
  })
}

/** Gira con el ángulo compartido del husillo (k = relación de giro). El origen del grupo ES el eje. */
function Rot({ k = 1, children }: { k?: number; children: ReactNode }) {
  const ctx = useStage()
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (ref.current) ref.current.rotation.x = ctx.angle.current * k
  })
  return <group ref={ref}>{children}</group>
}

/* ================================================================== carteles y flechas */

let measureCtx: CanvasRenderingContext2D | null = null
function textWidth(text: string, font: string) {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d')
  if (!measureCtx) return text.length * 26
  measureCtx.font = font
  return measureCtx.measureText(text).width
}

function Tag({ text, position, color = '#ffffff', size = 1.2 }: { text: string; position: Vec3; color?: string; size?: number }) {
  const font = 'bold 44px Arial, sans-serif'
  const w = Math.ceil(textWidth(text, font) + 40)
  const h = 72
  const tex = useCanvasTexture(
    w,
    h,
    (ctx, W, H) => {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(16,21,31,0.8)'
      const r = 20
      ctx.beginPath()
      ctx.moveTo(r, 2)
      ctx.arcTo(W - 2, 2, W - 2, H - 2, r)
      ctx.arcTo(W - 2, H - 2, 2, H - 2, r)
      ctx.arcTo(2, H - 2, 2, 2, r)
      ctx.arcTo(2, 2, W - 2, 2, r)
      ctx.fill()
      ctx.fillStyle = color
      ctx.font = font
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, W / 2, H / 2 + 2)
    },
    [text, color, w],
  )
  return (
    <sprite position={position} scale={[(size * w) / h, size, 1]} renderOrder={12}>
      <spriteMaterial map={tex} transparent depthTest={false} />
    </sprite>
  )
}

const UP = new THREE.Vector3(0, 1, 0)

function ArrowHead({ at, dir, color, r = 0.35, l = 0.9 }: { at: Vec3; dir: Vec3; color: string; r?: number; l?: number }) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(UP, new THREE.Vector3(...dir).normalize()), [dir])
  return (
    <mesh position={at} quaternion={q} renderOrder={11}>
      <coneGeometry args={[r, l, 16]} />
      <meshBasicMaterial color={color} depthTest={false} transparent />
    </mesh>
  )
}

export interface ArrowSpec {
  dir: Vec3
  color: string
  label: string
  /** origen de la flecha respecto de la punta de la herramienta */
  at: Vec3
  len?: number
  labelAt?: Vec3
}

function StraightArrow({ a }: { a: ArrowSpec }) {
  const len = a.len ?? 3
  const d = new THREE.Vector3(...a.dir).normalize()
  const end: Vec3 = [a.at[0] + d.x * len, a.at[1] + d.y * len, a.at[2] + d.z * len]
  const shaftEnd: Vec3 = [end[0] - d.x * 0.8, end[1] - d.y * 0.8, end[2] - d.z * 0.8]
  const head: Vec3 = [end[0] - d.x * 0.45, end[1] - d.y * 0.45, end[2] - d.z * 0.45]
  const lab = a.labelAt ?? [end[0], end[1] + 0.9, end[2]]
  return (
    <group>
      <Line points={[a.at, shaftEnd]} color={a.color} lineWidth={4} depthTest={false} transparent renderOrder={11} />
      <ArrowHead at={head} dir={[d.x, d.y, d.z]} color={a.color} />
      <Tag text={a.label} position={lab} color={a.color} size={1.05} />
    </group>
  )
}

/** Flecha curva del movimiento de corte (giro de la pieza): media vuelta de hélice alrededor del eje, desde x. */
function SpinArrow({ x, r, label = 'corte (giro)' }: { x: number; r: number; label?: string }) {
  const color = '#ff7a59'
  const a0 = -150 * D
  const a1 = 150 * D
  // anillo alrededor del eje, inclinado 50° (visto de frente se ve como una elipse que rodea la barra)
  const tl = 50 * D
  const P = (a: number): Vec3 => {
    const z = r * Math.sin(a)
    return [x + z * Math.sin(tl), AXIS + r * Math.cos(a), z * Math.cos(tl)]
  }
  const pts: Vec3[] = Array.from({ length: 41 }, (_, i) => P(a0 + ((a1 - 0.3 - a0) * i) / 40))
  const tip = P(a1)
  const back = P(a1 - 0.3)
  const dir: Vec3 = [tip[0] - back[0], tip[1] - back[1], tip[2] - back[2]]
  return (
    <group>
      <Line points={pts} color={color} lineWidth={4} depthTest={false} transparent renderOrder={11} />
      <ArrowHead at={tip} dir={dir} color={color} />
      <Tag text={label} position={[x, AXIS + r + 1.2, 0]} color={color} size={1.05} />
    </group>
  )
}

export const C_AV = '#5ad67d'
export const C_PEN = '#5fb0ff'

/* ================================================================== virutas */

const CHIP_N = 26

function chipGeometries() {
  return [0, 1, 2].map((v) => {
    const pts: THREE.Vector3[] = []
    const turns = 1.4 + v * 0.7
    const n = 26
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const a = t * turns * Math.PI * 2
      const r = 0.16 + 0.12 * t + v * 0.03
      pts.push(new THREE.Vector3(t * (0.45 + v * 0.2) - 0.25, Math.cos(a) * r, Math.sin(a) * r))
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 36, 0.045, 4, false)
  })
}

const CHIP_MATS = [
  new THREE.MeshStandardMaterial({ color: '#c9a86a', metalness: 0.85, roughness: 0.35 }),
  new THREE.MeshStandardMaterial({ color: '#5f72a8', metalness: 0.85, roughness: 0.3 }),
  new THREE.MeshStandardMaterial({ color: '#b9bcc2', metalness: 0.9, roughness: 0.3 }),
]

interface ChipState {
  age: number
  life: number
  v: THREE.Vector3
  w: THREE.Vector3
}

export type ChipEmit = { pos: Vec3; vel: Vec3 }

/* ================================================================== escenario común */

interface Kin {
  rig: Rig
  tip: XZ
  cutting: boolean
  angle?: number
}

interface StageProps {
  target: number
  version: string
  flechas: boolean
  update: (p: number) => Kin
  chip?: (k: Kin) => ChipEmit | null
  arrows: ArrowSpec[]
  spin?: { x: number; r: number }
  note?: { text: string; at: Vec3; color?: string }
  children: ReactNode
}

function Stage({ target, version, flechas, update, chip, arrows, spin, note, children }: StageProps) {
  const ctx = useMemo<StageCtx>(() => ({ prog: { current: target }, angle: { current: 0 }, subs: new Set(), tracks: new Map() }), [])
  // la pieza gira siempre mientras se muestra la operación
  useKeepRendering(true)
  const omega = useRef(0)
  const lastVersion = useRef<string | null>(null)
  const arrowsRef = useRef<THREE.Group>(null)
  const chipRefs = useRef<(THREE.Mesh | null)[]>([])
  const chips = useRef<ChipState[]>(Array.from({ length: CHIP_N }, () => ({ age: 1, life: 0, v: new THREE.Vector3(), w: new THREE.Vector3() })))
  const acc = useRef(0)
  const next = useRef(0)
  const chipGeos = useMemo(chipGeometries, [])
  useEffect(() => () => chipGeos.forEach((g) => g.dispose()), [chipGeos])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const prev = ctx.prog.current
    let p = prev
    if (target < prev - 0.2) p = target
    else {
      p += (target - p) * (1 - Math.exp(-dt * 10))
      if (Math.abs(target - p) < 1e-4) p = target
    }
    ctx.prog.current = p
    const dp = p - prev
    const k = update(p)
    if (k.angle !== undefined) {
      omega.current = 0
      ctx.angle.current = k.angle
    } else {
      omega.current += (SPIN - omega.current) * (1 - Math.exp(-dt * 2.5))
      ctx.angle.current += omega.current * dt
    }
    const r = k.rig
    setTrack(ctx, 'saddle', r.cx, 0, 0)
    setTrack(ctx, 'cross', r.cx, 0, r.cz)
    setTrack(ctx, 'cbase', r.cx, 0, r.cz, r.cang)
    setTrack(ctx, 'tslide', r.tx, 0, r.tz, r.cang)
    setTrack(ctx, 'torre', r.tx, 0, r.tz, r.trot)
    if (arrowsRef.current) arrowsRef.current.position.set(k.tip[0], AXIS, k.tip[1])
    if (dp !== 0 || lastVersion.current !== version) {
      lastVersion.current = version
      ctx.subs.forEach((s) => s.current(p))
    }
    // virutas
    if (chip && k.cutting && Math.abs(dp) > 1e-6) {
      acc.current += dt
      while (acc.current > 1 / 18) {
        acc.current -= 1 / 18
        const e = chip(k)
        if (!e) continue
        const i = next.current
        next.current = (i + 1) % CHIP_N
        const c = chips.current[i]
        const m = chipRefs.current[i]
        if (!m) continue
        c.age = 0
        c.life = 0.9 + Math.random() * 0.5
        c.v.set(e.vel[0] + (Math.random() - 0.5) * 1.5, e.vel[1] + (Math.random() - 0.5) * 1.5, e.vel[2] + (Math.random() - 0.5) * 1.5)
        c.w.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14)
        m.position.set(...e.pos)
        m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6)
        m.scale.setScalar(0.3)
        m.visible = true
      }
    }
    for (let i = 0; i < CHIP_N; i++) {
      const c = chips.current[i]
      const m = chipRefs.current[i]
      if (!m || !m.visible) continue
      c.age += dt
      if (c.age > c.life) {
        m.visible = false
        continue
      }
      c.v.y -= 22 * dt
      m.position.addScaledVector(c.v, dt)
      m.rotation.x += c.w.x * dt
      m.rotation.y += c.w.y * dt
      m.rotation.z += c.w.z * dt
      m.scale.setScalar(Math.min(1.5, 0.4 + c.age * 7))
    }
  })

  return (
    <Ctx.Provider value={ctx}>
      {children}
      {chip && (
        <Part id="viruta" offset={[0, 10, 6]} labelAt={[8, AXIS + 6, 4]}>
          {Array.from({ length: CHIP_N }, (_, i) => (
            <mesh
              key={i}
              ref={(m) => {
                chipRefs.current[i] = m
              }}
              visible={false}
              geometry={chipGeos[i % 3]}
              material={CHIP_MATS[i % 3]}
            />
          ))}
        </Part>
      )}
      {flechas && (
        <group>
          <group ref={arrowsRef}>
            {arrows.map((a, i) => (
              <StraightArrow key={i} a={a} />
            ))}
          </group>
          {spin && <SpinArrow x={spin.x} r={spin.r} />}
          {note && <Tag text={note.text} position={note.at} color={note.color ?? '#ffd23f'} size={1.2} />}
        </group>
      )}
    </Ctx.Provider>
  )
}

/* ================================================================== piezas (se regeneran con el progreso) */

interface Chains {
  raw: P2[][]
  cut: P2[][]
}

function chainsGeometry(chains: P2[][], segs: number) {
  const gs = chains.filter((c) => c.length > 1).map((c) => revolve(c, segs))
  if (!gs.length) return null
  if (gs.length === 1) return gs[0]
  // unir sin índices (revolve devuelve geometrías no indexadas o indexadas según el caso)
  const merged = new THREE.BufferGeometry()
  const pos: number[] = []
  const nor: number[] = []
  gs.forEach((g) => {
    const ng = g.index ? g.toNonIndexed() : g
    pos.push(...(ng.getAttribute('position').array as Float32Array))
    nor.push(...(ng.getAttribute('normal').array as Float32Array))
    if (ng !== g) ng.dispose()
    g.dispose()
  })
  merged.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  return merged
}

const EMPTY = new THREE.BufferGeometry()

/** Planos de corte en coordenadas del mundo: se saca el cuarto de arriba-adelante (y > eje, z > 0). */
const CLIP = [new THREE.Plane(new THREE.Vector3(0, -1, 0), AXIS * S), new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)]

function usePieceMaterials(clip: boolean) {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    if (clip) gl.localClippingEnabled = true
  }, [gl, clip])
  return useMemo(() => {
    if (!clip) return { raw: M.work, cut: M.turned, back: null as THREE.Material | null }
    const raw = M.work.clone()
    const cut = M.turned.clone()
    ;[raw, cut].forEach((m) => {
      m.clippingPlanes = CLIP
      m.clipIntersection = true
    })
    const back = new THREE.MeshBasicMaterial({ color: '#b5543c', side: THREE.BackSide, clippingPlanes: CLIP, clipIntersection: true })
    return { raw, cut, back }
  }, [clip])
}

/** Pieza de revolución regenerada a partir de su perfil cada vez que cambia el progreso. */
function RevolvedPiece({ build, clip = false, segs = 56 }: { build: (p: number) => Chains; clip?: boolean; segs?: number }) {
  const ctx = useStage()
  const mats = usePieceMaterials(clip)
  const rawRefs = useRef<(THREE.Mesh | null)[]>([])
  const cutRefs = useRef<(THREE.Mesh | null)[]>([])
  const cur = useRef<{ raw: THREE.BufferGeometry | null; cut: THREE.BufferGeometry | null }>({ raw: null, cut: null })
  const apply = (p: number) => {
    const c = build(p)
    const raw = chainsGeometry(c.raw, segs)
    const cut = chainsGeometry(c.cut, segs)
    cur.current.raw?.dispose()
    cur.current.cut?.dispose()
    cur.current = { raw, cut }
    rawRefs.current.forEach((m) => {
      if (!m) return
      m.geometry = raw ?? EMPTY
      m.visible = !!raw
    })
    cutRefs.current.forEach((m) => {
      if (!m) return
      m.geometry = cut ?? EMPTY
      m.visible = !!cut
    })
  }
  useOnProg(apply)
  useEffect(() => {
    apply(ctx.prog.current)
    return () => {
      cur.current.raw?.dispose()
      cur.current.cut?.dispose()
      cur.current = { raw: null, cut: null }
    }
  }, [])
  return (
    <group>
      <mesh ref={(m) => void (rawRefs.current[0] = m)} material={mats.raw} />
      <mesh ref={(m) => void (cutRefs.current[0] = m)} material={mats.cut} />
      {mats.back && (
        <>
          <mesh ref={(m) => void (rawRefs.current[1] = m)} material={mats.back} />
          <mesh ref={(m) => void (cutRefs.current[1] = m)} material={mats.back} />
        </>
      )}
    </group>
  )
}

/** Muestrea un perfil exterior r(x) entre xa y xb (incluye quiebres y un escalón en xStep). */
function sampleProfile(r: (x: number) => number, xa: number, xb: number, breaks: number[], xStep: number | null, n = 24): P2[] {
  const xs = new Set<number>()
  for (let i = 0; i <= n; i++) xs.add(xa + ((xb - xa) * i) / n)
  breaks.forEach((b) => b > xa && b < xb && xs.add(b))
  if (xStep !== null && xStep > xa && xStep < xb) {
    xs.add(xStep - 1e-4)
    xs.add(xStep + 1e-4)
  }
  return [...xs].sort((a, b) => a - b).map((x) => [r(x), x] as P2)
}

/* ================================================================== partes fijas del torno */

function Bancada({ x1 = 56 }: { x1?: number }) {
  return (
    <Part id="bancada" offset={[0, -6, 0]} labelAt={[30, 2.5, 16]}>
      <BedSection x0={-34} x1={x1} />
      <RoundedBox args={[20, 34, 30]} radius={1.5} smoothness={2} position={[-24, 17, -1]} material={M.paint} />
      <B p={[-24, 34.4, -2]} s={[16, 0.8, 22]} m={M.paintDark} />
      <CylX x0={-14.01} x1={-12} r={5.5} m={M.steel} y={AXIS} seg={40} />
    </Part>
  )
}

function Plato({ clampR }: { clampR: number }) {
  return (
    <Part id="plato" offset={[-12, 0, 0]} labelAt={[CHUCK_X + 3, AXIS + 10, 4]}>
      <group position={[CHUCK_X, AXIS, 0]}>
        <Rot>
          <Chuck3 clampR={clampR} />
        </Rot>
      </group>
    </Part>
  )
}

/* ---------- carro: longitudinal, transversal, charriot y torre ---------- */

function useTorreGeo() {
  return useMemo(
    () =>
      boxesGeometry([
        { p: [0, 14, 0], s: [10, 2, 10] },
        { p: [0, 16.7, 0], s: [3.2, 3.4, 3.2] },
        { p: [0, 19.9, 0], s: [10, 3, 10] },
      ]),
    [],
  )
}

function Carro({ tool, T = [-4.4, 18, -12] }: { tool: ReactNode; T?: Vec3 }) {
  const toolAt: Vec3 = [T[0] + 2, T[1] + 3, T[2] + 4]
  const saddle = useMemo(
    () =>
      boxesGeometry([
        { p: [0, 3.35, 3.5], s: [18, 3.3, 45] },
        { p: [0, 3.35, 14.2], s: [38, 3.3, 8.6] },
        { p: [0, 3.0, -14], s: [38, 4.0, 8] },
        { p: [0, -9.5, 22.5], s: [28, 23, 8] },
      ]),
    [],
  )
  const cross = useMemo(() => boxesGeometry([{ p: [0, 6.5, -10], s: [16, 3, 24] }, { p: [0, 7.9, -10], s: [12, 0.4, 22] }]), [])
  const cbase = useMemo(() => boxesGeometry([{ p: [0, 10.2, 0], s: [18, 2, 9] }, { p: [10.5, 10.4, 0], s: [3, 2.4, 3.6] }]), [])
  const torre = useTorreGeo()
  const off: Vec3 = [0, -8, 16]
  return (
    <>
      <Track name="saddle">
        <Part id="carro" offset={off} labelAt={[0, 6, 24]}>
          <mesh geometry={saddle} material={M.paint} />
          {/* volantes del carro transversal y del longitudinal */}
          <group position={[0, 6.5, 28]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.8]} material={M.steel}>
              <cylinderGeometry args={[1.8, 1.8, 2.4, 32]} />
            </mesh>
            <group position={[0, 0, 0.8]}>
              <Handwheel r={4.2} spokes={3} />
            </group>
          </group>
          <group position={[-6, -8, 27.3]}>
            <Handwheel r={6} spokes={3} />
          </group>
        </Part>
      </Track>
      <Track name="cross">
        <Part id="carro" offset={off} noLabel>
          <mesh geometry={cross} material={M.paint} />
        </Part>
      </Track>
      <Track name="cbase">
        <Part id="carro" offset={off} noLabel>
          <mesh position={[0, 8.6, 0]} material={M.satin}>
            <cylinderGeometry args={[7, 7, 1.2, 48]} />
          </mesh>
          <mesh geometry={cbase} material={M.paint} />
          <group position={[13.2, 10.4, 0]} rotation={[0, Math.PI / 2, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.6]} material={M.steel}>
              <cylinderGeometry args={[1.5, 1.5, 1.2, 32]} />
            </mesh>
            <group position={[0, 0, 1.8]}>
              <Handwheel r={3.2} spokes={2} />
            </group>
          </group>
        </Part>
      </Track>
      <Track name="tslide">
        <Part id="carro" offset={off} noLabel>
          <B p={[0, 12.1, 0]} s={[12, 1.8, 8]} m={M.paint} />
        </Part>
      </Track>
      <Track name="torre">
        <Part id="torre" offset={[0, 14, 14]} labelAt={[0, 25, 0]}>
          <mesh geometry={torre} material={M.burnished} />
          {[-2.6, 2.6].map((k) => (
            <group key={k}>
              <mesh position={[k, 22, 3.4]} material={M.steel}>
                <cylinderGeometry args={[0.6, 0.6, 1.2, 6]} />
              </mesh>
              <mesh position={[-3.4, 22, k]} material={M.steel}>
                <cylinderGeometry args={[0.6, 0.6, 1.2, 6]} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 22.4, 0]} material={M.steel}>
            <cylinderGeometry args={[1.0, 1.2, 2.0, 16]} />
          </mesh>
          <group position={[0, 23, 0]} rotation={[0, 0, -Math.PI / 2 + 0.25]}>
            <Lever len={7} r={0.45} knob={0.9} />
          </group>
        </Part>
      </Track>
      {tool && (
        <Track name="torre">
          <Part id="herramienta" offset={[0, 7, 10]} labelAt={toolAt}>
            {tool}
          </Part>
        </Track>
      )}
    </>
  )
}

/* ---------- herramientas montadas en la torre (sistema de la torre) ---------- */

const T_PORTA: Vec3 = [-4.4, 18, -12]
const T_TRONZ: Vec3 = [-4.4, 18, -11.9]
const T_ROSC: Vec3 = [-3.6, 18, -11.81]
const T_MOLE: Vec3 = [-3.25, 18, -10.45]
const T_INT: Vec3 = [-11.27, 18, -2.781]


function PortaTool() {
  return (
    <group position={[-3.25, 16, -8.85]} rotation={[0, Math.PI / 2, 0]}>
      <Portainserto />
    </group>
  )
}

function TronzarTool() {
  return (
    <group position={[-3.25, 15.1, -8.85]} rotation={[0, Math.PI / 2, 0]}>
      <TronzarBloque />
      <TronzarCuchilla />
      <TronzarInserto />
    </group>
  )
}

function RoscarTool() {
  return (
    <group position={[-3.25, 16.1, -8.85]} rotation={[0, Math.PI / 2, 0]}>
      <RoscarCuerpo />
      <RoscarAsiento />
      <RoscarInserto />
      <RoscarTornillo />
    </group>
  )
}

function knurlWheelGeometry(handed: 1 | -1) {
  const g = gearGeometry(34, 1.0, 0.8, 0.25, 0.9)
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const a = handed * (y - 0.4) * 0.55
    pos.setXYZ(i, x * Math.cos(a) - z * Math.sin(a), y - 0.4, x * Math.sin(a) + z * Math.cos(a))
  }
  // eje de la rueda: y → x
  g.rotateZ(-Math.PI / 2)
  g.computeVertexNormals()
  return g
}

function MoletaTool() {
  const g1 = useMemo(() => knurlWheelGeometry(1), [])
  const g2 = useMemo(() => knurlWheelGeometry(-1), [])
  const k = -MO.R / MO.rw
  return (
    <group>
      <group position={[-3.25, 17, -8.85]} rotation={[0, Math.PI / 2, 0]}>
        <MoletaCuerpo />
      </group>
      {[
        [1, g1],
        [-1, g2],
      ].map(([s, g]) => (
        <group key={s as number} position={[T_MOLE[0], AXIS + (s as number) * MO.dy, T_MOLE[2]]}>
          <Rot k={k}>
            <mesh geometry={g as THREE.BufferGeometry} material={M.steel} />
          </Rot>
          <CylX x0={-1.35} x1={1.35} r={0.22} m={M.satin} seg={12} />
        </group>
      ))}
    </group>
  )
}

function BoringTool() {
  const psi = Math.atan2(-0.55, 0.76)
  return (
    <group>
      <group position={[-10.5, 18, -3.25]} rotation={[0, Math.PI, 0]}>
        <group rotation={[psi, 0, 0]} scale={0.5}>
          <InteriorBarra />
          <InteriorInserto />
          <InteriorTornillo />
        </group>
      </group>
      {/* suplemento (porta-barra) apretado en la torre */}
      <B p={[-3.2, 16.4, -3.25]} s={[9, 2.4, 2.2]} m={M.satin} />
    </group>
  )
}

/* ---------- contrapunta simplificada ---------- */

function ContrapuntaBody({ ez = 0, qe }: { ez?: number; qe: number }) {
  return (
    <group>
      <B p={[12, 3.85, 0]} s={[24, 4.3, 26]} m={M.paint} />
      <B p={[12, 5.2, -13.06]} s={[8, 1.4, 0.1]} m={M.steel} />
      <group position={[0, 0, ez]}>
        <B p={[12, 6.1, 0]} s={[22, 0.2, 18]} m={M.paintDark} />
        <RoundedBox args={[22, 10, 16]} radius={1.2} smoothness={2} position={[12, 11.2, 0]} material={M.paint} />
        <CylX x0={0} x1={26} r={5.5} m={M.paint} y={AXIS} seg={40} />
        <B p={[12, 14.5, 0]} s={[22, 4, 11]} m={M.paint} />
        <CylX x0={26} x1={28.5} r={3.0} r2={2.4} m={M.paint} y={AXIS} />
        <group position={[29.5, AXIS, 0]} rotation={[0, Math.PI / 2, 0]}>
          <Handwheel r={7} spokes={3} />
        </group>
        <group position={[4, AXIS + 5.2, 0]} rotation={[0, 0, 0.35]}>
          <mesh material={M.steel}>
            <cylinderGeometry args={[1.0, 1.0, 1.2, 16]} />
          </mesh>
          <group rotation={[-Math.PI / 2 + 0.3, 0, 0]}>
            <Lever len={6} r={0.4} knob={0.8} />
          </group>
        </group>
        <Track name="quill">
          <group position={[-qe, AXIS, 0]}>
            <CylX x0={0} x1={8 + qe} r={3.2} m={M.steel} />
          </group>
        </Track>
      </group>
      {/* tornillos de registro laterales */}
      {[3, 21].map((x) => (
        <mesh key={x} position={[x, 3.6, 13.3]} rotation={[Math.PI / 2, 0, 0]} material={M.steel}>
          <cylinderGeometry args={[0.7, 0.7, 1.2, 4]} />
        </mesh>
      ))}
    </group>
  )
}

/* ================================================================== operaciones */

interface OpProps {
  prm: MecParams
}

const turnChip =
  (up = 1) =>
  (k: Kin): ChipEmit => ({ pos: [k.tip[0], AXIS + 0.3, k.tip[1] + 0.2], vel: [0.6, 3.5 * up + Math.random() * 1.5, 2.2 + Math.random() * 1.5] })

/* ---------- 1. frenteado ---------- */
function OpFrenteado({ prm }: OpProps) {
  const update = (p: number): Kin => {
    const k = kFrente(p)
    return { rig: rigAt(k.tip, T_PORTA), tip: k.tip, cutting: k.cutting }
  }
  const build = (p: number): Chains => {
    const { cutR, x1 } = kFrente(p)
    const R = FR.R
    const x0 = FR.x0
    if (cutR >= R - 1e-3) return { raw: [[[0, X0], [R, X0], [R, x0], [0, x0]]], cut: [] }
    if (cutR <= 1e-3) return { raw: [[[0, X0], [R, X0], [R, x1]]], cut: [[[R, x1], [0, x1]]] }
    return { raw: [[[0, X0], [R, X0], [R, x0], [cutR, x0]]], cut: [[[cutR, x0], [cutR, x1], [0, x1]]] }
  }
  return (
    <Stage
      target={prm.progreso / 100}
      version=""
      flechas={prm.flechas}
      update={update}
      chip={turnChip()}
      spin={{ x: 3, r: FR.R + 1.2 }}
      arrows={[
        { dir: [0, 0, -1], color: C_AV, label: 'avance (hacia el eje)', at: [0.6, 3.2, 1.8], len: 3 },
        { dir: [-1, 0, 0], color: C_PEN, label: 'penetración', at: [3.6, 0.5, 4.5], len: 2.4, labelAt: [2.4, -0.6, 5.2] },
      ]}
    >
      <Bancada />
      <Plato clampR={FR.R} />
      <Part id="pieza" offset={[0, 12, 0]} labelAt={[2, AXIS + FR.R + 1.5, 0]}>
        <group position={[0, AXIS, 0]}>
          <Rot>
            <RevolvedPiece build={build} />
          </Rot>
        </group>
      </Part>
      <Carro tool={<PortaTool />} />
    </Stage>
  )
}

/* ---------- 2. cilindrado ---------- */
function OpCilindrado({ prm }: OpProps) {
  const update = (p: number): Kin => {
    const k = kCil(p)
    return { rig: rigAt(k.tip, T_PORTA), tip: k.tip, cutting: k.cutting }
  }
  const build = (p: number): Chains => {
    const { xc } = kCil(p)
    const { R0, R1, x1 } = CI
    if (xc >= x1 - 1e-3) return { raw: [[[0, X0], [R0, X0], [R0, x1], [0, x1]]], cut: [] }
    return { raw: [[[0, X0], [R0, X0], [R0, xc]], [[R1, x1], [0, x1]]], cut: [[[R0, xc], [R1, xc], [R1, x1]]] }
  }
  return (
    <Stage
      target={prm.progreso / 100}
      version=""
      flechas={prm.flechas}
      update={update}
      chip={turnChip()}
      spin={{ x: -1.5, r: CI.R0 + 1.2 }}
      note={{ text: 'κr ≈ 93°', at: [CI.xs - 3, AXIS + 6.5, 6] }}
      arrows={[
        { dir: [-1, 0, 0], color: C_AV, label: 'avance', at: [0, 3.4, 1.0], len: 3 },
        { dir: [0, 0, -1], color: C_PEN, label: 'penetración', at: [2.2, 5.6, 2.5], len: 2.4 },
      ]}
    >
      <Bancada />
      <Plato clampR={CI.R0} />
      <Part id="pieza" offset={[0, 12, 0]} labelAt={[4, AXIS + CI.R0 + 1.5, 0]}>
        <group position={[0, AXIS, 0]}>
          <Rot>
            <RevolvedPiece build={build} />
          </Rot>
        </group>
      </Part>
      <Carro tool={<PortaTool />} />
    </Stage>
  )
}

/* ---------- 3. perforado ---------- */
function holeChain(r: (x: number) => number, xFace: number, xBottom: number, breaks: number[]): P2[] {
  const xs = new Set<number>([xFace, xBottom])
  for (let i = 0; i <= 20; i++) xs.add(xBottom + ((xFace - xBottom) * i) / 20)
  breaks.forEach((b) => b > xBottom && b < xFace && xs.add(b))
  return [...xs].sort((a, b) => b - a).map((x) => [Math.max(0, r(x)), x] as P2)
}

function OpPerforado({ prm }: OpProps) {
  const T: Vec3 = [-4.4, 18, -12]
  const park: Rig = rigAt([13, 3.6], T)
  const update = (p: number): Kin => {
    const k = kPerf(p)
    return { rig: park, tip: [k.tipX, 0], cutting: k.cutting }
  }
  const build = (p: number): Chains => {
    const { cs, dd } = kPerf(p)
    const R = PE.R
    const x1 = PE.x1
    const t59 = Math.tan(59 * D)
    const cone = (x: number) => (cs > 0 ? Math.max(0, (x - (x1 - cs)) * TAN30 * 1.0) : 0)
    const drill = (x: number) => (dd > 0 ? clamp((x - (x1 - dd)) * t59, 0, PE.rd) : 0)
    const r = (x: number) => Math.max(cone(x), drill(x))
    const depth = Math.max(cs, dd)
    if (depth <= 1e-3) return { raw: [[[0, X0], [R, X0], [R, x1], [0, x1]]], cut: [] }
    const lp = PE.rd / t59
    const hole = holeChain(r, x1, x1 - depth, [x1 - dd + lp, x1 - dd, x1 - cs])
    return { raw: [[[0, X0], [R, X0], [R, x1], [hole[0][0], x1]]], cut: [hole] }
  }
  return (
    <Stage
      target={prm.progreso / 100}
      version={String(prm.corte)}
      flechas={prm.flechas}
      update={update}
      chip={() => {
        const a = Math.random() * Math.PI * 2
        return { pos: [PE.x1 + 0.2, AXIS + Math.cos(a) * 0.5, Math.sin(a) * 0.5], vel: [3 + Math.random() * 2, 2.5, Math.sin(a) * 2] }
      }}
      spin={{ x: 2, r: PE.R + 1.2 }}
      arrows={[{ dir: [-1, 0, 0], color: C_AV, label: 'avance (volante de la contrapunta)', at: [1.5, 3.4, 0], len: 3 }]}
    >
      <PerfTailstock />
      <Bancada x1={60} />
      <Plato clampR={PE.R} />
      <Part id="pieza" offset={[0, 12, 0]} labelAt={[2, AXIS + PE.R + 1.5, 0]}>
        <group position={[0, AXIS, 0]}>
          <Rot>
            <RevolvedPiece build={build} clip={prm.corte} />
          </Rot>
        </group>
      </Part>
      <Carro tool={null} />
    </Stage>
  )
}

/** Contrapunta del perforado: se corre, saca el manguito y cambia la herramienta del mandril. */
function PerfTailstock() {
  const ctx = useStage()
  const apply = (p: number) => {
    const k = kPerf(p)
    setTrack(ctx, 'ts', k.xt, 0, 0)
    setTrack(ctx, 'quill', -k.qe, 0, 0)
    // grupo del mandril: frente del manguito = xt − qe; origen del mandril 0,8 más adentro
    setTrack(ctx, 'mandril', k.xt - k.qe - 0.8, AXIS, 0, Math.PI)
    setTrack(ctx, 'mecha', k.xt - k.qe - 0.8, AXIS, 0, Math.PI, k.tool === 'mecha')
    setTrack(ctx, 'broca', k.xt - k.qe - 0.8, AXIS, 0, Math.PI, k.tool === 'broca')
  }
  useOnProg(apply)
  useEffect(() => apply(ctx.prog.current), [])
  return (
    <>
      <Part id="contrapunta" offset={[16, 0, 0]} labelAt={[12, 26, 0]}>
        <Track name="ts">
          <ContrapuntaBodyDyn />
        </Track>
      </Part>
      <Part id="mandril" offset={[8, 6, 0]} labelAt={[-4, 3.2, 0]}>
        <Track name="mandril">
          <MandrilCono />
          <MandrilCuerpo />
        </Track>
      </Part>
      <Part id="herramienta" offset={[4, 10, 0]} labelAt={[-14, 1.6, 0]}>
        <Track name="mecha">
          <MandrilMordazas g={0.4} />
          <MechaCentrar x0={6.8} />
        </Track>
        <Track name="broca">
          <MandrilMordazas g={0.5} />
          <Broca x0={6.6} r={PE.rd} L={13} shank={3} />
        </Track>
      </Part>
    </>
  )
}

/** Cuerpo de contrapunta cuyo manguito se mueve con la pista "quill" (posición x = −qe). */
function ContrapuntaBodyDyn() {
  return (
    <group>
      <B p={[12, 3.85, 0]} s={[24, 4.3, 26]} m={M.paint} />
      <B p={[12, 6.1, 0]} s={[22, 0.2, 18]} m={M.paintDark} />
      <RoundedBox args={[22, 10, 16]} radius={1.2} smoothness={2} position={[12, 11.2, 0]} material={M.paint} />
      <CylX x0={0} x1={26} r={5.5} m={M.paint} y={AXIS} seg={40} />
      <B p={[12, 14.5, 0]} s={[22, 4, 11]} m={M.paint} />
      <CylX x0={26} x1={28.5} r={3.0} r2={2.4} m={M.paint} y={AXIS} />
      <group position={[29.5, AXIS, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Handwheel r={7} spokes={3} />
      </group>
      <Track name="quill">
        <CylX x0={0} x1={10} r={3.2} m={M.steel} y={AXIS} />
      </Track>
      {/* palanca de bloqueo sobre la bancada (la contrapunta queda frenada al perforar) */}
      <group position={[21, 5, -13.6]}>
        <group rotation={[0, 0, -0.5]}>
          <Lever len={9} r={0.45} knob={1.0} />
        </group>
      </group>
    </group>
  )
}

/* ---------- 4. desbaste cónico con el charriot ---------- */
function OpConico({ prm }: OpProps) {
  const ang = prm.angulo
  const update = (p: number): Kin => {
    const k = kCon(p, ang)
    return { rig: rigAt(k.tip, T_PORTA, k.a, k.a, k.slide), tip: k.tip, cutting: k.cutting }
  }
  const build = (p: number): Chains => {
    const k = kCon(p, ang)
    const xsMin = CO.x1 - CO.Lc - 0.01
    const prof = sampleProfile(k.r, xsMin, CO.x1, k.breaks, k.partialX, 30)
    const R0 = CO.R0
    return {
      raw: [[[0, X0], [R0, X0], [R0, xsMin]], [[prof[prof.length - 1][0], CO.x1], [0, CO.x1]]],
      cut: [prof],
    }
  }
  const a = ang * D
  return (
    <Stage
      target={prm.progreso / 100}
      version={String(ang)}
      flechas={prm.flechas}
      update={update}
      chip={turnChip()}
      spin={{ x: -1.5, r: CO.R0 + 1.2 }}
      note={{ text: `charriot girado ${ang}°`, at: [9, 25, 9] }}
      arrows={[
        { dir: [-Math.cos(a), 0, Math.sin(a)], color: C_AV, label: 'avance (charriot, a mano)', at: [0.6, 3.6, 0.8], len: 3.2 },
        { dir: [0, 0, -1], color: C_PEN, label: 'penetración', at: [3.6, 6.2, 2.4], len: 2.2 },
      ]}
    >
      <Bancada />
      <Plato clampR={CO.R0} />
      <Part id="pieza" offset={[0, 12, 0]} labelAt={[3, AXIS + CO.R0 + 1.5, 0]}>
        <group position={[0, AXIS, 0]}>
          <Rot>
            <RevolvedPiece build={build} segs={64} />
          </Rot>
        </group>
      </Part>
      <Carro tool={<PortaTool />} />
    </Stage>
  )
}

/* ---------- 5. cono desplazando la contrapunta (entre puntas) ---------- */
function OpContrapunta({ prm }: OpProps) {
  const th = CP_TH
  const xR = CP.xL + CP.Lt * Math.cos(th)
  const zR = CP.Lt * Math.sin(th)
  const qe = 2
  const xt = xR + 10.2 + qe
  const update = (p: number): Kin => {
    const k = kCP(p)
    return { rig: rigAt(k.tip, T_PORTA), tip: k.tip, cutting: k.cutting }
  }
  const build = (p: number): Chains => {
    const k = kCP(p)
    const R0 = CP.R0
    const x0c = CP.Lt - CP.Lc
    const prof = sampleProfile(k.r, x0c - 0.01, CP.Lt, k.breaks, k.partialXl, 30)
    const rEnd = prof[prof.length - 1][0]
    return {
      raw: [
        [[0, 0.95], [0.55, 0], [R0 - 0.2, 0], [R0, 0.2], [R0, x0c - 0.01]],
        [[rEnd, CP.Lt], [0.55, CP.Lt], [0, CP.Lt - 0.95]],
      ],
      cut: [prof],
    }
  }
  return (
    <Stage
      target={prm.progreso / 100}
      version=""
      flechas={prm.flechas}
      update={update}
      chip={turnChip()}
      spin={{ x: 4, r: CP.R0 + 1.3 }}
      note={{ text: `contrapunta corrida e = ${f(CP_E * 10)} mm`, at: [xt + 8, 31, zR] }}
      arrows={[
        { dir: [-1, 0, 0], color: C_AV, label: 'avance (paralelo a la bancada)', at: [0.6, 3.4, 1.0], len: 3 },
        { dir: [0, 0, -1], color: C_PEN, label: 'penetración', at: [2.2, 5.6, 2.5], len: 2.2 },
      ]}
    >
      <Bancada x1={58} />
      {/* plato liso, perno de arrastre y punto del husillo */}
      <Part id="plato" offset={[-12, 0, 0]} labelAt={[-9, AXIS + 11.5, 4]}>
        <group position={[-9.4, AXIS, 0]}>
          <Rot>
            <PlatoLiso />
            <PernoArrastre />
            <group position={[4.85, 0, 0]}>
              <PuntoFijo />
            </group>
          </Rot>
        </group>
      </Part>
      {/* pieza entre puntas: su eje va del punto del husillo al punto corrido de la contrapunta */}
      <Part id="pieza" offset={[0, 12, 0]} labelAt={[6, AXIS + CP.R0 + 1.5, 0.5]}>
        <group position={[CP.xL, AXIS, 0]} rotation={[0, -th, 0]}>
          <Rot>
            <RevolvedPiece build={build} segs={64} />
          </Rot>
        </group>
      </Part>
      <Part id="brida" offset={[0, 0, 10]} labelAt={[-0.8, AXIS + 5.5, 2]}>
        <group position={[CP.xL, AXIS, 0]} rotation={[0, -th, 0]}>
          <Rot>
            <group position={[3.75, 0, 0]} rotation={[0.19, 0, 0]}>
              <Brida barR={CP.R0} />
            </group>
          </Rot>
        </group>
      </Part>
      {/* ejes: del torno y de la pieza */}
      {prm.flechas && (
        <group>
          <Line points={[[-6, AXIS, 0], [xR + 3, AXIS, 0]]} color="#aab4c3" lineWidth={1.5} dashed dashSize={0.6} gapSize={0.4} depthTest={false} transparent />
          <Line points={[[CP.xL, AXIS, 0], [xR + 3 * Math.cos(th), AXIS, zR + 3 * Math.sin(th)]]} color="#ffb347" lineWidth={1.5} dashed dashSize={0.6} gapSize={0.4} depthTest={false} transparent />
          <Tag text="eje del torno" position={[xR + 4, AXIS, -3]} color="#c8d0dc" size={0.9} />
          <Tag text="eje de la pieza" position={[xR + 4.5, AXIS - 1, zR + 3.5]} color="#ffb347" size={0.9} />
        </group>
      )}
      <Part id="contrapunta" offset={[16, 0, 0]} labelAt={[xt + 12, 26, zR]}>
        <group position={[xt, 0, 0]}>
          <ContrapuntaBody ez={zR} qe={qe} />
        </group>
      </Part>
      <Part id="punto" offset={[10, 5, 0]} labelAt={[xR + 4, AXIS + 3.5, zR]}>
        <group position={[xR, AXIS, zR]} rotation={[0, Math.PI, 0]}>
          <PuntoGiratorioCuerpo />
          <Rot k={-1}>
            <PuntoGiratorioPunta />
          </Rot>
        </group>
      </Part>
      <Carro tool={<PortaTool />} />
    </Stage>
  )
}

/* ---------- 6. ranurado y tronzado ---------- */
function OpRanurado({ prm }: OpProps) {
  const tr = prm.tronzar
  const update = (p: number): Kin => {
    const k = kRan(p, tr)
    return { rig: rigAt(k.tip, T_TRONZ), tip: k.tip, cutting: k.cutting }
  }
  const { R, x1, xg, w } = RA
  const xa = xg - w / 2
  const xb = xg + w / 2
  const buildL = (p: number): Chains => {
    const { rc } = kRan(p, tr)
    if (rc >= R - 1e-3) return { raw: [[[0, X0], [R, X0], [R, xb]]], cut: [] }
    if (rc <= 1e-3) return { raw: [[[0, X0], [R, X0], [R, xa]]], cut: [[[R, xa], [0, xa]]] }
    return { raw: [[[0, X0], [R, X0], [R, xa]]], cut: [[[R, xa], [rc, xa], [rc, xb], [R, xb]]] }
  }
  const buildR = (p: number): Chains => {
    const { rc } = kRan(p, tr)
    if (rc <= 1e-3) return { raw: [[[R, xb], [R, x1], [0, x1]]], cut: [[[0, xb], [R, xb]]] }
    return { raw: [[[R, xb], [R, x1], [0, x1]]], cut: [] }
  }
  return (
    <Stage
      target={prm.progreso / 100}
      version={String(tr)}
      flechas={prm.flechas}
      update={update}
      chip={(k) => ({ pos: [k.tip[0], AXIS + 0.4, k.tip[1] + 0.3], vel: [0, 4 + Math.random() * 1.5, 2.5] })}
      spin={{ x: 0.8, r: R + 1.2 }}
      arrows={[{ dir: [0, 0, -1], color: C_AV, label: 'avance = penetración', at: [0, 3.6, 2.4], len: 2.6 }]}
    >
      <RanuradoFall tronzar={tr} />
      <Bancada />
      <Plato clampR={R} />
      <Part id="pieza" offset={[0, 12, 0]} labelAt={[2, AXIS + R + 1.5, 0]}>
        <group position={[0, AXIS, 0]}>
          <Rot>
            <RevolvedPiece build={buildL} />
          </Rot>
        </group>
        <Track name="fall">
          <group position={[0, AXIS, 0]}>
            <FallRot>
              <RevolvedPiece build={buildR} />
            </FallRot>
          </group>
        </Track>
      </Part>
      <Carro tool={<TronzarTool />} T={T_TRONZ} />
    </Stage>
  )
}

/** Mueve el trozo tronzado: cae sobre el carro transversal y se frena. */
function RanuradoFall({ tronzar }: { tronzar: boolean }) {
  const ctx = useStage()
  const apply = (p: number) => {
    const { fall } = kRan(p, tronzar)
    const t = fall
    setTrack(ctx, 'fall', t * 1.6, -t * t * 7.2, t * 1.2)
  }
  useOnProg(apply)
  useEffect(() => apply(ctx.prog.current), [])
  return null
}

/** Como Rot, pero el trozo cortado deja de girar al caer. */
function FallRot({ children }: { children: ReactNode }) {
  const ctx = useStage()
  const ref = useRef<THREE.Group>(null)
  const free = useRef<number | null>(null)
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const parent = g.parent?.parent
    const falling = !!parent && parent.position.y < -0.01
    if (!falling) {
      free.current = null
      g.rotation.x = ctx.angle.current
    } else {
      if (free.current === null) free.current = SPIN
      free.current *= Math.exp(-dt * 2.5)
      g.rotation.x += free.current * Math.min(dt, 0.05)
    }
  })
  return <group ref={ref}>{children}</group>
}

/* ---------- 7. roscado ---------- */

/** Malla de revolución con radio r(x, θ) (y = r·cos θ, z = r·sen θ), con tapa en el extremo derecho. */
function makeGrid(xa: number, xb: number, nx: number, nt: number, descending = false) {
  const g = new THREE.BufferGeometry()
  const nv = nx * (nt + 1) + (nt + 1) + 1
  const pos = new Float32Array(nv * 3)
  const idx: number[] = []
  for (let i = 0; i < nx - 1; i++)
    for (let j = 0; j < nt; j++) {
      const a = i * (nt + 1) + j
      const b = (i + 1) * (nt + 1) + j
      const c = b + 1
      const d = a + 1
      if (descending) idx.push(a, c, d, a, b, c)
      else idx.push(a, d, c, a, c, b)
    }
  // tapa (sólo para la rosca: x = xb)
  const ring0 = nx * (nt + 1)
  const center = ring0 + nt + 1
  for (let j = 0; j < nt; j++) idx.push(center, ring0 + j, ring0 + j + 1)
  g.setIndex(idx)
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage))
  const xs = Array.from({ length: nx }, (_, i) => (descending ? xb - ((xb - xa) * i) / (nx - 1) : xa + ((xb - xa) * i) / (nx - 1)))
  const cos = Array.from({ length: nt + 1 }, (_, j) => Math.cos((j / nt) * Math.PI * 2))
  const sin = Array.from({ length: nt + 1 }, (_, j) => Math.sin((j / nt) * Math.PI * 2))
  const th = Array.from({ length: nt + 1 }, (_, j) => (j / nt) * Math.PI * 2)
  return { g, xs, cos, sin, th, nx, nt, ring0, center }
}

type Grid = ReturnType<typeof makeGrid>

function fillGrid(G: Grid, r: (x: number, th: number) => number, capX: number | null) {
  const pos = G.g.getAttribute('position') as THREE.BufferAttribute
  const arr = pos.array as Float32Array
  const { nx, nt } = G
  for (let i = 0; i < nx; i++) {
    const x = G.xs[i]
    for (let j = 0; j <= nt; j++) {
      const rr = r(x, G.th[j])
      const k = (i * (nt + 1) + j) * 3
      arr[k] = x
      arr[k + 1] = rr * G.cos[j]
      arr[k + 2] = rr * G.sin[j]
    }
  }
  if (capX !== null) {
    const last = (nx - 1) * (nt + 1)
    for (let j = 0; j <= nt; j++) {
      const s = (last + j) * 3
      const k = (G.ring0 + j) * 3
      arr[k] = arr[s]
      arr[k + 1] = arr[s + 1]
      arr[k + 2] = arr[s + 2]
    }
    const c = G.center * 3
    arr[c] = capX
    arr[c + 1] = 0
    arr[c + 2] = 0
  }
  pos.needsUpdate = true
  G.g.computeVertexNormals()
  G.g.computeBoundingSphere()
}

function ThreadMesh() {
  const ctx = useStage()
  const G = useMemo(() => makeGrid(RO.xr1, RO.x1, Math.round((RO.x1 - RO.xr1) / 0.036), 56), [])
  useEffect(() => () => G.g.dispose(), [G])
  const apply = (p: number) => {
    const { passes } = kRos(p)
    fillGrid(
      G,
      (x, th) => {
        const u = (th - Math.PI / 2) / (Math.PI * 2) + (RO.xs - x) / RO.p
        let cut = 0
        for (const ps of passes) {
          if (x < ps.from) continue
          const w = u + ps.dl / RO.p
          const s = RO.p * (w - Math.round(w))
          const c = ps.d - Math.abs(s) * SQ3
          if (c > cut) cut = c
        }
        return RO.R - cut
      },
      RO.x1,
    )
  }
  useOnProg(apply)
  useEffect(() => apply(ctx.prog.current), [])
  return <mesh geometry={G.g} material={M.turned} />
}

function OpRoscado({ prm }: OpProps) {
  const update = (p: number): Kin => {
    const k = kRos(p)
    return { rig: rigAt(k.tip, T_ROSC, 0, -60 * D, k.infeed / Math.cos(30 * D)), tip: k.tip, cutting: k.cutting, angle: k.angle }
  }
  const { R, xr0, xr1, rr } = RO
  const build = (): Chains => ({ raw: [[[0, X0], [R, X0], [R, xr0 - 0.3]]], cut: [[[R, xr0 - 0.3], [R, xr0], [rr, xr0], [rr, xr1], [R, xr1]]] })
  return (
    <Stage
      target={prm.progreso / 100}
      version=""
      flechas={prm.flechas}
      update={update}
      chip={(k) => ({ pos: [k.tip[0], AXIS + 0.2, k.tip[1] + 0.2], vel: [0.5, 3 + Math.random(), 2] })}
      spin={{ x: -1.2, r: R + 1.2 }}
      note={{ text: 'charriot a 60° (en flanco)', at: [10, 25, 9] }}
      arrows={[
        { dir: [-1, 0, 0], color: C_AV, label: 'avance = paso (tuerca partida)', at: [0.6, 3.6, 0.8], len: 3 },
        { dir: [-Math.sin(30 * D), 0, -Math.cos(30 * D)], color: C_PEN, label: 'penetración en flanco', at: [2.6, 6.0, 2.6], len: 2.2 },
      ]}
    >
      <Bancada />
      <Plato clampR={R} />
      <Part id="pieza" offset={[0, 12, 0]} labelAt={[4, AXIS + R + 1.5, 0]}>
        <group position={[0, AXIS, 0]}>
          <Rot>
            <RevolvedPiece build={build} />
            <ThreadMesh />
          </Rot>
        </group>
      </Part>
      <Carro tool={<RoscarTool />} T={T_ROSC} />
    </Stage>
  )
}

/* ---------- 8. moleteado ---------- */

function KnurlMesh() {
  const ctx = useStage()
  const dx = 0.07
  const nx = Math.round((MO.xb - MO.xa) / dx) + 1
  const nt = 192
  const G = useMemo(() => {
    const G = makeGrid(MO.xa, MO.xb, nx, nt, true)
    const tri = (t: number) => 1 - Math.abs(2 * (t - Math.floor(t)) - 1)
    fillGrid(
      G,
      (x, th) => {
        const a = (th * MO.n) / (Math.PI * 2)
        const u = a + x / MO.pa
        const v = a - x / MO.pa
        return MO.R - MO.h / 2 + MO.h * Math.min(tri(u), tri(v))
      },
      null,
    )
    return G
  }, [])
  useEffect(() => () => G.g.dispose(), [G])
  const apply = (p: number) => {
    const { from } = kMol(p)
    const rows = Math.max(0, Math.floor((MO.xb - from) / dx + 1e-6))
    G.g.setDrawRange(0, rows * nt * 6)
  }
  useOnProg(apply)
  useEffect(() => apply(ctx.prog.current), [])
  return <mesh geometry={G.g} material={M.steel} />
}

function OpMoleteado({ prm }: OpProps) {
  const update = (p: number): Kin => {
    const k = kMol(p)
    return { rig: rigAt(k.tip, T_MOLE), tip: k.tip, cutting: false }
  }
  const dx = 0.07
  const build = (p: number): Chains => {
    const { from } = kMol(p)
    const rows = Math.max(0, Math.floor((MO.xb - from) / dx + 1e-6))
    const xk = MO.xb - rows * dx
    const R = MO.R
    const core = R - MO.h / 2 - 0.006
    if (rows < 1) return { raw: [[[0, X0], [R, X0], [R, MO.x1], [0, MO.x1]]], cut: [] }
    return { raw: [[[0, X0], [R, X0], [R, xk], [core, xk], [core, MO.xb], [R, MO.xb], [R, MO.x1], [0, MO.x1]]], cut: [] }
  }
  return (
    <Stage
      target={prm.progreso / 100}
      version=""
      flechas={prm.flechas}
      update={update}
      spin={{ x: 0.5, r: MO.R + 1.4 }}
      note={{ text: '¡Sin viruta! (comprime)', at: [9, AXIS + 7.5, 4] }}
      arrows={[
        { dir: [-1, 0, 0], color: C_AV, label: 'avance', at: [0, 3.6, 0.5], len: 3 },
        { dir: [0, 0, -1], color: C_PEN, label: 'presión', at: [2.2, 5.8, 2.6], len: 2.2 },
      ]}
    >
      <Bancada />
      <Plato clampR={MO.R} />
      <Part id="pieza" offset={[0, 12, 0]} labelAt={[2, AXIS + MO.R + 1.5, 0]}>
        <group position={[0, AXIS, 0]}>
          <Rot>
            <RevolvedPiece build={build} />
            <KnurlMesh />
          </Rot>
        </group>
      </Part>
      <Carro tool={<MoletaTool />} T={T_MOLE} />
    </Stage>
  )
}

/* ---------- 9. torneado interior ---------- */
function OpInterior({ prm }: OpProps) {
  const update = (p: number): Kin => {
    const k = kInt(p)
    return { rig: rigAt(k.tip, T_INT), tip: k.tip, cutting: k.cutting }
  }
  const build = (p: number): Chains => {
    const k = kInt(p)
    const { R, x1, r0, xh, xb } = IN
    const tipX = xh - r0 * 0.6
    const drilled: P2[] = [
      [r0, xb],
      [r0, xh],
      [0, tipX],
    ]
    if (k.partialX !== null) {
      const xt = k.partialX
      const bore: P2[] = [[k.cur, x1], [k.cur, xt], [k.prev, xt]]
      if (k.prev > r0 + 1e-3) bore.push([k.prev, xb], [r0, xb])
      else bore.push([r0, xb])
      return { raw: [[[0, X0], [R, X0], [R, x1], [k.cur, x1]], drilled], cut: [bore] }
    }
    const h = k.done
    if (h <= r0 + 1e-3) return { raw: [[[0, X0], [R, X0], [R, x1], [r0, x1], [r0, xb]], drilled], cut: [] }
    return { raw: [[[0, X0], [R, X0], [R, x1], [h, x1]], drilled], cut: [[[h, x1], [h, xb], [r0, xb]]] }
  }
  return (
    <Stage
      target={prm.progreso / 100}
      version={String(prm.corte)}
      flechas={prm.flechas}
      update={update}
      chip={(k) => ({ pos: [IN.x1 + 0.3, AXIS + 0.3, k.tip[1] * 0.6], vel: [3.5 + Math.random() * 1.5, 2.5, 1.5] })}
      spin={{ x: -1.2, r: IN.R + 1.2 }}
      arrows={[
        { dir: [-1, 0, 0], color: C_AV, label: 'avance', at: [0.4, 3.8, 0], len: 3 },
        { dir: [0, 0, 1], color: C_PEN, label: 'penetración (hacia afuera)', at: [2.6, 6.2, -0.5], len: 2 },
      ]}
    >
      <Bancada />
      <Plato clampR={IN.R} />
      <Part id="pieza" offset={[0, 12, 0]} labelAt={[2, AXIS + IN.R + 1.5, -1]}>
        <group position={[0, AXIS, 0]}>
          <Rot>
            <RevolvedPiece build={build} clip={prm.corte} />
          </Rot>
        </group>
      </Part>
      <Carro tool={<BoringTool />} T={T_INT} />
    </Stage>
  )
}

/* ================================================================== modelo */

export function MecanizadosModel(prm: MecParams) {
  const props = { prm }
  return (
    <group scale={S}>
      {prm.op === 'frenteado' && <OpFrenteado key="fr" {...props} />}
      {prm.op === 'cilindrado' && <OpCilindrado key="ci" {...props} />}
      {prm.op === 'perforado' && <OpPerforado key="pe" {...props} />}
      {prm.op === 'conico' && <OpConico key="co" {...props} />}
      {prm.op === 'contrapunta' && <OpContrapunta key="cp" {...props} />}
      {prm.op === 'ranurado' && <OpRanurado key="ra" {...props} />}
      {prm.op === 'roscado' && <OpRoscado key="ro" {...props} />}
      {prm.op === 'moleteado' && <OpMoleteado key="mo" {...props} />}
      {prm.op === 'interior' && <OpInterior key="in" {...props} />}
    </group>
  )
}
