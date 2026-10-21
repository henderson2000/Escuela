import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Part, type Vec3 } from '../Part'
import { Screw, Wire, latheGeometry, metal, tinned, useCanvasTexture } from '../helpers'

/* ================================================================== */
/* Utilidades comunes                                                  */
/* ================================================================== */

/** Gris claro de los equipos modulares para riel DIN (≈ RAL 7035). */
const RAL7035 = '#c9ccc7'

/** Tornillo de borne mirando hacia el frente (+z). */
function FrontScrew({ position, r = 0.17 }: { position: Vec3; r?: number }) {
  return <Screw position={position} r={r} rotation={[Math.PI / 2, 0, 0]} />
}

/** Varias cajas unidas en una sola geometría (una sola llamada de dibujo: patitas, ranuras…). */
function useBoxes(list: { p: Vec3; s: Vec3 }[], deps: unknown[]) {
  return useMemo(() => {
    const gs = list.map(({ p, s }) => {
      const g = new THREE.BoxGeometry(...s)
      g.translate(...p)
      return g
    })
    const merged = mergeGeometries(gs)
    gs.forEach((g) => g.dispose())
    return merged
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/** Resorte helicoidal a lo largo de +z con largo 1 (se estira o comprime con scale.z). */
function springGeometry(r: number, wire: number, turns: number) {
  const n = turns * 14
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n
    const a = t * turns * Math.PI * 2
    return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, t)
  })
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, wire, 6, false)
}

/** Textura de pistas de una placa de circuito impreso (verde, con pistas y vías). */
function usePcbTexture(seed: number, color = '#1c5e33', trace = '#2f7a46') {
  return useCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      let s = seed
      const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
      ctx.fillStyle = color
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = trace
      ctx.lineCap = 'round'
      for (let i = 0; i < 70; i++) {
        ctx.lineWidth = 2 + rnd() * 6
        let x = rnd() * w
        let y = rnd() * h
        ctx.beginPath()
        ctx.moveTo(x, y)
        for (let k = 0; k < 3; k++) {
          if (rnd() > 0.5) x += (rnd() - 0.5) * 220
          else y += (rnd() - 0.5) * 220
          ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      ctx.fillStyle = '#c9c39a'
      for (let i = 0; i < 90; i++) {
        ctx.beginPath()
        ctx.arc(rnd() * w, rnd() * h, 3 + rnd() * 3, 0, Math.PI * 2)
        ctx.fill()
      }
    },
    [seed],
  )
}

/** Placa de circuito impreso parada (mirando a +z). */
function Pcb({ w, h, position, seed = 7 }: { w: number; h: number; position: Vec3; seed?: number }) {
  const tex = usePcbTexture(seed)
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[w, h, 0.16]} />
        <meshStandardMaterial color="#1c5e33" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0, 0.081]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.5} />
      </mesh>
    </group>
  )
}

/** Integrado QFP (cuadrado, patitas en los 4 lados), acostado sobre la placa mirando a +z. */
function Qfp({ position, size = 1.2, label = '' }: { position: Vec3; size?: number; label?: string }) {
  const n = 12
  const pins = useBoxes(
    Array.from({ length: n * 4 }, (_, i) => {
      const side = Math.floor(i / n)
      const k = (i % n) - (n - 1) / 2
      const d = (size * 0.8) / n
      const o = size / 2 + 0.06
      const along = k * d
      const p: Vec3 = side === 0 ? [along, o, 0.02] : side === 1 ? [along, -o, 0.02] : side === 2 ? [o, along, 0.02] : [-o, along, 0.02]
      const s: Vec3 = side < 2 ? [d * 0.45, 0.14, 0.03] : [0.14, d * 0.45, 0.03]
      return { p, s }
    }),
    [size],
  )
  const tex = useCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#1a1a1c'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#8d8d8d'
      ctx.textAlign = 'center'
      ctx.font = 'bold 30px sans-serif'
      ctx.fillText(label, w / 2, h * 0.45)
      ctx.font = '22px sans-serif'
      ctx.fillText('2245 TW', w / 2, h * 0.62)
      ctx.beginPath()
      ctx.arc(40, 216, 12, 0, Math.PI * 2)
      ctx.fillStyle = '#111'
      ctx.fill()
    },
    [label],
  )
  return (
    <group position={position}>
      <mesh position={[0, 0, 0.07]}>
        <boxGeometry args={[size, size, 0.14]} />
        <meshStandardMaterial color="#1a1a1c" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.141]}>
        <planeGeometry args={[size * 0.96, size * 0.96]} />
        <meshStandardMaterial map={tex} roughness={0.5} />
      </mesh>
      <mesh geometry={pins}>
        <meshStandardMaterial {...tinned} />
      </mesh>
    </group>
  )
}

/** SOIC acostado sobre una placa que mira a +z. */
function SoicZ({ position, pins = 8, label = '' }: { position: Vec3; pins?: number; label?: string }) {
  const n = pins / 2
  const len = n * 0.127 + 0.05
  const legs = useBoxes(
    Array.from({ length: pins }, (_, i) => ({
      p: [-len / 2 + 0.06 + (i % n) * 0.127, (i < n ? -1 : 1) * 0.24, 0.01] as Vec3,
      s: [0.04, 0.12, 0.02] as Vec3,
    })),
    [pins],
  )
  const tex = useCanvasTexture(
    256,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#161616'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#9a9a9a'
      ctx.font = 'bold 34px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, w / 2, h / 2)
    },
    [label],
  )
  return (
    <group position={position}>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[len, 0.39, 0.06]} />
        <meshStandardMaterial color="#161616" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.0605]}>
        <planeGeometry args={[len * 0.9, 0.3]} />
        <meshStandardMaterial map={tex} roughness={0.5} />
      </mesh>
      <mesh geometry={legs}>
        <meshStandardMaterial {...tinned} />
      </mesh>
    </group>
  )
}

/** Componentes SMD chiquitos esparcidos (resistencias negras y capacitores marrones). */
function SmdScatter({ items }: { items: [number, number, 0 | 1, 'R' | 'C'][] }) {
  const r = useBoxes(
    items.filter((i) => i[3] === 'R').map(([x, y, rot]) => ({ p: [x, y, 0.03] as Vec3, s: (rot ? [0.07, 0.14, 0.05] : [0.14, 0.07, 0.05]) as Vec3 })),
    [JSON.stringify(items)],
  )
  const c = useBoxes(
    items.filter((i) => i[3] === 'C').map(([x, y, rot]) => ({ p: [x, y, 0.03] as Vec3, s: (rot ? [0.07, 0.14, 0.05] : [0.14, 0.07, 0.05]) as Vec3 })),
    [JSON.stringify(items)],
  )
  return (
    <>
      <mesh geometry={r}>
        <meshStandardMaterial color="#141414" roughness={0.6} />
      </mesh>
      <mesh geometry={c}>
        <meshStandardMaterial color="#a8865c" roughness={0.6} />
      </mesh>
    </>
  )
}

/** Riel DIN de 35 mm (perfil sombrero, 35 × 7,5 mm) a lo largo de x. Las alas quedan en z = 0. */
function DinRail({ length, x = 0 }: { length: number; x?: number }) {
  const geo = useMemo(() => {
    const t = 0.1
    // perfil en el plano (y, z): alas adelante (z = 0), alma atrás (z = -0.75)
    const pts: [number, number][] = [
      [-1.75, 0],
      [-1.25, 0],
      [-1.25, -0.75],
      [1.25, -0.75],
      [1.25, 0],
      [1.75, 0],
      [1.75, -t],
      [1.25 + t, -t],
      [1.25 + t, -0.75 - t],
      [-1.25 - t, -0.75 - t],
      [-1.25 - t, -t],
      [-1.75, -t],
    ]
    const s = new THREE.Shape()
    pts.forEach(([y, z], i) => (i ? s.lineTo(z, y) : s.moveTo(z, y)))
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: length, bevelEnabled: false })
    // forma en (x=z, y=y), extruida en z → se gira para que la extrusión vaya por x
    g.rotateY(Math.PI / 2)
    g.translate(-length / 2, 0, 0)
    return g
  }, [length])
  const slots = useBoxes(
    Array.from({ length: Math.floor(length / 2.5) }, (_, i) => ({
      p: [-length / 2 + 1.25 + i * 2.5, 0, -0.69] as Vec3,
      s: [1.5, 0.52, 0.02] as Vec3,
    })),
    [length],
  )
  return (
    <group position={[x, 0, 0]}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color="#c3c7cb" metalness={0.85} roughness={0.38} />
      </mesh>
      {/* ranuras alargadas para los tornillos de fijación */}
      <mesh geometry={slots}>
        <meshStandardMaterial color="#0d0f12" roughness={0.9} />
      </mesh>
    </group>
  )
}

/** Cable de conexión con aislación de PVC (1 mm²). */
function Cable({ points, color }: { points: Vec3[]; color: string }) {
  return <Wire points={points} radius={0.075} color={color} metalness={0.05} roughness={0.55} smooth={0.3} />
}

/* ================================================================== */
/* Estado de entradas/salidas del LOGO! (compartido con los controles) */
/* ================================================================== */

export type LogoProgram = 'directo' | 'and' | 'or' | 'auto'

export const LOGO_PROGRAMS: { value: LogoProgram; label: string; desc: string }[] = [
  { value: 'directo', label: 'Directo', desc: 'Q1 = I1, Q2 = I2, Q3 = I3, Q4 = I4. Cada salida copia a su entrada.' },
  { value: 'and', label: 'Y (AND)', desc: 'Q1 = I1 · I2: la salida se activa sólo si I1 Y I2 están en 1 (como dos contactos en serie).' },
  { value: 'or', label: 'O (OR)', desc: 'Q1 = I1 + I2: la salida se activa si I1 O I2 (o las dos) están en 1 (contactos en paralelo).' },
  { value: 'auto', label: 'Autorretención', desc: 'I1 = marcha, I2 = parada. Un toque en I1 enciende Q1 y queda encendida (se “retiene”) hasta que se toca I2. Q1 = (I1 + Q1) · ¬I2.' },
]

interface LogoIO {
  /** entradas fijadas desde el panel de controles (interruptores) */
  sw: boolean[]
  /** pulsadores 3D apretados en este momento */
  held: boolean[]
  latch: boolean
  program: LogoProgram
}

const fresh = (): LogoIO => ({ sw: Array(8).fill(false), held: Array(8).fill(false), latch: false, program: 'directo' })
let io: LogoIO = fresh()
const listeners = new Set<() => void>()

export const logoInputs = (s: LogoIO) => s.sw.map((v, i) => v || s.held[i])

export function logoOutputs(s: LogoIO): boolean[] {
  const I = logoInputs(s)
  switch (s.program) {
    case 'directo':
      return [I[0], I[1], I[2], I[3]]
    case 'and':
      return [I[0] && I[1], false, false, false]
    case 'or':
      return [I[0] || I[1], false, false, false]
    case 'auto':
      return [s.latch, false, false, false]
  }
}

function commit(next: LogoIO) {
  // un ciclo de programa: con autorretención, Q1 = (I1 + Q1) · ¬I2 (gana la parada)
  const I = logoInputs(next)
  next.latch = next.program === 'auto' ? !I[1] && (I[0] || next.latch) : false
  io = next
  listeners.forEach((l) => l())
}

export const logoIO = {
  get: () => io,
  subscribe(l: () => void) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
  toggle(n: number) {
    const sw = [...io.sw]
    sw[n] = !sw[n]
    commit({ ...io, sw })
  },
  hold(n: number, v: boolean) {
    if (io.held[n] === v) return
    const held = [...io.held]
    held[n] = v
    commit({ ...io, held })
  },
  setProgram(program: LogoProgram) {
    if (io.program === program) return
    commit({ ...io, program, latch: false })
  },
  clear() {
    commit({ ...fresh(), program: io.program })
  },
}

export const useLogoIO = () => useSyncExternalStore(logoIO.subscribe, logoIO.get, logoIO.get)

/* ================================================================== */
/* LOGO! 8 230RCE (71,5 × 90 × 60 mm, 4 módulos de ancho)              */
/* ================================================================== */

const LW = 7.15
const LH = 9.0
const LB = -2.75 // espalda (apoya sobre las alas del riel)
const LS = 1.15 // frente de los escalones de bornes
const LF = 2.75 // frente de la parte central
const LC = 2.6 // media altura de la parte central (ventana de 45 mm de los equipos modulares)

// bornes superiores: L1 N | I1…I4 | I5…I8
const TOP_X = [0, 0.6, 1.6, 2.2, 2.8, 3.4, 4.35, 4.95, 5.55, 6.15].map((x) => x - 3.075)
const TOP_NAMES = ['L1', 'N', 'I1', 'I2', 'I3', 'I4', 'I5', 'I6', 'I7', 'I8']
// bornes inferiores: Q1 (1 2) Q2 (1 2) Q3 (1 2) Q4 (1 2)
const BOT_X = [0, 0.6, 1.75, 2.35, 3.5, 4.1, 5.25, 5.85].map((x) => x - 2.925)
const SCREW_Y = 3.2
const HOLE_Z = LS - 0.6

// display y teclado (en el frente central)
const DX = -1.05
const DY = 0.38
const DW = 3.3
const DH = 1.95
const KX = 2.3
const KY = -0.05
const KD = 0.62
const RJ: [number, number] = [-2.35, -1.75]
const SD: [number, number] = [0.15, -1.85]

const DIAS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20000)
    return () => clearInterval(t)
  }, [])
  return now
}

function LogoDisplay({ inputs, outputs, powered }: { inputs: boolean[]; outputs: boolean[]; powered: boolean }) {
  const now = useClock()
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const fecha = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`
  const key = inputs.map(Number).join('') + outputs.map(Number).join('') + powered + hhmm
  const tex = useCanvasTexture(
    660,
    390,
    (ctx, w, h) => {
      const bg = powered ? '#cfe1d7' : '#4c5652'
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)
      if (powered) {
        // brillo parejo de la retroiluminación, algo más intenso en el centro
        const g = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.7)
        g.addColorStop(0, 'rgba(255,255,255,0.35)')
        g.addColorStop(1, 'rgba(160,190,180,0.15)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }
      if (!powered) return
      // 6 renglones × 16 caracteres, como el display real
      const lineH = h / 6
      const fs = Math.floor(lineH * 0.78)
      const cw = (w - 40) / 16
      ctx.font = `bold ${fs}px "DejaVu Sans Mono", "Consolas", monospace`
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      const ink = '#16201c'
      const put = (row: number, col: number, text: string, inv = false) => {
        for (let i = 0; i < text.length; i++) {
          const x = 20 + (col + i) * cw
          const y = lineH * row + lineH / 2
          if (inv) {
            ctx.fillStyle = ink
            ctx.fillRect(x + 1, y - lineH * 0.46, cw - 2, lineH * 0.92)
            ctx.fillStyle = bg
          } else ctx.fillStyle = ink
          ctx.fillText(text[i], x + cw / 2, y + 2)
        }
      }
      put(0, 0, `${DIAS[now.getDay()]} ${hhmm}`)
      put(1, 0, fecha)
      put(3, 0, 'I:')
      inputs.forEach((v, i) => put(3, 2 + i, String(i + 1), v))
      put(5, 0, 'Q:')
      outputs.forEach((v, i) => put(5, 2 + i, String(i + 1), v))
    },
    [key],
  )
  return (
    <group position={[DX, DY, LF]}>
      {/* módulo LCD: marco metálico y vidrio */}
      <mesh position={[0, 0, -0.25]}>
        <boxGeometry args={[DW + 0.3, DH + 0.3, 0.45]} />
        <meshStandardMaterial {...metal} roughness={0.4} />
      </mesh>
      <mesh position={[0, -DH / 2 - 0.25, -0.5]}>
        <boxGeometry args={[1.4, 0.3, 0.02]} />
        <meshStandardMaterial color="#c58a2b" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[DW, DH]} />
        <meshStandardMaterial
          map={tex}
          emissive="#ffffff"
          emissiveMap={tex}
          emissiveIntensity={powered ? 0.35 : 0}
          roughness={0.35}
        />
      </mesh>
      {/* ventana transparente que refleja el ambiente */}
      <mesh position={[0, 0, 0.012]}>
        <planeGeometry args={[DW + 0.2, DH + 0.2]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.12} roughness={0.05} metalness={0} clearcoat={1} />
      </mesh>
    </group>
  )
}

function KeyCap({ position, label, w = 0.52 }: { position: [number, number]; label: string; w?: number }) {
  const tex = useCanvasTexture(
    128,
    128,
    (ctx, cw, ch) => {
      ctx.fillStyle = '#596067'
      ctx.fillRect(0, 0, cw, ch)
      ctx.fillStyle = '#f2f4f5'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const tri = (a: number) => {
        ctx.save()
        ctx.translate(cw / 2, ch / 2)
        ctx.rotate(a)
        ctx.beginPath()
        ctx.moveTo(0, -26)
        ctx.lineTo(24, 18)
        ctx.lineTo(-24, 18)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
      if (label === 'up') tri(0)
      else if (label === 'right') tri(Math.PI / 2)
      else if (label === 'down') tri(Math.PI)
      else if (label === 'left') tri(-Math.PI / 2)
      else {
        ctx.font = 'bold 44px sans-serif'
        ctx.fillText(label, cw / 2, ch / 2 + 2)
      }
    },
    [label],
  )
  return (
    <group position={[position[0], position[1], LF]}>
      <RoundedBox args={[w, 0.52, 0.2]} radius={0.06} smoothness={3} position={[0, 0, 0.04]}>
        <meshStandardMaterial color="#596067" roughness={0.55} />
      </RoundedBox>
      <mesh position={[0, 0, 0.141]}>
        <planeGeometry args={[w - 0.1, 0.42]} />
        <meshStandardMaterial map={tex} roughness={0.55} />
      </mesh>
      {/* vástago que aprieta el pulsador de la placa */}
      <mesh position={[0, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.5, 10]} />
        <meshStandardMaterial color="#e8e8e2" roughness={0.6} />
      </mesh>
    </group>
  )
}

function LogoHousing() {
  const S = 160
  const face = useCanvasTexture(
    Math.round(LW * S),
    Math.round(2 * LC * S),
    (ctx, w, h) => {
      const fx = (x: number) => (x + LW / 2) * S
      const fy = (y: number) => (LC - y) * S
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, '#d4d7d3')
      g.addColorStop(1, '#c7cac6')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      // marco oscuro del display
      ctx.fillStyle = '#2b2f33'
      ctx.beginPath()
      ctx.roundRect(fx(DX - DW / 2 - 0.2), fy(DY + DH / 2 + 0.2), (DW + 0.4) * S, (DH + 0.4) * S, 0.12 * S)
      ctx.fill()
      // zona del teclado, levemente hundida
      ctx.fillStyle = '#bcc0bc'
      ctx.beginPath()
      ctx.roundRect(fx(1.15), fy(1.65), 2.3 * S, 3.4 * S, 0.15 * S)
      ctx.fill()
      ctx.fillStyle = '#00807f'
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'left'
      ctx.font = `bold ${0.42 * S}px Arial, sans-serif`
      ctx.fillText('SIEMENS', fx(-3.2), fy(2.03))
      ctx.fillStyle = '#26323b'
      ctx.textAlign = 'right'
      ctx.font = `bold italic ${0.46 * S}px Arial, sans-serif`
      ctx.fillText('LOGO!', fx(3.05), fy(2.05))
      ctx.font = `bold ${0.34 * S}px Arial, sans-serif`
      ctx.fillStyle = '#00807f'
      ctx.fillText('8', fx(3.35), fy(2.07))
      ctx.fillStyle = '#3d474f'
      ctx.font = `${0.17 * S}px Arial, sans-serif`
      ctx.fillText('230RCE', fx(3.35), fy(1.82))
      ctx.textAlign = 'center'
      ctx.font = `bold ${0.15 * S}px Arial, sans-serif`
      ctx.fillText('X1  LAN', fx(RJ[0]), fy(RJ[1] + 0.68))
      ctx.fillText('SD', fx(SD[0] - 0.95), fy(SD[1]))
      ctx.textAlign = 'right'
      ctx.font = `${0.14 * S}px Arial, sans-serif`
      ctx.fillText('6ED1052-1FB08-0BA1', fx(3.4), fy(-2.4))
      // abertura del puerto Ethernet y de la ranura SD
      ctx.fillStyle = '#1d2024'
      ctx.fillRect(fx(RJ[0] - 0.7), fy(RJ[1] + 0.58), 1.4 * S, 1.16 * S)
    },
    [],
  )
  const shoulder = (top: boolean) => (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const fx = (x: number) => (x + LW / 2) * S
    const fy = (y: number) => (top ? LH / 2 - y : -LC - y) * S
    ctx.fillStyle = '#ccd0cb'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#23292e'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (top) {
      ctx.font = `bold ${0.27 * S}px Arial, sans-serif`
      TOP_NAMES.forEach((n, i) => ctx.fillText(n, fx(TOP_X[i]), fy(3.85)))
      ctx.font = `${0.13 * S}px Arial, sans-serif`
      ctx.fillText('115…240 V AC/DC', fx((TOP_X[0] + TOP_X[1]) / 2), fy(4.27))
      ctx.fillText('8 × DI  AC/DC', fx((TOP_X[2] + TOP_X[9]) / 2), fy(4.27))
      // líneas que agrupan los bornes
      ctx.fillRect(fx(TOP_X[2] - 0.2), fy(2.75), (TOP_X[5] - TOP_X[2] + 0.4) * S, 3)
      ctx.fillRect(fx(TOP_X[6] - 0.2), fy(2.75), (TOP_X[9] - TOP_X[6] + 0.4) * S, 3)
    } else {
      for (let q = 0; q < 4; q++) {
        const a = BOT_X[q * 2]
        const b = BOT_X[q * 2 + 1]
        ctx.font = `bold ${0.2 * S}px Arial, sans-serif`
        ctx.fillText('1', fx(a), fy(-3.78))
        ctx.fillText('2', fx(b), fy(-3.78))
        ctx.font = `bold ${0.27 * S}px Arial, sans-serif`
        ctx.fillText(`Q${q + 1}`, fx((a + b) / 2), fy(-4.17))
        ctx.fillRect(fx(a - 0.15), fy(-2.75), (b - a + 0.3) * S, 3)
      }
    }
  }
  const topTex = useCanvasTexture(Math.round(LW * S), Math.round((LH / 2 - LC) * S), shoulder(true), [])
  const botTex = useCanvasTexture(Math.round(LW * S), Math.round((LH / 2 - LC) * S), shoulder(false), [])
  const holes = useBoxes(
    [...TOP_X.map((x) => ({ p: [x, LH / 2, HOLE_Z] as Vec3, s: [0.38, 0.01, 0.44] as Vec3 })), ...BOT_X.map((x) => ({ p: [x, -LH / 2, HOLE_Z] as Vec3, s: [0.38, 0.01, 0.44] as Vec3 }))],
    [],
  )
  // ranuras de ventilación arriba y abajo
  const vents = useBoxes(
    [-1, 1].flatMap((sy) =>
      Array.from({ length: 9 }, (_, i) => ({ p: [-2.8 + i * 0.7, (sy * LH) / 2, LB + 1.0] as Vec3, s: [0.42, 0.01, 1.3] as Vec3 })),
    ),
    [],
  )
  const recess = useMemo(() => new THREE.RingGeometry(0.19, 0.25, 24), [])
  const half = LH / 2 - LC
  return (
    <>
      {/* cuerpo trasero (ancho completo) y parte central que sobresale */}
      <RoundedBox args={[LW, LH, LS - LB]} radius={0.1} smoothness={3} position={[0, 0, (LB + LS) / 2]} castShadow>
        <meshStandardMaterial color={RAL7035} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[LW, 2 * LC, LF - LS + 0.3]} radius={0.12} smoothness={3} position={[0, 0, (LS - 0.3 + LF) / 2]} castShadow>
        <meshStandardMaterial color="#d0d3cf" roughness={0.55} />
      </RoundedBox>
      <mesh position={[0, 0, LF + 0.001]}>
        <planeGeometry args={[LW - 0.12, 2 * LC - 0.12]} />
        <meshStandardMaterial map={face} roughness={0.55} />
      </mesh>
      <mesh position={[0, LC + half / 2, LS + 0.001]}>
        <planeGeometry args={[LW - 0.16, half - 0.08]} />
        <meshStandardMaterial map={topTex} roughness={0.6} />
      </mesh>
      <mesh position={[0, -LC - half / 2, LS + 0.001]}>
        <planeGeometry args={[LW - 0.16, half - 0.08]} />
        <meshStandardMaterial map={botTex} roughness={0.6} />
      </mesh>
      {/* agujeros donde entran los cables y anillos alrededor de los tornillos */}
      <mesh geometry={holes}>
        <meshStandardMaterial color="#121416" roughness={0.9} />
      </mesh>
      <mesh geometry={vents}>
        <meshStandardMaterial color="#2a2e31" roughness={0.9} />
      </mesh>
      {TOP_X.map((x) => (
        <mesh key={`t${x}`} geometry={recess} position={[x, SCREW_Y, LS + 0.003]}>
          <meshStandardMaterial color="#3a3f44" roughness={0.8} />
        </mesh>
      ))}
      {BOT_X.map((x) => (
        <mesh key={`b${x}`} geometry={recess} position={[x, -SCREW_Y, LS + 0.003]}>
          <meshStandardMaterial color="#3a3f44" roughness={0.8} />
        </mesh>
      ))}
      {/* tapa de la interfaz de ampliación (costado derecho) */}
      <mesh position={[LW / 2 + 0.002, 0, -0.2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.2, 2.6]} />
        <meshStandardMaterial color="#b9bdb9" roughness={0.6} />
      </mesh>
      {/* ganchos fijos de arriba que se enganchan en el ala del riel */}
      <mesh position={[0, 1.9, LB - 0.08]}>
        <boxGeometry args={[4.5, 0.3, 0.16]} />
        <meshStandardMaterial color="#c4c7c3" roughness={0.6} />
      </mesh>
    </>
  )
}

/** Bornera con tornillos al frente y entrada de cable arriba (o abajo). */
function TerminalBlock({ xs, top }: { xs: number[]; top: boolean }) {
  const sy = top ? 1 : -1
  const x0 = Math.min(...xs) - 0.3
  const x1 = Math.max(...xs) + 0.3
  const yc = sy * (LC + (LH / 2 - LC) / 2)
  return (
    <group>
      <mesh position={[(x0 + x1) / 2, yc, (LB + 0.9 + LS - 0.03) / 2]}>
        <boxGeometry args={[x1 - x0, LH / 2 - LC - 0.2, LS - 0.03 - (LB + 0.9)]} />
        <meshStandardMaterial color="#4b5157" roughness={0.6} />
      </mesh>
      {xs.map((x) => (
        <group key={x}>
          <FrontScrew position={[x, sy * SCREW_Y, LS - 0.06]} />
          {/* jaula metálica que aprieta el cable */}
          <mesh position={[x, sy * (LH / 2 - 0.45), HOLE_Z]}>
            <boxGeometry args={[0.42, 0.5, 0.5]} />
            <meshStandardMaterial {...tinned} />
          </mesh>
          {/* pata soldada a la placa de potencia */}
          <mesh position={[x, sy * (LC + 0.4), LB + 0.6]}>
            <boxGeometry args={[0.1, 0.1, 0.6]} />
            <meshStandardMaterial {...tinned} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Relay({ x, label }: { x: number; label: THREE.Texture }) {
  return (
    <group position={[x, -1.35, -2.27 + 0.75]}>
      <RoundedBox args={[1.28, 2.3, 1.5]} radius={0.05} smoothness={2} castShadow>
        <meshStandardMaterial color="#1f4d8f" roughness={0.45} />
      </RoundedBox>
      <mesh position={[0, 0, 0.752]}>
        <planeGeometry args={[1.18, 2.2]} />
        <meshStandardMaterial map={label} roughness={0.45} />
      </mesh>
    </group>
  )
}

function PowerBoard() {
  const capGeo = useMemo(
    () =>
      latheGeometry([
        [0, 0],
        [0.36, 0],
        [0.38, 0.03],
        [0.38, 1.05],
        [0.35, 1.1],
        [0, 1.1],
      ], 28),
    [],
  )
  return (
    <>
      <Pcb w={6.8} h={8.5} position={[0, 0, -2.35]} seed={11} />
      {/* transformador del convertidor conmutado (ferrita + bobinado con cinta) */}
      <group position={[-1.7, 1.2, -2.27]}>
        <mesh position={[0, 0, 0.55]}>
          <boxGeometry args={[1.5, 1.1, 1.0]} />
          <meshStandardMaterial color="#e3c13c" roughness={0.6} />
        </mesh>
        {[-0.62, 0.62].map((y) => (
          <mesh key={y} position={[0, y, 0.55]}>
            <boxGeometry args={[1.25, 0.16, 1.1]} />
            <meshStandardMaterial color="#2f3033" roughness={0.7} />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.55]}>
          <boxGeometry args={[0.5, 1.4, 1.1]} />
          <meshStandardMaterial color="#2f3033" roughness={0.7} />
        </mesh>
      </group>
      {/* capacitores electrolíticos de filtro */}
      {[
        [0.45, 1.6, 1],
        [1.45, 1.6, 0.8],
      ].map(([x, y, s]) => (
        <group key={x} position={[x, y, -2.27]} rotation={[Math.PI / 2, 0, 0]} scale={[s, s, s]}>
          <mesh geometry={capGeo}>
            <meshStandardMaterial color="#20304f" roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.101, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.35, 28]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        </group>
      ))}
      {/* varistor de protección (disco azul) y rectificador */}
      <mesh position={[2.6, 1.5, -1.9]}>
        <cylinderGeometry args={[0.38, 0.38, 0.14, 24]} />
        <meshStandardMaterial color="#1e63b8" roughness={0.5} />
      </mesh>
      <mesh position={[0.95, 0.45, -2.1]}>
        <boxGeometry args={[0.9, 0.5, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
      </mesh>
      <SoicZ position={[-0.3, 0.4, -2.27]} pins={8} label="TNY" />
      <mesh position={[2.6, 0.45, -2.0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.14, 0.14, 0.9, 16]} />
        <meshPhysicalMaterial color="#e8eef0" transparent opacity={0.55} roughness={0.05} />
      </mesh>
      {/* conector hacia la placa CPU */}
      <mesh position={[-2.9, -0.0, -1.5]}>
        <boxGeometry args={[0.35, 2.4, 1.5]} />
        <meshStandardMaterial color="#efe9d8" roughness={0.6} />
      </mesh>
    </>
  )
}

function CpuBoard() {
  return (
    <>
      <Pcb w={6.8} h={4.9} position={[0, 0, 1.45]} seed={3} />
      <group position={[0, 0, 1.53]}>
        <Qfp position={[-1.6, 0.6, 0]} size={1.3} label="LOGO! CPU" />
        <SoicZ position={[0.0, 1.05, 0]} pins={8} label="FLASH" />
        <SoicZ position={[0.0, 0.25, 0]} pins={14} label="RTC" />
        <mesh position={[-0.2, -0.45, 0.08]}>
          <boxGeometry args={[0.55, 0.22, 0.16]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        {/* pila de respaldo del reloj (supercapacitor) */}
        <mesh position={[-2.65, -0.55, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.4, 24]} />
          <meshStandardMaterial color="#353a40" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* chip Ethernet */}
        <Qfp position={[-0.9, -1.75, 0]} size={0.8} label="ETH" />
        {/* micropulsadores debajo de cada tecla */}
        {(
          [
            [KX, KY + KD],
            [KX, KY - KD],
            [KX - KD, KY],
            [KX + KD, KY],
            [KX - 0.75, KY + 1.3],
            [KX + 0.75, KY - 1.3],
          ] as [number, number][]
        ).map(([x, y]) => (
          <group key={`${x}${y}`} position={[x, y, 0]}>
            <mesh position={[0, 0, 0.09]}>
              <boxGeometry args={[0.45, 0.45, 0.18]} />
              <meshStandardMaterial color="#1b1b1d" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 0.1, 12]} />
              <meshStandardMaterial color="#2a2a2c" />
            </mesh>
          </group>
        ))}
        <SmdScatter
          items={[
            [-0.6, 1.5, 0, 'R'],
            [-0.3, 1.5, 0, 'C'],
            [0.6, 1.5, 1, 'R'],
            [0.8, 0.9, 1, 'C'],
            [0.8, 0.4, 1, 'R'],
            [-2.6, 1.4, 0, 'C'],
            [-2.6, 1.1, 0, 'R'],
            [-2.6, 0.2, 0, 'C'],
            [-0.5, -1.2, 0, 'R'],
            [-0.2, -1.2, 0, 'R'],
            [0.1, -1.2, 0, 'C'],
            [0.6, -0.9, 1, 'C'],
            [1.1, 1.7, 0, 'R'],
            [1.4, 1.7, 0, 'C'],
            [3.1, 1.6, 1, 'R'],
            [1.3, -2.1, 0, 'C'],
            [1.7, -2.1, 0, 'R'],
          ]}
        />
      </group>
    </>
  )
}

function RJ45() {
  const contacts = useBoxes(
    Array.from({ length: 8 }, (_, i) => ({ p: [-0.35 + i * 0.1, 0.25, -0.35] as Vec3, s: [0.03, 0.02, 0.5] as Vec3 })),
    [],
  )
  return (
    <group position={[RJ[0], RJ[1], LF]}>
      {/* blindaje metálico */}
      <mesh position={[0, 0, -0.8]}>
        <boxGeometry args={[1.3, 1.08, 1.6]} />
        <meshStandardMaterial {...metal} roughness={0.35} />
      </mesh>
      {/* boca del conector */}
      <mesh position={[0, -0.04, -0.25]}>
        <boxGeometry args={[0.98, 0.8, 0.5]} />
        <meshStandardMaterial color="#0c0d0f" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.04, 0.001]}>
        <planeGeometry args={[0.98, 0.8]} />
        <meshStandardMaterial color="#000" transparent opacity={0.4} />
      </mesh>
      <mesh geometry={contacts}>
        <meshStandardMaterial {...metal} color="#e0bf5a" />
      </mesh>
      {/* traba de la ficha (muesca abajo) */}
      <mesh position={[0, -0.4, -0.1]}>
        <boxGeometry args={[0.42, 0.18, 0.4]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      {/* LEDs de enlace y actividad */}
      {[
        [-0.5, '#3dff6a'],
        [0.5, '#ffb12a'],
      ].map(([x, c]) => (
        <mesh key={x as number} position={[x as number, 0.42, 0.004]}>
          <planeGeometry args={[0.18, 0.12]} />
          <meshStandardMaterial color={c as string} emissive={c as string} emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function MicroSd() {
  return (
    <group position={[SD[0], SD[1], LF]}>
      {/* tapa articulada de la ranura */}
      <RoundedBox args={[1.4, 0.5, 0.06]} radius={0.025} smoothness={2} position={[0, 0, 0.02]}>
        <meshStandardMaterial color="#9aa0a3" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, -0.12, 0.052]}>
        <boxGeometry args={[0.6, 0.06, 0.02]} />
        <meshStandardMaterial color="#6d7376" />
      </mesh>
      {/* tarjeta micro SD (11 × 15 mm) */}
      <mesh position={[0, 0.0, -0.8]}>
        <boxGeometry args={[1.1, 0.08, 1.5]} />
        <meshStandardMaterial color="#1c1c1e" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.041, -0.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 1.1]} />
        <meshStandardMaterial color="#c43a3a" roughness={0.5} />
      </mesh>
      {/* zócalo metálico */}
      <mesh position={[0, -0.09, -0.9]}>
        <boxGeometry args={[1.25, 0.08, 1.4]} />
        <meshStandardMaterial {...metal} />
      </mesh>
    </group>
  )
}

function DinClip() {
  const spring = useMemo(() => springGeometry(0.12, 0.02, 7), [])
  return (
    <group>
      {/* corredera que traba el ala inferior del riel */}
      <mesh position={[0, -3.1, LB - 0.06]}>
        <boxGeometry args={[1.8, 2.9, 0.12]} />
        <meshStandardMaterial color="#c9ccc8" roughness={0.6} />
      </mesh>
      <mesh position={[0, -1.72, LB - 0.2]}>
        <boxGeometry args={[1.8, 0.16, 0.25]} />
        <meshStandardMaterial color="#c9ccc8" roughness={0.6} />
      </mesh>
      {/* lengüeta para el destornillador */}
      <mesh position={[0, -LH / 2 - 0.15, LB + 0.35]}>
        <boxGeometry args={[1.1, 0.3, 0.7]} />
        <meshStandardMaterial color="#c9ccc8" roughness={0.6} />
      </mesh>
      <mesh position={[0, -LH / 2 - 0.301, LB + 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 0.18]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* resorte interno de la corredera */}
      <mesh geometry={spring} position={[0, -2.3, LB - 0.25]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1.2]}>
        <meshStandardMaterial {...metal} />
      </mesh>
    </group>
  )
}

/* ---------------------------------------------------- tablero de prueba */

const BX = LW / 2 + 1.3 + 4.6 // centro del tablero
const BOARD_W = 9.2
const BTN_COLORS = ['#1f9d45', '#d0261d', '#25272b', '#25272b']
const LAMP_COLORS = ['#2fd655', '#ffa514', '#ff2a1f', '#f4f1e6']
const LAMP_OFF = ['#1d5a2c', '#7a5212', '#6e1712', '#8d8b84']
const btnX = (i: number) => BX - 3.3 + i * 2.2

function TestBoard({ inputs, outputs }: { inputs: boolean[]; outputs: boolean[] }) {
  const S = 110
  const tex = useCanvasTexture(
    Math.round(BOARD_W * S),
    Math.round(9 * S),
    (ctx, w, h) => {
      const fx = (x: number) => (x - BX + BOARD_W / 2) * S
      const fy = (y: number) => (4.5 - y) * S
      ctx.fillStyle = '#c9ccc8'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#2a3036'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `bold ${0.36 * S}px Arial, sans-serif`
      ctx.fillText('TABLERO DE PRUEBA', fx(BX), fy(3.75))
      ctx.font = `${0.24 * S}px Arial, sans-serif`
      ctx.fillText('Pulsadores → entradas', fx(BX), fy(3.25))
      ctx.fillText('Salidas → lámparas piloto', fx(BX), fy(-0.55))
      ctx.font = `bold ${0.34 * S}px Arial, sans-serif`
      for (let i = 0; i < 4; i++) {
        ctx.fillText(`I${i + 1}`, fx(btnX(i)), fy(0.55))
        ctx.fillText(`Q${i + 1}`, fx(btnX(i)), fy(-3.75))
      }
      ctx.strokeStyle = '#2a3036'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(fx(BX - 4.2), fy(0.05))
      ctx.lineTo(fx(BX + 4.2), fy(0.05))
      ctx.stroke()
    },
    [],
  )
  const bezel = useMemo(
    () =>
      latheGeometry([
        [0.62, 0.32],
        [0.8, 0.3],
        [0.88, 0.2],
        [0.9, 0],
      ], 40),
    [],
  )
  const dome = useMemo(
    () =>
      latheGeometry([
        [0.62, 0],
        [0.62, 0.3],
        [0.52, 0.5],
        [0.3, 0.6],
        [0, 0.62],
      ], 32),
    [],
  )
  return (
    <>
      <RoundedBox args={[BOARD_W, 9, 2.6]} radius={0.15} smoothness={3} position={[BX, 0, LB + 1.3]} castShadow>
        <meshStandardMaterial color="#bfc3bf" roughness={0.5} />
      </RoundedBox>
      <mesh position={[BX, 0, LB + 2.601]}>
        <planeGeometry args={[BOARD_W - 0.2, 8.8]} />
        <meshStandardMaterial map={tex} roughness={0.5} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const x = btnX(i)
        const pressed = inputs[i]
        const press = (v: boolean) => (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          logoIO.hold(i, v)
        }
        return (
          <group key={i}>
            {/* pulsador: aro y botón */}
            <group position={[x, 1.75, LB + 2.6]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh geometry={bezel}>
                <meshStandardMaterial {...metal} roughness={0.2} side={THREE.DoubleSide} />
              </mesh>
              <mesh
                position={[0, pressed ? 0.12 : 0.32, 0]}
                onPointerDown={press(true)}
                onPointerUp={press(false)}
                onPointerOut={(e) => {
                  press(false)(e)
                  document.body.style.cursor = ''
                }}
                onPointerOver={(e) => {
                  e.stopPropagation()
                  document.body.style.cursor = 'pointer'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <cylinderGeometry args={[0.6, 0.6, 0.36, 32]} />
                <meshPhysicalMaterial color={BTN_COLORS[i]} roughness={0.35} clearcoat={0.6} />
              </mesh>
            </group>
            {/* lámpara piloto */}
            <group position={[x, -2.45, LB + 2.6]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh geometry={bezel}>
                <meshStandardMaterial {...metal} roughness={0.2} side={THREE.DoubleSide} />
              </mesh>
              <mesh geometry={dome} position={[0, 0.1, 0]}>
                <meshPhysicalMaterial
                  color={outputs[i] ? LAMP_COLORS[i] : LAMP_OFF[i]}
                  emissive={LAMP_COLORS[i]}
                  emissiveIntensity={outputs[i] ? 1.1 : 0}
                  transparent
                  opacity={0.92}
                  roughness={0.25}
                  clearcoat={1}
                />
              </mesh>
            </group>
            {outputs[i] && <pointLight position={[x, -2.45, LB + 3.6]} color={LAMP_COLORS[i]} intensity={1.6} distance={3} />}
          </group>
        )
      })}
      {/* cableado: entradas (naranja), salidas (rojo), fase (marrón) y neutro (celeste) */}
      {[0, 1, 2, 3].map((i) => {
        const x = TOP_X[i + 2]
        const xb = btnX(i)
        const yy = 5.1 + i * 0.22
        return (
          <Cable
            key={`i${i}`}
            color="#e8862a"
            points={[
              [x, LH / 2 - 0.3, HOLE_Z],
              [x, yy - 0.2, HOLE_Z],
              [x + 0.3, yy, HOLE_Z - 0.4],
              [xb - 0.3, yy, -1.0],
              [xb, yy - 0.2, -1.0],
              [xb, LH / 2 - 0.2, -1.0],
            ]}
          />
        )
      })}
      {[0, 1, 2, 3].map((i) => {
        const x = BOT_X[i * 2 + 1]
        const xb = btnX(i)
        const yy = -5.1 - (3 - i) * 0.22
        return (
          <Cable
            key={`q${i}`}
            color="#c62f2f"
            points={[
              [x, -LH / 2 + 0.3, HOLE_Z],
              [x, yy + 0.2, HOLE_Z],
              [x + 0.3, yy, HOLE_Z - 0.4],
              [xb - 0.3, yy, -1.3],
              [xb, yy + 0.2, -1.3],
              [xb, -LH / 2 + 0.2, -1.3],
            ]}
          />
        )
      })}
      <Cable
        color="#7a4a26"
        points={[
          [TOP_X[0], LH / 2 - 0.3, HOLE_Z],
          [TOP_X[0], 6.2, HOLE_Z],
          [TOP_X[0] + 0.4, 6.4, HOLE_Z - 0.4],
          [BX + 3.9, 6.4, -1.6],
          [BX + 4.1, 6.2, -1.6],
          [BX + 4.1, LH / 2 - 0.2, -1.6],
        ]}
      />
      <Cable
        color="#4a90d9"
        points={[
          [TOP_X[1], LH / 2 - 0.3, HOLE_Z],
          [TOP_X[1], 6.0, HOLE_Z],
          [TOP_X[1] + 0.4, 6.15, HOLE_Z - 0.6],
          [BX + 3.6, 6.15, -2.0],
          [BX + 3.8, 6.0, -2.0],
          [BX + 3.8, LH / 2 - 0.2, -2.0],
        ]}
      />
      {/* puentes de fase entre los bornes "1" de las salidas */}
      {[0, 1, 2].map((q) => (
        <Cable
          key={`p${q}`}
          color="#7a4a26"
          points={[
            [BOT_X[q * 2], -LH / 2 + 0.3, HOLE_Z],
            [BOT_X[q * 2], -LH / 2 - 0.35, HOLE_Z],
            [(BOT_X[q * 2] + BOT_X[q * 2 + 2]) / 2, -LH / 2 - 0.6, HOLE_Z - 0.2],
            [BOT_X[q * 2 + 2], -LH / 2 - 0.35, HOLE_Z],
            [BOT_X[q * 2 + 2], -LH / 2 + 0.3, HOLE_Z],
          ]}
        />
      ))}
      <Cable
        color="#7a4a26"
        points={[
          [BOT_X[0], -LH / 2 + 0.3, HOLE_Z - 0.1],
          [BOT_X[0] - 0.15, -6.3, HOLE_Z - 0.3],
          [BOT_X[0] + 0.3, -6.55, HOLE_Z - 0.6],
          [BX + 3.9, -6.55, -1.6],
          [BX + 4.1, -6.3, -1.6],
          [BX + 4.1, -LH / 2 + 0.2, -1.6],
        ]}
      />
    </>
  )
}

export function LogoModel({
  program,
  powered,
  rail,
  showBoard,
}: {
  program: LogoProgram
  powered: boolean
  rail: boolean
  showBoard: boolean
}) {
  const state = useLogoIO()
  useEffect(() => {
    logoIO.setProgram(program)
  }, [program])
  useEffect(() => () => logoIO.clear(), [])
  const inputs = logoInputs(state)
  const outputs = powered ? logoOutputs(state) : [false, false, false, false]
  const relayTex = useCanvasTexture(
    236,
    440,
    (ctx, w, h) => {
      ctx.fillStyle = '#1f4d8f'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#e9eef5'
      ctx.textAlign = 'center'
      ctx.font = 'bold 34px Arial, sans-serif'
      ctx.fillText('HF115F', w / 2, 70)
      ctx.font = '24px Arial, sans-serif'
      ctx.fillText('024-1HS3', w / 2, 110)
      ctx.fillText('16A 250VAC', w / 2, 150)
      ctx.fillText('16A 30VDC', w / 2, 185)
      // símbolo de bobina y contacto
      ctx.strokeStyle = '#e9eef5'
      ctx.lineWidth = 4
      ctx.strokeRect(50, 250, 40, 70)
      ctx.beginPath()
      ctx.moveTo(140, 330)
      ctx.lineTo(140, 300)
      ctx.lineTo(175, 255)
      ctx.moveTo(165, 290)
      ctx.lineTo(165, 240)
      ctx.stroke()
      ctx.font = '22px Arial, sans-serif'
      ctx.fillText('CE  ⓡ', w / 2, 400)
    },
    [],
  )

  // con el tablero se achica todo para que entre en la misma vista
  const root = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    const g = root.current
    if (!g) return
    const s = showBoard ? 0.72 : 1
    const k = 1 - Math.exp(-dt * 6)
    const ns = g.scale.x + (s - g.scale.x) * k
    g.scale.setScalar(ns)
    g.position.x += ((showBoard ? -5.3 * ns : 0) - g.position.x) * k
    g.position.y = -4.8 * (1 - ns)
  })

  return (
    <group ref={root}>
      <Part id="carcasa" offset={[-8.5, 0, -1]} labelAt={[-LW / 2 - 0.4, 3.9, LS]}>
        <LogoHousing />
      </Part>
      <Part id="display" offset={[-0.3, 0.8, 3.6]} labelAt={[DX, DY + 1.4, LF + 0.2]}>
        <LogoDisplay inputs={inputs} outputs={outputs} powered={powered} />
      </Part>
      <Part id="teclado" offset={[1.2, 0.5, 4.6]} labelAt={[KX, KY + 1.9, LF + 0.3]}>
        <KeyCap position={[KX, KY + KD]} label="up" />
        <KeyCap position={[KX, KY - KD]} label="down" />
        <KeyCap position={[KX - KD, KY]} label="left" />
        <KeyCap position={[KX + KD, KY]} label="right" />
        <KeyCap position={[KX - 0.75, KY + 1.3]} label="ESC" w={0.7} />
        <KeyCap position={[KX + 0.75, KY - 1.3]} label="OK" w={0.7} />
      </Part>
      <Part id="alimentacion" offset={[-1.0, 2.2, 0.5]} labelAt={[TOP_X[0] - 0.4, LH / 2 + 0.5, HOLE_Z]}>
        <TerminalBlock xs={TOP_X.slice(0, 2)} top />
      </Part>
      <Part id="entradas" offset={[0.5, 2.2, 0.5]} labelAt={[1.2, LH / 2 + 0.5, HOLE_Z]}>
        <TerminalBlock xs={TOP_X.slice(2)} top />
      </Part>
      <Part id="salidas" offset={[0, -2.6, 1.2]} labelAt={[0, -LH / 2 - 0.5, HOLE_Z]}>
        <TerminalBlock xs={BOT_X} top={false} />
      </Part>
      <Part id="reles" offset={[0, -2.3, 0.4]} labelAt={[-1.8, -1.0, -0.6]}>
        {[0, 1, 2, 3].map((q) => (
          <Relay key={q} x={(BOT_X[q * 2] + BOT_X[q * 2 + 1]) / 2} label={relayTex} />
        ))}
      </Part>
      <Part id="cpu" offset={[0, 0.5, 1.8]} labelAt={[-1.6, 2.7, 1.6]}>
        <CpuBoard />
      </Part>
      <Part id="fuente" offset={[0, 0, -2.8]} labelAt={[-1.7, 2.3, -1.5]}>
        <PowerBoard />
      </Part>
      <Part id="ethernet" offset={[-1.8, -2.6, 3]} labelAt={[RJ[0], RJ[1] - 0.9, LF]}>
        <RJ45 />
      </Part>
      <Part id="microsd" offset={[0.8, -3.2, 3.4]} labelAt={[SD[0], SD[1] - 0.6, LF + 0.1]}>
        <MicroSd />
      </Part>
      <Part id="clip" offset={[0, -2.5, -1.6]} labelAt={[0, -LH / 2 - 0.6, LB]}>
        <DinClip />
      </Part>
      {rail && (
        <Part id="riel" offset={[0, 0, -4]} labelAt={[showBoard ? -5.5 : -5, 0, LB - 0.4]}>
          <group position={[0, 0, LB]}>
            <DinRail length={showBoard ? 25 : 12.5} x={showBoard ? 5.2 : 0} />
          </group>
        </Part>
      )}
      {showBoard && (
        <Part id="tablero" offset={[4, 0, 0]} labelAt={[BX, 5.0, LB + 2.6]}>
          <TestBoard inputs={inputs} outputs={outputs} />
        </Part>
      )}
    </group>
  )
}

/* ================================================================== */
/* Contactor tripolar 12 A (45 × 57,5 × 73 mm, tipo SIRIUS 3RT2 S00)   */
/* ================================================================== */

const CW = 4.5
const CH = 5.75
const CB = -3.65 // espalda (sobre el riel)
const CSZ = 1.4 // frente de los escalones de bornes
const CFZ = 3.65 // frente de la parte central
const CC = 1.7 // media altura de la parte central
const POLES = [-1.35, -0.45, 0.45] // polos principales
const AUX_X = 1.35 // contacto auxiliar 13-14
const C_SCREW_Y = 2.2
const C_HOLE_Z = CSZ - 0.55
const TRAVEL = 0.35 // recorrido de la armadura
const BRIDGE_GAP = 0.25 // separación entre contactos abiertos
const COIL_X = 1.4 // bornes A1 / A2
const COIL_Y = 1.15

/** Núcleo en "E" de chapas apiladas; mira hacia +z (fijo) o hacia -z (armadura). */
function ECore({ facing, legL = 1.35 }: { facing: 1 | -1; legL?: number }) {
  const tex = useCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#6f757b'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#4c5156'
      for (let y = 0; y < h; y += 8) ctx.fillRect(0, y, w, 2)
    },
    [],
  )
  // en el eje y se ven las chapas apiladas (textura con rayas)
  const mat = <meshStandardMaterial color="#9aa0a6" map={tex} metalness={0.75} roughness={0.42} />
  const d = 0.8 // media altura del paquete de chapas (y)
  const yoke = 0.5
  return (
    <group scale={[1, 1, facing]}>
      <mesh position={[0, 0, yoke / 2]}>
        <boxGeometry args={[2.8, 2 * d, yoke]} />
        {mat}
      </mesh>
      {[-1.15, 1.15].map((x) => (
        <mesh key={x} position={[x, 0, yoke + legL / 2]}>
          <boxGeometry args={[0.5, 2 * d, legL]} />
          {mat}
        </mesh>
      ))}
      <mesh position={[0, 0, yoke + (legL - 0.04) / 2]}>
        <boxGeometry args={[0.9, 2 * d, legL - 0.04]} />
        {mat}
      </mesh>
    </group>
  )
}

/** Contactos fijos de un polo: chapa de cobre desde el borne hasta la pastilla de plata. */
function FixedContact({ x, w = 0.38 }: { x: number; w?: number }) {
  return (
    <group position={[x, 0, 0]}>
      {[-1, 1].map((sy) => (
        <group key={sy} scale={[1, sy, 1]}>
          <mesh position={[0, 2.1, 0.95]}>
            <boxGeometry args={[w, 0.1, 0.9]} />
            <meshStandardMaterial color="#c8794a" metalness={0.85} roughness={0.35} />
          </mesh>
          <mesh position={[0, 1.55, 0.55]}>
            <boxGeometry args={[w, 1.2, 0.1]} />
            <meshStandardMaterial color="#c8794a" metalness={0.85} roughness={0.35} />
          </mesh>
          <mesh position={[0, 1.0, 0.63]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.06, 16]} />
            <meshStandardMaterial color="#e4e6e8" metalness={0.95} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Puente móvil con sus dos pastillas de plata. */
function Bridge({ x, w = 0.38 }: { x: number; w?: number }) {
  return (
    <group position={[x, 0, 1.0]}>
      <mesh>
        <boxGeometry args={[w, 2.5, 0.12]} />
        <meshStandardMaterial color="#c8794a" metalness={0.85} roughness={0.35} />
      </mesh>
      {[-1, 1].map((sy) => (
        <mesh key={sy} position={[0, sy * 1.0, -0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.05, 16]} />
          <meshStandardMaterial color="#e4e6e8" metalness={0.95} roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
}

function ContactorHousing() {
  const S = 170
  const face = useCanvasTexture(
    Math.round(CW * S),
    Math.round(2 * CC * S),
    (ctx, w, h) => {
      const fx = (x: number) => (x + CW / 2) * S
      const fy = (y: number) => (CC - y) * S
      ctx.fillStyle = '#b9bcb8'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#21272c'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `bold ${0.26 * S}px Arial, sans-serif`
      ctx.fillText('A1', fx(-COIL_X), fy(0.65))
      ctx.fillText('A2', fx(COIL_X), fy(0.65))
      // anillos alrededor de los tornillos de la bobina
      ctx.font = `bold ${0.24 * S}px Arial, sans-serif`
      ctx.fillText('CONTACTOR', fx(0), fy(1.25))
      ctx.font = `${0.15 * S}px Arial, sans-serif`
      ctx.fillText('AC-3  12 A · 5,5 kW / 400 V', fx(0), fy(0.9))
      ctx.fillText('Uc = 230 V AC  50/60 Hz', fx(0), fy(0.65))
      // ventana del indicador / pulsador de prueba
      ctx.fillStyle = '#2b3035'
      ctx.beginPath()
      ctx.roundRect(fx(-0.5), fy(0.05), 1.0 * S, 0.7 * S, 0.08 * S)
      ctx.fill()
      // símbolo: 3 contactos principales + 13-14 + bobina
      ctx.strokeStyle = '#21272c'
      ctx.lineWidth = 3
      const y0 = -0.95
      const y1 = -1.45
      POLES.concat([AUX_X]).forEach((x, i) => {
        const X = fx(x * 0.8 + 0.1)
        ctx.beginPath()
        ctx.moveTo(X, fy(y0 + 0.15))
        ctx.lineTo(X, fy(y0))
        ctx.lineTo(X - 0.14 * S, fy(y1 + 0.08))
        ctx.moveTo(X, fy(y1 + 0.02))
        ctx.lineTo(X, fy(y1 - 0.12))
        ctx.stroke()
        ctx.font = `${0.11 * S}px Arial, sans-serif`
        ctx.fillStyle = '#21272c'
        ctx.fillText(['1', '3', '5', '13'][i], X + 0.12 * S, fy(y0 + 0.1))
        ctx.fillText(['2', '4', '6', '14'][i], X + 0.12 * S, fy(y1 - 0.06))
      })
      ctx.setLineDash([6, 5])
      ctx.beginPath()
      ctx.moveTo(fx(-1.6), fy((y0 + y1) / 2))
      ctx.lineTo(fx(1.35), fy((y0 + y1) / 2))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.strokeRect(fx(-2.0), fy(-1.0), 0.3 * S, 0.4 * S)
      ctx.font = `${0.1 * S}px Arial, sans-serif`
      ctx.fillText('A1', fx(-1.85), fy(-0.88))
      ctx.fillText('A2', fx(-1.85), fy(-1.5))
    },
    [],
  )
  const shoulder = (top: boolean) => (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const fx = (x: number) => (x + CW / 2) * S
    const fy = (y: number) => (top ? CH / 2 - y : -CC - y) * S
    ctx.fillStyle = '#b3b7b3'
    ctx.fillRect(0, 0, w, h)
    // separadores entre polos
    ctx.fillStyle = '#8f9490'
    for (const x of [-0.9, 0, 0.9]) ctx.fillRect(fx(x) - 3, 0, 6, h)
    ctx.fillStyle = '#21272c'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `bold ${0.19 * S}px Arial, sans-serif`
    const names = top ? ['1/L1', '3/L2', '5/L3', '13 NO'] : ['2/T1', '4/T2', '6/T3', '14 NO']
    POLES.concat([AUX_X]).forEach((x, i) => ctx.fillText(names[i], fx(x), fy(top ? 2.62 : -2.62)))
  }
  const half = CH / 2 - CC
  const topTex = useCanvasTexture(Math.round(CW * S), Math.round(half * S), shoulder(true), [])
  const botTex = useCanvasTexture(Math.round(CW * S), Math.round(half * S), shoulder(false), [])
  const xs = POLES.concat([AUX_X])
  const holes = useBoxes(
    [
      ...xs.flatMap((x) => [-1, 1].map((sy) => ({ p: [x, (sy * CH) / 2, C_HOLE_Z] as Vec3, s: [0.42, 0.01, 0.5] as Vec3 }))),
      ...[-COIL_X, COIL_X].map((x) => ({ p: [x, CC, CFZ - 0.45] as Vec3, s: [0.4, 0.01, 0.45] as Vec3 })),
    ],
    [],
  )
  const recess = useMemo(() => new THREE.RingGeometry(0.2, 0.27, 24), [])
  return (
    <>
      <RoundedBox args={[CW, CH, CSZ - CB]} radius={0.1} smoothness={3} position={[0, 0, (CB + CSZ) / 2]} castShadow>
        <meshStandardMaterial color="#a9adaa" roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[CW, 2 * CC, CFZ - CSZ + 0.3]} radius={0.14} smoothness={3} position={[0, 0, (CSZ - 0.3 + CFZ) / 2]} castShadow>
        <meshStandardMaterial color="#bcbfbb" roughness={0.55} />
      </RoundedBox>
      <mesh position={[0, 0, CFZ + 0.001]}>
        <planeGeometry args={[CW - 0.14, 2 * CC - 0.14]} />
        <meshStandardMaterial map={face} roughness={0.55} />
      </mesh>
      <mesh position={[0, CC + half / 2, CSZ + 0.001]}>
        <planeGeometry args={[CW - 0.16, half - 0.06]} />
        <meshStandardMaterial map={topTex} roughness={0.6} />
      </mesh>
      <mesh position={[0, -CC - half / 2, CSZ + 0.001]}>
        <planeGeometry args={[CW - 0.16, half - 0.06]} />
        <meshStandardMaterial map={botTex} roughness={0.6} />
      </mesh>
      <mesh geometry={holes}>
        <meshStandardMaterial color="#121416" roughness={0.9} />
      </mesh>
      {xs.flatMap((x) =>
        [-1, 1].map((sy) => (
          <mesh key={`${x}${sy}`} geometry={recess} position={[x, sy * C_SCREW_Y, CSZ + 0.003]}>
            <meshStandardMaterial color="#3a3f44" roughness={0.8} />
          </mesh>
        )),
      )}
      {[-COIL_X, COIL_X].map((x) => (
        <mesh key={x} geometry={recess} position={[x, COIL_Y, CFZ + 0.003]}>
          <meshStandardMaterial color="#3a3f44" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 1.95, CB - 0.08]}>
        <boxGeometry args={[3.2, 0.3, 0.16]} />
        <meshStandardMaterial color="#b9bcb8" roughness={0.6} />
      </mesh>
      <mesh position={[0, -CH / 2 - 0.12, CB + 0.35]}>
        <boxGeometry args={[1.0, 0.25, 0.7]} />
        <meshStandardMaterial color="#b9bcb8" roughness={0.6} />
      </mesh>
    </>
  )
}

export function ContactorModel({ energized }: { energized: boolean }) {
  const k = useRef(0)
  const arm = useRef<THREE.Group>(null)
  const car = useRef<THREE.Group>(null)
  const bridges = useRef<THREE.Group>(null)
  const aux = useRef<THREE.Group>(null)
  const springs = useRef<THREE.Group>(null)
  const cSprings = useRef<THREE.Group>(null)
  const coilMat = useRef<THREE.MeshStandardMaterial>(null)
  const retSpring = useMemo(() => springGeometry(0.2, 0.03, 15), [])
  const conSpring = useMemo(() => springGeometry(0.11, 0.022, 5), [])

  useFrame((_, dt) => {
    // cierra rápido (atracción magnética) y abre un poco más lento (resortes)
    const target = energized ? 1 : 0
    k.current += (target - k.current) * (1 - Math.exp(-dt * (energized ? 14 : 9)))
    const t = k.current * TRAVEL
    const b = Math.min(t, BRIDGE_GAP)
    if (arm.current) arm.current.position.z = -t
    if (car.current) car.current.position.z = -t
    if (bridges.current) bridges.current.position.z = -b
    if (aux.current) aux.current.position.z = -b
    if (springs.current) springs.current.children.forEach((c) => (c.scale.z = 3.15 - t))
    if (cSprings.current)
      cSprings.current.children.forEach((c) => {
        c.position.z = 1.06 - b
        c.scale.z = 1.45 - t - (1.06 - b)
      })
    if (coilMat.current) coilMat.current.emissiveIntensity = k.current * 0.35
  })

  return (
    <group>
      <Part id="carcasa" offset={[-7.5, 0, -3]} labelAt={[-CW / 2 - 0.3, 2.6, 0]}>
        <ContactorHousing />
      </Part>
      <Part id="nucleo" offset={[0, 0, -2.6]} labelAt={[-1.8, -1.2, -2.6]}>
        <group position={[0, 0, -3.4]}>
          <ECore facing={1} />
        </group>
        {/* espiras de sombra en las patas exteriores */}
        {[-1.15, 1.15].map((x) => (
          <mesh key={x} position={[x, 0, -1.63]} rotation={[0, 0, Math.PI / 4]}>
            <torusGeometry args={[0.32, 0.04, 4, 4]} />
            <meshStandardMaterial color="#c8794a" metalness={0.85} roughness={0.35} />
          </mesh>
        ))}
      </Part>
      <Part id="bobina" offset={[0, -0.2, 0]} labelAt={[0, 1.9, -2.2]}>
        <RoundedBox args={[1.76, 2.5, 1.1]} radius={0.12} smoothness={3} position={[0, 0, -2.25]}>
          <meshStandardMaterial ref={coilMat} color="#b8662e" emissive="#ff6a10" emissiveIntensity={0} metalness={0.7} roughness={0.38} />
        </RoundedBox>
        {[-2.85, -1.65].map((z) => (
          <mesh key={z} position={[0, 0, z]}>
            <boxGeometry args={[1.76, 2.75, 0.08]} />
            <meshStandardMaterial color="#26292c" roughness={0.6} />
          </mesh>
        ))}
        {/* hilos de la bobina hasta A1 y A2 */}
        {[-1, 1].map((sx) => (
          <Wire
            key={sx}
            points={[
              [sx * 0.5, 1.3, -2.3],
              [sx * 0.7, 1.5, -1.5],
              [sx * COIL_X, 1.45, 1.0],
              [sx * COIL_X, 1.35, CFZ - 0.55],
            ]}
            radius={0.025}
            color="#c8794a"
          />
        ))}
      </Part>
      <Part id="armadura" offset={[0, 0, 1.4]} labelAt={[-1.6, 1.1, -0.7]}>
        <group ref={arm}>
          <group position={[0, 0, -0.2]}>
            <ECore facing={-1} legL={0.5} />
          </group>
        </group>
      </Part>
      <Part id="resortes" offset={[0, 3.6, -0.6]} labelAt={[2.3, 0.6, -1.8]}>
        <group ref={springs}>
          {[-1.85, 1.85].map((x) => (
            <mesh key={x} geometry={retSpring} position={[x, 0, -3.3]}>
              <meshStandardMaterial {...metal} />
            </mesh>
          ))}
        </group>
      </Part>
      <Part id="portacontactos" offset={[0, -3.8, 2.4]} labelAt={[-2.4, -0.9, 1.2]}>
        <group ref={car}>
          {/* placa trasera unida a la armadura */}
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[4.1, 1.8, 0.3]} />
            <meshStandardMaterial color="#3d4247" roughness={0.55} />
          </mesh>
          {/* columnas entre polos */}
          {[-0.9, 0, 0.9, 1.85, -1.85].map((x) => (
            <mesh key={x} position={[x, 0, 0.78]}>
              <boxGeometry args={[0.18, 0.7, 1.36]} />
              <meshStandardMaterial color="#3d4247" roughness={0.55} />
            </mesh>
          ))}
          {/* placa delantera y pulsador de prueba / indicador */}
          <mesh position={[0, 0, 1.57]}>
            <boxGeometry args={[4.1, 1.1, 0.24]} />
            <meshStandardMaterial color="#3d4247" roughness={0.55} />
          </mesh>
          <mesh position={[0, -0.3, (1.69 + CFZ + 0.08) / 2]}>
            <boxGeometry args={[0.85, 0.55, CFZ + 0.08 - 1.69]} />
            <meshStandardMaterial color="#4a5056" roughness={0.5} />
          </mesh>
        </group>
      </Part>
      <Part id="contactosMoviles" offset={[0, 0, 4.6]} labelAt={[-0.9, 1.6, 1.1]}>
        <group ref={bridges}>
          {POLES.map((x) => (
            <Bridge key={x} x={x} />
          ))}
        </group>
        <group ref={cSprings}>
          {POLES.map((x) => (
            <mesh key={x} geometry={conSpring} position={[x, 0, 1.06]}>
              <meshStandardMaterial {...metal} />
            </mesh>
          ))}
        </group>
      </Part>
      <Part id="contactosFijos" offset={[0, 0, 0.6]} labelAt={[-1.35, -1.7, 0.4]}>
        {POLES.map((x) => (
          <FixedContact key={x} x={x} />
        ))}
      </Part>
      <Part id="auxiliar" offset={[3.0, 0, 2.0]} labelAt={[AUX_X + 0.4, 1.5, 1.0]}>
        <FixedContact x={AUX_X} w={0.24} />
        <group ref={aux}>
          <Bridge x={AUX_X} w={0.24} />
        </group>
      </Part>
      <Part id="bornes" offset={[0, 0, 2.6]} labelAt={[0.4, 3.4, C_HOLE_Z]}>
        {POLES.concat([AUX_X]).flatMap((x) =>
          [-1, 1].map((sy) => (
            <group key={`${x}${sy}`}>
              <FrontScrew position={[x, sy * C_SCREW_Y, CSZ - 0.06]} r={0.19} />
              <mesh position={[x, sy * (CH / 2 - 0.45), C_HOLE_Z]}>
                <boxGeometry args={[0.46, 0.55, 0.55]} />
                <meshStandardMaterial {...tinned} />
              </mesh>
            </group>
          )),
        )}
      </Part>
      <Part id="bornesBobina" offset={[0, 2.2, 2.8]} labelAt={[0, 2.0, CFZ]}>
        {[-COIL_X, COIL_X].map((x) => (
          <group key={x}>
            <FrontScrew position={[x, COIL_Y, CFZ - 0.06]} r={0.18} />
            <mesh position={[x, CC - 0.4, CFZ - 0.45]}>
              <boxGeometry args={[0.42, 0.5, 0.5]} />
              <meshStandardMaterial {...tinned} />
            </mesh>
          </group>
        ))}
      </Part>
      <Part id="riel" offset={[0, 0, -3]} labelAt={[-4, 0, CB - 0.4]}>
        <group position={[0, 0, CB]}>
          <DinRail length={10} />
        </group>
      </Part>
    </group>
  )
}

/* ================================================================== */
/* Pulsadores, hongo de emergencia y lámpara piloto (Ø 22 mm)          */
/* ================================================================== */

const PB_X = [-6.75, -2.25, 2.25, 6.75]
const PB_Y = 0.4
const PANEL_T = 0.2

export const LAMP_COLOR_OPTIONS = [
  { value: 'verde', label: 'Verde', color: '#2fd655', off: '#1d5a2c' },
  { value: 'rojo', label: 'Rojo', color: '#ff2a1f', off: '#6e1712' },
  { value: 'amarillo', label: 'Amarillo', color: '#ffc21a', off: '#7a5d12' },
  { value: 'blanco', label: 'Blanco', color: '#f4f1e6', off: '#8d8b84' },
  { value: 'azul', label: 'Azul', color: '#3b8cff', off: '#1a3466' },
] as const
export type LampColor = (typeof LAMP_COLOR_OPTIONS)[number]['value']

/** Anima suavemente un valor 0..1 hacia el objetivo y avisa en cada cuadro. */
function useAnimated(target: boolean, speed: number, apply: (k: number, rising: boolean) => void) {
  const k = useRef(target ? 1 : 0)
  useFrame((_, dt) => {
    const t = target ? 1 : 0
    k.current += (t - k.current) * (1 - Math.exp(-dt * speed))
    apply(k.current, target)
  })
}

function Bezel() {
  const geo = useMemo(
    () =>
      latheGeometry([
        [1.12, 0],
        [1.5, 0],
        [1.5, 0.1],
        [1.46, 0.28],
        [1.32, 0.4],
        [1.14, 0.42],
        [1.12, 0.3],
      ], 48),
    [],
  )
  return (
    <mesh geometry={geo} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <meshStandardMaterial {...metal} roughness={0.18} side={THREE.DoubleSide} />
    </mesh>
  )
}

/** Botón rasante con símbolo (I verde / O rojo). */
function FlushButton({ color, symbol, pressed }: { color: string; symbol: 'I' | 'O'; pressed: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useAnimated(pressed, 18, (k) => {
    if (ref.current) ref.current.position.z = 0.1 - k * 0.32
  })
  const tex = useCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = color
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#ffffff'
      ctx.fillStyle = '#ffffff'
      ctx.lineWidth = 16
      if (symbol === 'I') ctx.fillRect(w / 2 - 9, h * 0.28, 18, h * 0.44)
      else {
        ctx.beginPath()
        ctx.arc(w / 2, h / 2, h * 0.2, 0, Math.PI * 2)
        ctx.stroke()
      }
    },
    [color, symbol],
  )
  return (
    <group ref={ref}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.0]}>
        <cylinderGeometry args={[1.08, 1.08, 0.5, 40]} />
        <meshPhysicalMaterial color={color} roughness={0.35} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.251]}>
        <circleGeometry args={[1.0, 40]} />
        <meshPhysicalMaterial map={tex} roughness={0.35} clearcoat={0.6} />
      </mesh>
    </group>
  )
}

function Mushroom({ latched }: { latched: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useAnimated(latched, 10, (k, on) => {
    const g = ref.current
    if (!g) return
    g.position.z = 0.55 - k * 0.38
    // al desenclavar se gira la cabeza (en sentido de las flechas) y el resorte la empuja hacia afuera
    g.rotation.z = on ? 0 : -Math.sin(Math.PI * k) * 0.7
  })
  const head = useMemo(
    () =>
      latheGeometry([
        [0.62, 0],
        [0.62, 0.45],
        [1.6, 0.55],
        [1.95, 0.72],
        [2.0, 0.92],
        [1.86, 1.18],
        [1.3, 1.38],
        [0.6, 1.46],
        [0, 1.48],
      ], 56),
    [],
  )
  const arrows = useCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.lineWidth = 9
      for (const a0 of [0, Math.PI]) {
        ctx.beginPath()
        ctx.arc(w / 2, h / 2, 84, a0 + 0.3, a0 + 2.2)
        ctx.stroke()
        const a = a0 + 2.2
        const x = w / 2 + Math.cos(a) * 84
        const y = h / 2 + Math.sin(a) * 84
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(a + Math.PI / 2)
        ctx.beginPath()
        ctx.moveTo(14, 0)
        ctx.lineTo(-10, -14)
        ctx.lineTo(-10, 14)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
    },
    [],
  )
  return (
    <group ref={ref}>
      <mesh geometry={head} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <meshPhysicalMaterial color="#d3241b" roughness={0.3} clearcoat={0.7} />
      </mesh>
      <mesh position={[0, 0, 1.485]}>
        <circleGeometry args={[1.05, 40]} />
        <meshBasicMaterial map={arrows} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

function EmergencyLegend() {
  const tex = useCanvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#f4c514'
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1b1b1b'
      ctx.font = 'bold 38px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const text = 'PARADA DE EMERGENCIA'
      const r = 220
      const span = 2.3
      for (let i = 0; i < text.length; i++) {
        const a = -Math.PI / 2 - span / 2 + (span * (i + 0.5)) / text.length
        ctx.save()
        ctx.translate(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r)
        ctx.rotate(a + Math.PI / 2)
        ctx.fillText(text[i], 0, 0)
        ctx.restore()
      }
    },
    [],
  )
  return (
    <mesh position={[0, 0, 0.012]}>
      <circleGeometry args={[2.45, 64]} />
      <meshStandardMaterial map={tex} transparent roughness={0.5} />
    </mesh>
  )
}

function Lamp({ color, off, on }: { color: string; off: string; on: boolean }) {
  const geo = useMemo(
    () =>
      latheGeometry([
        [1.1, 0],
        [1.1, 0.38],
        [0.98, 0.58],
        [0.62, 0.74],
        [0, 0.8],
      ], 40),
    [],
  )
  return (
    <group>
      <mesh geometry={geo} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.05]}>
        <meshPhysicalMaterial
          color={on ? color : off}
          emissive={color}
          emissiveIntensity={on ? 0.75 : 0}
          transparent
          opacity={0.93}
          roughness={0.22}
          clearcoat={1}
        />
      </mesh>
      {on && <pointLight position={[0, 0, 1.6]} color={color} intensity={2.5} distance={4} />}
    </group>
  )
}

type BlockKind = 'NA' | 'NC' | 'LED'

/** Bloque de contacto que se engancha atrás (con ventanas transparentes para ver el contacto). */
function ContactBlock({ kind, pressed, ledColor = '#fff', ledOn = false }: { kind: BlockKind; pressed: boolean; ledColor?: string; ledOn?: boolean }) {
  const z0 = -0.75 // frente del bloque
  const z1 = -3.15 // parte de atrás
  const bridge = useRef<THREE.Group>(null)
  const spring = useRef<THREE.Mesh>(null)
  const springGeo = useMemo(() => springGeometry(0.16, 0.025, 6), [])
  const na = kind === 'NA'
  const rest = na ? -1.35 : -1.58 // posición del puente en reposo
  const fixedZ = na ? -1.72 : -1.46
  useAnimated(pressed, 18, (k) => {
    // el NA se detiene al tocar los contactos fijos; el NC se separa de ellos
    const z = rest - Math.min(k * 0.36, na ? 0.21 : 0.36)
    if (bridge.current) bridge.current.position.z = z
    if (spring.current) {
      spring.current.position.z = z1 + 0.4
      spring.current.scale.z = z - 0.06 - (z1 + 0.4)
    }
  })
  const tag = useCanvasTexture(
    128,
    336,
    (ctx, w, h) => {
      ctx.fillStyle = '#1e2124'
      ctx.fillRect(0, 0, w, h)
      const c = kind === 'NA' ? '#2bb24c' : kind === 'NC' ? '#e0322a' : '#f2f2f2'
      ctx.fillStyle = c
      ctx.fillRect(0, h / 2 - 34, w, 68)
      ctx.fillStyle = kind === 'LED' ? '#111' : '#fff'
      ctx.font = 'bold 40px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(kind === 'NA' ? 'NO' : kind === 'NC' ? 'NC' : 'LED', w / 2, h / 2 + 2)
      ctx.fillStyle = '#f2f2f2'
      ctx.font = 'bold 36px Arial, sans-serif'
      const [a, b] = kind === 'NA' ? ['13', '14'] : kind === 'NC' ? ['11', '12'] : ['X1', 'X2']
      ctx.fillText(a, w / 2, 26)
      ctx.fillText(b, w / 2, h - 26)
    },
    [kind],
  )
  const body = '#1e2124'
  const W = 1.15
  const H = 2.9
  const D = z0 - z1
  return (
    <group>
      {/* paredes opacas: arriba, abajo, frente y tapa trasera */}
      {[-1, 1].map((sy) => (
        <mesh key={sy} position={[0, (sy * (H - 0.12)) / 2, (z0 + z1) / 2]}>
          <boxGeometry args={[W, 0.12, D]} />
          <meshStandardMaterial color={body} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 0, z0 - 0.06]}>
        <boxGeometry args={[W, H, 0.12]} />
        <meshStandardMaterial color={body} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, z1 + 0.2]}>
        <boxGeometry args={[W, H, 0.4]} />
        <meshStandardMaterial color={body} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, z1 - 0.001]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[W - 0.08, H - 0.08]} />
        <meshStandardMaterial map={tag} roughness={0.6} />
      </mesh>
      {/* tornillos de conexión atrás */}
      {[-1, 1].map((sy) => (
        <Screw key={sy} position={[0, sy * 0.8, z1 - 0.02]} r={0.2} rotation={[-Math.PI / 2, 0, 0]} />
      ))}
      {kind === 'LED' ? (
        <>
          {/* placa con el LED y su resistencia, mirando al frente */}
          <mesh position={[0, 0, -1.6]}>
            <boxGeometry args={[0.9, 2.4, 0.08]} />
            <meshStandardMaterial color="#1c5e33" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, z0 + 0.12]}>
            <sphereGeometry args={[0.28, 20, 12]} />
            <meshStandardMaterial color={ledOn ? ledColor : '#ddd'} emissive={ledColor} emissiveIntensity={ledOn ? 2 : 0} />
          </mesh>
          <mesh position={[0, 0, (z0 + 0.12 - 1.6) / 2]}>
            <boxGeometry args={[0.06, 0.06, 1.6 - 0.12 + z0]} />
            <meshStandardMaterial {...tinned} />
          </mesh>
        </>
      ) : (
        <>
          {/* contactos fijos: desde los bornes hasta las pastillas */}
          {[-1, 1].map((sy) => (
            <group key={sy}>
              <mesh position={[0, sy * 0.8, (z1 + 0.4 + fixedZ) / 2]}>
                <boxGeometry args={[0.36, 0.08, fixedZ - z1 - 0.4]} />
                <meshStandardMaterial color="#c8794a" metalness={0.85} roughness={0.35} />
              </mesh>
              <mesh position={[0, sy * 0.8, fixedZ + (na ? 0.04 : -0.04)]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.13, 0.13, 0.06, 14]} />
                <meshStandardMaterial color="#e4e6e8" metalness={0.95} roughness={0.2} />
              </mesh>
            </group>
          ))}
          {/* puente móvil con su vástago y el resorte */}
          <group ref={bridge} position={[0, 0, rest]}>
            <mesh>
              <boxGeometry args={[0.32, 2.0, 0.08]} />
              <meshStandardMaterial color="#c8794a" metalness={0.85} roughness={0.35} />
            </mesh>
            {[-1, 1].map((sy) => (
              <mesh key={sy} position={[0, sy * 0.8, na ? -0.06 : 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.12, 0.12, 0.05, 14]} />
                <meshStandardMaterial color="#e4e6e8" metalness={0.95} roughness={0.2} />
              </mesh>
            ))}
            <mesh position={[0, 0, (z0 - rest) / 2]}>
              <boxGeometry args={[0.22, 0.22, z0 - rest]} />
              <meshStandardMaterial color="#e9e6dc" roughness={0.6} />
            </mesh>
          </group>
          <mesh ref={spring} geometry={springGeo} position={[0, 0, z1 + 0.4]}>
            <meshStandardMaterial {...metal} />
          </mesh>
        </>
      )}
      {/* ventanas laterales transparentes */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[(sx * W) / 2, 0, (z0 + z1) / 2]} rotation={[0, (sx * Math.PI) / 2, 0]}>
          <planeGeometry args={[D, H]} />
          <meshPhysicalMaterial color="#d6e2ea" transparent opacity={0.22} roughness={0.05} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

/** Adaptador de fijación (traba el aparato contra la chapa por detrás). */
function Collar() {
  return (
    <group>
      <RoundedBox args={[2.9, 2.9, 0.5]} radius={0.22} smoothness={3} position={[0, 0, -PANEL_T - 0.25]}>
        <meshStandardMaterial color="#26292c" roughness={0.55} />
      </RoundedBox>
      <mesh position={[0, 0, -PANEL_T + 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.08, 1.08, 0.5, 32]} />
        <meshStandardMaterial color="#2e3236" roughness={0.5} />
      </mesh>
      {/* tornillo de ajuste del adaptador */}
      <Screw position={[0, 1.46, -PANEL_T - 0.25]} r={0.12} />
    </group>
  )
}

export function PushbuttonsModel({
  green,
  red,
  estop,
  lampColor,
  lampOn,
}: {
  green: boolean
  red: boolean
  estop: boolean
  lampColor: LampColor
  lampOn: boolean
}) {
  const lamp = LAMP_COLOR_OPTIONS.find((o) => o.value === lampColor) ?? LAMP_COLOR_OPTIONS[0]
  const S = 100
  const panel = useCanvasTexture(
    1750,
    620,
    (ctx, w, h) => {
      const fx = (x: number) => (x + 8.75) * S
      const fy = (y: number) => (3.0 - y) * S
      ctx.fillStyle = '#a9adaa'
      ctx.fillRect(0, 0, w, h)
      const names = ['MARCHA', 'PARADA', 'EMERGENCIA', 'EN SERVICIO']
      names.forEach((n, i) => {
        // portarrótulo
        ctx.fillStyle = '#1f2326'
        ctx.beginPath()
        ctx.roundRect(fx(PB_X[i] - 1.55), fy(-2.2), 3.1 * S, 0.62 * S, 8)
        ctx.fill()
        ctx.fillStyle = '#f3f3f0'
        ctx.font = `bold ${0.34 * S}px Arial, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(n, fx(PB_X[i]), fy(-2.51))
      })
    },
    [],
  )
  const pos = (i: number): Vec3 => [PB_X[i], PB_Y, 0]
  return (
    <group position={[0, -0.4, 0]}>
      <Part id="chapa" offset={[0, 0, 0]} labelAt={[-8.2, 3.3, 0]}>
        <mesh position={[0, -0.1, -PANEL_T / 2]} castShadow>
          <boxGeometry args={[17.5, 6.2, PANEL_T]} />
          <meshStandardMaterial color="#a9adaa" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.1, 0.001]}>
          <planeGeometry args={[17.5, 6.2]} />
          <meshStandardMaterial map={panel} metalness={0.3} roughness={0.5} />
        </mesh>
      </Part>
      <Part id="marcha" offset={[0, 0, 2.4]} position={pos(0)} labelAt={[0, 2.0, 0.6]}>
        <Bezel />
        <FlushButton color="#1d9a43" symbol="I" pressed={green} />
      </Part>
      <Part id="parada" offset={[0, 0, 2.4]} position={pos(1)} labelAt={[0, 2.0, 0.6]}>
        <Bezel />
        <FlushButton color="#cf241c" symbol="O" pressed={red} />
      </Part>
      <Part id="hongo" offset={[0, 0, 2.6]} position={pos(2)} labelAt={[0, 2.9, 1.2]}>
        <EmergencyLegend />
        <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.3, 1.45, 0.6, 40]} />
          <meshStandardMaterial color="#1f2224" roughness={0.5} />
        </mesh>
        <Mushroom latched={estop} />
      </Part>
      <Part id="lampara" offset={[0, 0, 2.4]} position={pos(3)} labelAt={[0, 2.0, 0.6]}>
        <Bezel />
        <Lamp color={lamp.color} off={lamp.off} on={lampOn} />
      </Part>
      <Part id="adaptadores" offset={[0, 4.4, -1.8]} labelAt={[-6.75, 2.1, -0.6]}>
        {PB_X.map((x) => (
          <group key={x} position={[x, PB_Y, 0]}>
            <Collar />
          </group>
        ))}
      </Part>
      <Part id="bloqueNA" offset={[0, -6.2, -2.4]} position={pos(0)} labelAt={[0, -1.9, -2]}>
        <ContactBlock kind="NA" pressed={green} />
      </Part>
      <Part id="bloqueNC" offset={[0, -6.2, -2.4]} labelAt={[0, -1.5, -2]}>
        <group position={pos(1)}>
          <ContactBlock kind="NC" pressed={red} />
        </group>
        <group position={pos(2)}>
          <ContactBlock kind="NC" pressed={estop} />
        </group>
      </Part>
      <Part id="bloqueLed" offset={[0, -6.2, -2.4]} position={pos(3)} labelAt={[0, -1.9, -2]}>
        <ContactBlock kind="LED" pressed={false} ledColor={lamp.color} ledOn={lampOn} />
      </Part>
    </group>
  )
}

/* ================================================================== */
/* Guardamotor (45 × 97 × 97 mm, tipo SIRIUS 3RV2 tamaño S00)          */
/* ================================================================== */

export type BreakerState = 'off' | 'on' | 'trip'
export type TripCause = 'termico' | 'magnetico' | null

const GW = 4.5
const GH = 9.7
const GB = -4.0 // espalda
const GS = 1.6 // frente de los escalones de bornes
const GF = 3.6 // frente de la parte central
const GC = 3.0 // media altura de la parte central
const G_POLES = [-1.35, 0, 1.35]
const G_SCREW_Y = 3.75
const G_HOLE_Z = GS - 0.6
const KNOB_Y = 0.45
const DIAL: [number, number] = [-0.95, -1.75]
const TEST: [number, number] = [1.0, -1.75]
const KNOB_ANGLE: Record<BreakerState, number> = { off: Math.PI / 2, on: 0, trip: Math.PI / 4 }

const copper = { color: '#c8794a', metalness: 0.85, roughness: 0.35 } as const

function BreakerHousing() {
  const S = 160
  const face = useCanvasTexture(
    Math.round(GW * S),
    Math.round(2 * GC * S),
    (ctx, w, h) => {
      const fx = (x: number) => (x + GW / 2) * S
      const fy = (y: number) => (GC - y) * S
      ctx.fillStyle = '#b9bcb8'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#21272c'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `bold ${0.2 * S}px Arial, sans-serif`
      ctx.fillText('GUARDAMOTOR', fx(0), fy(2.72))
      // posiciones de la manija
      ctx.font = `bold ${0.3 * S}px Arial, sans-serif`
      ctx.fillText('O', fx(0), fy(KNOB_Y + 1.85))
      ctx.fillText('I', fx(1.85), fy(KNOB_Y))
      ctx.font = `bold ${0.17 * S}px Arial, sans-serif`
      ctx.save()
      ctx.translate(fx(1.42), fy(KNOB_Y + 1.42))
      ctx.rotate(Math.PI / 4)
      ctx.fillStyle = '#c0271f'
      ctx.fillText('TRIP', 0, 0)
      ctx.restore()
      // escala de regulación de corriente alrededor del dial
      ctx.fillStyle = '#21272c'
      ctx.font = `${0.13 * S}px Arial, sans-serif`
      const vals = ['4,5', '5', '5,5', '6', '6,3']
      vals.forEach((v, i) => {
        const a = Math.PI * (1.25 - (i / (vals.length - 1)) * 1.5)
        ctx.fillText(v, fx(DIAL[0] + Math.cos(a) * 0.68), fy(DIAL[1] + Math.sin(a) * 0.68))
      })
      ctx.font = `bold ${0.15 * S}px Arial, sans-serif`
      ctx.fillText('Ir [A]', fx(DIAL[0]), fy(DIAL[1] - 0.85))
      ctx.fillText('TEST', fx(TEST[0]), fy(TEST[1] - 0.6))
      ctx.font = `${0.13 * S}px Arial, sans-serif`
      ctx.fillText('I> = 13 × Ir  ·  AC-3 400 V', fx(0), fy(-2.75))
    },
    [],
  )
  const shoulder = (top: boolean) => (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const fx = (x: number) => (x + GW / 2) * S
    const fy = (y: number) => (top ? GH / 2 - y : -GC - y) * S
    ctx.fillStyle = '#a9adaa'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#8f9490'
    for (const x of [-0.68, 0.68]) ctx.fillRect(fx(x) - 3, 0, 6, h)
    ctx.fillStyle = '#21272c'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `bold ${0.2 * S}px Arial, sans-serif`
    const names = top ? ['1/L1', '3/L2', '5/L3'] : ['2/T1', '4/T2', '6/T3']
    G_POLES.forEach((x, i) => ctx.fillText(names[i], fx(x), fy(top ? 4.35 : -4.35)))
  }
  const half = GH / 2 - GC
  const topTex = useCanvasTexture(Math.round(GW * S), Math.round(half * S), shoulder(true), [])
  const botTex = useCanvasTexture(Math.round(GW * S), Math.round(half * S), shoulder(false), [])
  const holes = useBoxes(
    G_POLES.flatMap((x) => [-1, 1].map((sy) => ({ p: [x, (sy * GH) / 2, G_HOLE_Z] as Vec3, s: [0.5, 0.01, 0.55] as Vec3 }))),
    [],
  )
  const recess = useMemo(() => new THREE.RingGeometry(0.22, 0.29, 24), [])
  return (
    <>
      <RoundedBox args={[GW, GH, GS - GB]} radius={0.1} smoothness={3} position={[0, 0, (GB + GS) / 2]} castShadow>
        <meshStandardMaterial color="#a9adaa" roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[GW, 2 * GC, GF - GS + 0.3]} radius={0.14} smoothness={3} position={[0, 0, (GS - 0.3 + GF) / 2]} castShadow>
        <meshStandardMaterial color="#bcbfbb" roughness={0.55} />
      </RoundedBox>
      <mesh position={[0, 0, GF + 0.001]}>
        <planeGeometry args={[GW - 0.14, 2 * GC - 0.14]} />
        <meshStandardMaterial map={face} roughness={0.55} />
      </mesh>
      <mesh position={[0, GC + half / 2, GS + 0.001]}>
        <planeGeometry args={[GW - 0.16, half - 0.06]} />
        <meshStandardMaterial map={topTex} roughness={0.6} />
      </mesh>
      <mesh position={[0, -GC - half / 2, GS + 0.001]}>
        <planeGeometry args={[GW - 0.16, half - 0.06]} />
        <meshStandardMaterial map={botTex} roughness={0.6} />
      </mesh>
      <mesh geometry={holes}>
        <meshStandardMaterial color="#121416" roughness={0.9} />
      </mesh>
      {G_POLES.flatMap((x) =>
        [-1, 1].map((sy) => (
          <mesh key={`${x}${sy}`} geometry={recess} position={[x, sy * G_SCREW_Y, GS + 0.003]}>
            <meshStandardMaterial color="#3a3f44" roughness={0.8} />
          </mesh>
        )),
      )}
      {/* asiento redondo de la manija */}
      <mesh position={[0, KNOB_Y, GF + 0.02]}>
        <circleGeometry args={[1.45, 48]} />
        <meshStandardMaterial color="#2a2e32" roughness={0.6} />
      </mesh>
      <mesh position={[0, -GH / 2 - 0.12, GB + 0.4]}>
        <boxGeometry args={[1.0, 0.25, 0.7]} />
        <meshStandardMaterial color="#b9bcb8" roughness={0.6} />
      </mesh>
    </>
  )
}

export function MotorBreakerModel({ state, setting, cause }: { state: BreakerState; setting: number; cause: TripCause }) {
  const knob = useRef<THREE.Group>(null)
  const dial = useRef<THREE.Group>(null)
  const bridges = useRef<THREE.Group>(null)
  const bimetals = useRef<THREE.Group>(null)
  const plungers = useRef<THREE.Group>(null)
  const latch = useRef<THREE.Group>(null)
  const closed = state === 'on'
  const bend = state === 'trip' && cause === 'termico'
  const pull = state === 'trip' && cause === 'magnetico'
  const solenoid = useMemo(() => springGeometry(0.36, 0.06, 6), [])
  const heater = useMemo(() => springGeometry(0.24, 0.025, 8), [])
  const latchSpring = useMemo(() => springGeometry(0.12, 0.025, 8), [])

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 10)
    const lerp = (o: THREE.Object3D | null, prop: 'z' | 'y' | 'rx' | 'rz', v: number) => {
      if (!o) return
      if (prop === 'rx') o.rotation.x += (v - o.rotation.x) * k
      else if (prop === 'rz') o.rotation.z += (v - o.rotation.z) * k
      else o.position[prop] += (v - o.position[prop]) * k
    }
    lerp(knob.current, 'rz', KNOB_ANGLE[state])
    lerp(dial.current, 'rz', Math.PI * (1.25 - ((setting - 4.5) / 1.8) * 1.5) - Math.PI / 2)
    lerp(bridges.current, 'z', closed ? 0 : 0.45)
    lerp(bimetals.current, 'rx', bend ? 0.22 : 0)
    lerp(plungers.current, 'y', pull ? -0.35 : 0)
    lerp(latch.current, 'rz', state === 'trip' ? 0.5 : 0)
  })

  const knobTex = useCanvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#1b1d20'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#f2f2f2'
      ctx.beginPath()
      ctx.moveTo(w - 30, h / 2)
      ctx.lineTo(w - 90, h / 2 - 34)
      ctx.lineTo(w - 90, h / 2 + 34)
      ctx.closePath()
      ctx.fill()
      ctx.fillRect(40, h / 2 - 7, w - 130, 14)
    },
    [],
  )

  return (
    <group>
      <Part id="carcasa" offset={[-8, 0, -3]} labelAt={[-GW / 2 - 0.3, 4.4, 0]}>
        <BreakerHousing />
      </Part>
      <Part id="manija" offset={[0, 0.6, 3.2]} labelAt={[0, KNOB_Y + 2.0, GF + 0.6]}>
        <group position={[0, KNOB_Y, GF]}>
          <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1.3, 1.38, 0.16, 48]} />
            <meshStandardMaterial color="#1b1d20" roughness={0.5} />
          </mesh>
          <group ref={knob} rotation={[0, 0, KNOB_ANGLE.off]}>
            <RoundedBox args={[2.5, 0.75, 0.7]} radius={0.16} smoothness={3} position={[0, 0, 0.5]} castShadow>
              <meshStandardMaterial color="#1b1d20" roughness={0.45} />
            </RoundedBox>
            <mesh position={[0, 0, 0.851]}>
              <planeGeometry args={[2.2, 0.55]} />
              <meshStandardMaterial map={knobTex} roughness={0.45} />
            </mesh>
          </group>
          {/* eje de la manija hacia el mecanismo */}
          <mesh position={[0, 0, -0.9]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 1.8, 16]} />
            <meshStandardMaterial color="#2a2e32" roughness={0.5} />
          </mesh>
        </group>
      </Part>
      <Part id="regulacion" offset={[-0.6, -0.8, 3.4]} labelAt={[DIAL[0], DIAL[1] - 1.2, GF + 0.3]}>
        <group position={[DIAL[0], DIAL[1], GF]}>
          <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 0.12, 32]} />
            <meshStandardMaterial color="#eceae2" roughness={0.5} />
          </mesh>
          <group ref={dial}>
            <mesh position={[0, 0, 0.125]}>
              <boxGeometry args={[0.7, 0.1, 0.03]} />
              <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[0, 0.3, 0.13]}>
              <boxGeometry args={[0.06, 0.18, 0.02]} />
              <meshStandardMaterial color="#c0271f" />
            </mesh>
          </group>
        </group>
        {/* pulsador de prueba */}
        <group position={[TEST[0], TEST[1], GF]}>
          <RoundedBox args={[0.6, 0.6, 0.16]} radius={0.06} smoothness={2} position={[0, 0, 0.06]}>
            <meshStandardMaterial color="#5c6268" roughness={0.5} />
          </RoundedBox>
        </group>
      </Part>
      <Part id="mecanismo" offset={[0, 0, 1.6]} labelAt={[1.4, 2.0, 2.2]}>
        {/* cerrojo de disparo libre y barra de disparo común a los 3 polos */}
        <group position={[0, KNOB_Y, 1.9]}>
          <mesh>
            <boxGeometry args={[1.6, 1.8, 0.12]} />
            <meshStandardMaterial {...metal} roughness={0.4} />
          </mesh>
          <group ref={latch}>
            <mesh position={[0.5, -0.6, 0.15]}>
              <boxGeometry args={[1.2, 0.2, 0.1]} />
              <meshStandardMaterial color="#7d848b" metalness={0.7} roughness={0.4} />
            </mesh>
          </group>
          <mesh geometry={latchSpring} position={[-0.5, 0.3, 0.1]} rotation={[0, Math.PI / 2, 0]}>
            <meshStandardMaterial {...metal} />
          </mesh>
        </group>
        <mesh position={[0, -1.0, -0.9]}>
          <boxGeometry args={[3.8, 0.25, 0.25]} />
          <meshStandardMaterial color="#3d4247" roughness={0.55} />
        </mesh>
        <mesh position={[0, -0.1, 1.0]}>
          <boxGeometry args={[0.3, 1.8, 1.6]} />
          <meshStandardMaterial color="#3d4247" roughness={0.55} />
        </mesh>
      </Part>
      <Part id="contactos" offset={[0, 0, 0.9]} labelAt={[-2.0, 0.4, 0.5]}>
        {G_POLES.map((x) => (
          <group key={x} position={[x, 0, 0]}>
            {[-1, 1].map((sy) => (
              <group key={sy}>
                <mesh position={[0, sy * 0.75, -0.05]}>
                  <boxGeometry args={[0.4, 0.7, 0.1]} />
                  <meshStandardMaterial {...copper} />
                </mesh>
                <mesh position={[0, sy * 0.55, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.13, 0.13, 0.06, 14]} />
                  <meshStandardMaterial color="#e4e6e8" metalness={0.95} roughness={0.2} />
                </mesh>
              </group>
            ))}
          </group>
        ))}
        <group ref={bridges}>
          {G_POLES.map((x) => (
            <group key={x} position={[x, 0, 0.16]}>
              <mesh>
                <boxGeometry args={[0.36, 1.5, 0.12]} />
                <meshStandardMaterial {...copper} />
              </mesh>
              {[-1, 1].map((sy) => (
                <mesh key={sy} position={[0, sy * 0.55, -0.07]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.12, 0.12, 0.04, 14]} />
                  <meshStandardMaterial color="#e4e6e8" metalness={0.95} roughness={0.2} />
                </mesh>
              ))}
            </group>
          ))}
          {/* portapuentes */}
          <mesh position={[0, 0, 0.42]}>
            <boxGeometry args={[4.0, 0.5, 0.3]} />
            <meshStandardMaterial color="#3d4247" roughness={0.55} />
          </mesh>
        </group>
      </Part>
      <Part id="camaras" offset={[0, 0, -2.6]} labelAt={[-2.0, 0.0, -1.2]}>
        {/* placas apagachispas (dividen el arco en muchos arcos chicos) */}
        {G_POLES.map((x) => (
          <group key={x} position={[x, 0, -0.9]}>
            {Array.from({ length: 7 }, (_, i) => (
              <mesh key={i} position={[0, -0.6 + i * 0.2, 0]}>
                <boxGeometry args={[0.9, 0.05, 1.0]} />
                <meshStandardMaterial color="#5a6066" metalness={0.8} roughness={0.4} />
              </mesh>
            ))}
            <mesh position={[0.48, 0, 0]}>
              <boxGeometry args={[0.06, 1.5, 1.05]} />
              <meshStandardMaterial color="#e3dccb" roughness={0.7} />
            </mesh>
          </group>
        ))}
      </Part>
      <Part id="disparoMagnetico" offset={[0, 2.6, 0.6]} labelAt={[-2.0, 2.0, -0.8]}>
        {G_POLES.map((x) => (
          <group key={x} position={[x, 2.0, -0.8]}>
            <mesh geometry={solenoid} position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <meshStandardMaterial {...copper} />
            </mesh>
            <mesh>
              <cylinderGeometry args={[0.26, 0.26, 1.0, 20]} />
              <meshStandardMaterial color="#e3dccb" roughness={0.7} />
            </mesh>
            {/* chapa que une el borne de arriba con la bobina y el contacto */}
            <mesh position={[0, 0.95, 0.5]}>
              <boxGeometry args={[0.3, 0.1, 1.2]} />
              <meshStandardMaterial {...copper} />
            </mesh>
            <mesh position={[0, -0.85, 0.42]}>
              <boxGeometry args={[0.3, 0.7, 0.1]} />
              <meshStandardMaterial {...copper} />
            </mesh>
          </group>
        ))}
        <group ref={plungers}>
          {G_POLES.map((x) => (
            <mesh key={x} position={[x, 1.65, -0.8]}>
              <cylinderGeometry args={[0.14, 0.14, 1.2, 16]} />
              <meshStandardMaterial {...metal} />
            </mesh>
          ))}
        </group>
      </Part>
      <Part id="bimetales" offset={[0, -2.8, 0.6]} labelAt={[-2.0, -2.0, -0.8]}>
        <group position={[0, -2.75, -1.2]}>
          <group ref={bimetals}>
            {G_POLES.map((x) => (
              <group key={x} position={[x, 0, 0]}>
                {/* dos metales con distinta dilatación pegados */}
                <mesh position={[0, 0.8, -0.045]}>
                  <boxGeometry args={[0.32, 1.6, 0.09]} />
                  <meshStandardMaterial color="#9ea5ac" metalness={0.8} roughness={0.35} />
                </mesh>
                <mesh position={[0, 0.8, 0.045]}>
                  <boxGeometry args={[0.32, 1.6, 0.09]} />
                  <meshStandardMaterial {...copper} />
                </mesh>
                {/* bobinado calefactor */}
                <mesh geometry={heater} position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 1.2]}>
                  <meshStandardMaterial color="#b46a3c" metalness={0.8} roughness={0.4} />
                </mesh>
              </group>
            ))}
          </group>
          {/* chapa hacia el borne de abajo */}
          {G_POLES.map((x) => (
            <mesh key={x} position={[x, -0.3, 0.9]}>
              <boxGeometry args={[0.3, 0.1, 2.2]} />
              <meshStandardMaterial {...copper} />
            </mesh>
          ))}
        </group>
      </Part>
      <Part id="bornes" offset={[0, 0, 2.6]} labelAt={[0.7, 5.4, G_HOLE_Z]}>
        {G_POLES.flatMap((x) =>
          [-1, 1].map((sy) => (
            <group key={`${x}${sy}`}>
              <FrontScrew position={[x, sy * G_SCREW_Y, GS - 0.06]} r={0.22} />
              <mesh position={[x, sy * (GH / 2 - 0.5), G_HOLE_Z]}>
                <boxGeometry args={[0.55, 0.6, 0.6]} />
                <meshStandardMaterial {...tinned} />
              </mesh>
            </group>
          )),
        )}
      </Part>
      <Part id="auxiliar" offset={[-3.2, 0, 0.6]} labelAt={[-GW / 2 - 0.5, 3.6, 0]}>
        <group position={[-GW / 2 - 0.47, 0, 0]}>
          <RoundedBox args={[0.9, 7.2, 5.4]} radius={0.08} smoothness={2} position={[0, 0, GB + 2.7]} castShadow>
            <meshStandardMaterial color="#a9adaa" roughness={0.6} />
          </RoundedBox>
          {[-1, 1].flatMap((sy) =>
            [-0.2, 0.2].map((dx) => <FrontScrew key={`${sy}${dx}`} position={[dx, sy * 3.1, GB + 5.42]} r={0.14} />),
          )}
          <AuxLabel />
        </group>
      </Part>
      <Part id="riel" offset={[0, 0, -3]} labelAt={[-4.4, 0, GB - 0.4]}>
        <group position={[0, 0, GB]}>
          <DinRail length={11} x={-0.5} />
        </group>
      </Part>
    </group>
  )
}

function AuxLabel() {
  const tex = useCanvasTexture(
    96,
    720,
    (ctx, w, h) => {
      ctx.fillStyle = '#a9adaa'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#21272c'
      ctx.font = 'bold 22px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('13 21', w / 2, 30)
      ctx.fillText('14 22', w / 2, h - 16)
      ctx.font = 'bold 20px Arial, sans-serif'
      ctx.fillText('NO', w / 2, h / 2 - 40)
      ctx.fillText('+', w / 2, h / 2)
      ctx.fillText('NC', w / 2, h / 2 + 40)
    },
    [],
  )
  return (
    <mesh position={[0, 0, GB + 5.401]}>
      <planeGeometry args={[0.8, 7.0]} />
      <meshStandardMaterial map={tex} roughness={0.6} />
    </mesh>
  )
}
